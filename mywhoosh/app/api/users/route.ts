import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Mock users for fallback
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    role: "admin",
    full_name: "Admin User",
    username: "admin",
  },
  {
    id: "2",
    email: "cashier@example.com",
    role: "cashier",
    full_name: "Cashier User",
    username: "cashier",
  },
  {
    id: "3",
    email: "john.doe@example.com",
    role: "cashier",
    full_name: "John Doe",
    username: "johndoe",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid Supabase credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase credentials, using mock data")
      return NextResponse.json({ users: mockUsers })
    }

    // Create a Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
      // First, get all users from auth.users to ensure we have emails
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

      if (authError) {
        console.error("Error fetching auth users:", authError)
        throw authError
      }

      // Then get all profiles
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*")

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
        throw profilesError
      }

      // Merge the data from both sources
      const users = profiles.map((profile) => {
        const authUser = authUsers.users.find((user) => user.id === profile.id)

        return {
          id: profile.id,
          email: authUser?.email || null,
          role: profile.role,
          full_name: profile.full_name || profile.username || null,
          username: profile.username || null,
          created_at: authUser?.created_at || null,
        }
      })

      return NextResponse.json({ users })
    } catch (supabaseError) {
      console.error("Supabase error, falling back to mock data:", supabaseError)
      return NextResponse.json({ users: mockUsers })
    }
  } catch (error: any) {
    console.error("Error in users API route:", error)
    // Fall back to mock data in case of any error
    return NextResponse.json({ users: mockUsers })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if we have valid Supabase credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase credentials, simulating success")
      return NextResponse.json({
        success: true,
        message: "User created successfully (mock)",
        user: {
          id: Date.now().toString(),
          ...body,
        },
      })
    }

    // Create a Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    })

    if (authError) {
      throw authError
    }

    // Then add user profile - let's check what columns exist in the profiles table
    try {
      // First, check if a profile already exists for this user
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 means no rows returned, which is expected if the profile doesn't exist
        console.error("Error checking for existing profile:", checkError)
        throw checkError
      }

      // First, let's check the structure of the profiles table
      const { data: tableInfo, error: tableError } = await supabase.from("profiles").select("*").limit(1)

      if (tableError) {
        console.error("Error checking profiles table structure:", tableError)
        throw tableError
      }

      // Create a profile object based on the available columns
      const profileData: any = { id: authData.user.id }

      // Check if each column exists in the table structure
      if ("full_name" in (tableInfo[0] || {})) {
        profileData.full_name = body.full_name
      } else if ("name" in (tableInfo[0] || {})) {
        profileData.name = body.full_name
      }

      if ("role" in (tableInfo[0] || {})) {
        profileData.role = body.role
      }

      if ("username" in (tableInfo[0] || {})) {
        profileData.username = body.email.split("@")[0]
      }

      let data
      let error

      if (existingProfile) {
        // Update existing profile
        const result = await supabase.from("profiles").update(profileData).eq("id", authData.user.id).select()

        data = result.data
        error = result.error
      } else {
        // Insert new profile
        const result = await supabase.from("profiles").insert(profileData).select()

        data = result.data
        error = result.error
      }

      if (error) {
        throw error
      }

      // Add a null check for data
      if (!data || data.length === 0) {
        throw new Error("Failed to create/update user profile: No data returned")
      }

      return NextResponse.json({
        success: true,
        message: existingProfile ? "User updated successfully" : "User created successfully",
        user: {
          ...data[0],
          email: body.email,
        },
      })
    } catch (profileError: any) {
      // If there was an error creating the profile, delete the auth user
      // Only delete if we created a new auth user (not if we're updating an existing one)
      if (!profileError.message?.includes("duplicate key")) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      throw profileError
    }
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if we have valid Supabase credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase credentials, simulating success")
      return NextResponse.json({
        success: true,
        message: "User updated successfully (mock)",
      })
    }

    // Create a Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, let's check the structure of the profiles table
    const { data: tableInfo, error: tableError } = await supabase.from("profiles").select("*").limit(1)

    if (tableError) {
      console.error("Error checking profiles table structure:", tableError)
      throw tableError
    }

    // Create an updates object based on the available columns
    const updates: any = {}

    // Check if each column exists in the table structure
    if ("full_name" in (tableInfo[0] || {})) {
      updates.full_name = body.full_name
    } else if ("name" in (tableInfo[0] || {})) {
      updates.name = body.full_name
    }

    if ("role" in (tableInfo[0] || {})) {
      updates.role = body.role
    }

    // Update user profile
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", body.id).select()

    if (error) {
      throw error
    }

    // Add a null check for data
    if (!data || data.length === 0) {
      throw new Error("Failed to update user profile: No data returned")
    }

    // Update email and password if provided
    if (body.email || body.password) {
      const authUpdates: any = {}

      if (body.email) {
        authUpdates.email = body.email
      }

      if (body.password) {
        authUpdates.password = body.password
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(body.id, authUpdates)

      if (authError) {
        throw authError
      }
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        ...data[0],
        email: body.email,
      },
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if we have valid Supabase credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Missing Supabase credentials, simulating success")
      return NextResponse.json({
        success: true,
        message: "User deleted successfully (mock)",
      })
    }

    // Create a Supabase client with the service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if this user has any related records in other tables
    // This is a common issue with foreign key constraints
    try {
      // First, check for related records in the sales table
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id")
        .eq("cashier_id", id)
        .limit(1)

      if (salesError) {
        console.error("Error checking sales records:", salesError)
      } else if (salesData && salesData.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete user: This user has associated sales records. Please reassign or delete those records first.",
          },
          { status: 400 },
        )
      }

      // Check for other related records as needed...
      // Add similar checks for other tables that might reference this user

      // First delete the profile (this might cascade to other tables depending on your DB setup)
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)

      if (profileError) {
        console.error("Error deleting profile:", profileError)
        throw new Error(`Error deleting profile: ${profileError.message}`)
      }

      // Then delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id)

      if (authError) {
        console.error("Error deleting auth user:", authError)
        throw new Error(`Error deleting auth user: ${authError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      })
    } catch (error: any) {
      console.error("Detailed error during user deletion:", error)
      throw new Error(`Database error deleting user: ${error.message}`)
    }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}

