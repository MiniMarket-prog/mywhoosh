import { type NextRequest, NextResponse } from "next/server"

// Use environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Mock users for development
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    role: "admin",
    full_name: "Admin User",
    username: "admin",
    created_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    email: "cashier@example.com",
    role: "cashier",
    full_name: "Cashier User",
    username: "cashier",
    created_at: "2023-01-15T00:00:00Z",
  },
  {
    id: "3",
    email: "john.doe@example.com",
    role: "cashier",
    full_name: "John Doe",
    username: "johndoe",
    created_at: "2023-02-01T00:00:00Z",
  },
]

export async function GET(request: NextRequest) {
  try {
    // For development, return mock users
    return NextResponse.json({ users: mockUsers })

    // In production, you would use Supabase to fetch users
    /*
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ users: data });
    */
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // For development, just return success
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
      },
    })

    // In production, you would use Supabase to create a user
    /*
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });
    
    if (authError) {
      throw authError;
    }
    
    // Then add user profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: body.full_name,
        role: body.role,
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User created successfully",
      user: data
    });
    */
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // For development, just return success
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    })

    // In production, you would use Supabase to update a user
    /*
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update user profile
    const updates: any = {
      full_name: body.full_name,
      role: body.role,
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Update password if provided
    if (body.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        body.id,
        { password: body.password }
      );
      
      if (authError) {
        throw authError;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully",
      user: data
    });
    */
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

    // For development, just return success
    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })

    // In production, you would use Supabase to delete a user
    /*
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      throw authError;
    }
    
    // Delete user profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User deleted successfully" 
    });
    */
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}

