import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, role, full_name } = await request.json()

    // Create a Supabase client with the service role key
    const supabaseAdmin = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Check if user already exists by listing users and filtering
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 })
    }

    const existingUser = authUsers.users.find((user) => user.email === email)

    let userId

    if (existingUser) {
      // User exists, update their password if needed
      userId = existingUser.id

      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
        })
      }
    } else {
      // Create new user in Auth
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 400 })
      }

      userId = userData.user.id
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name,
          username: email,
          role,
        })
        .eq("id", userId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    } else {
      // Create new profile
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: userId,
        full_name,
        username: email,
        role,
      })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// Add PUT method for updating users
export async function PUT(request: Request) {
  try {
    const { id, email, password, role, full_name } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabaseAdmin = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Update user in Auth if email or password changed
    if (email || password) {
      const updateData: any = {}
      if (email) updateData.email = email
      if (password) updateData.password = password

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData)

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        username: email, // Update username if email changed
        role,
      })
      .eq("id", id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// Add DELETE method for deleting users
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabaseAdmin = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Delete profile first (due to foreign key constraints)
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Delete user from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createRouteHandlerClient(
      {
        cookies,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    )

    // Get all users from Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin.from("profiles").select("*")

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 400 })
    }

    // Merge the data
    const users = authUsers.users.map((user) => {
      const profile = profiles.find((p) => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        role: profile?.role || "cashier",
        full_name: profile?.full_name,
        username: profile?.username,
        created_at: user.created_at,
      }
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

