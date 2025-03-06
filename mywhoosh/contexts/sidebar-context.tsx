"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize with localStorage value if available, otherwise default to false
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load the saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev
      // Save to localStorage
      localStorage.setItem("sidebar-collapsed", String(newState))
      return newState
    })
  }

  return <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>{children}</SidebarContext.Provider>
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

