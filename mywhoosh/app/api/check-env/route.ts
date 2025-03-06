import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}

