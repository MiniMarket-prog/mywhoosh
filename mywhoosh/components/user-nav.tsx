"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useCallback } from "react"

// This is a safer approach that doesn't rely on specific property names
export function UserNav() {
  const { profile, signOut } = useAuth()

  // Get initials safely without assuming specific property names
  const getInitials = useCallback(() => {
    if (!profile) return "U"

    // Try to find a name property - checking common property names
    const nameValue =
      (profile as any).full_name || (profile as any).name || (profile as any).username || (profile as any).email || ""

    if (!nameValue) return "U"

    // If it's an email, use the first letter
    if (nameValue.includes("@")) {
      return nameValue.split("@")[0].charAt(0).toUpperCase()
    }

    // Otherwise try to get initials from a full name
    return nameValue
      .split(" ")
      .map((part: string) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }, [profile])

  // Get display name safely
  const getDisplayName = useCallback(() => {
    if (!profile) return "User"

    return (
      (profile as any).full_name ||
      (profile as any).name ||
      (profile as any).username ||
      (profile as any).email ||
      "User"
    )
  }, [profile])

  // Get role safely
  const getRole = useCallback(() => {
    if (!profile || !(profile as any).role) return "User"

    const role = (profile as any).role
    return `${role.charAt(0).toUpperCase()}${role.slice(1)}`
  }, [profile])

  // Wrap signOut in a try/catch to handle any errors
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...")
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [signOut])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{getRole()}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

