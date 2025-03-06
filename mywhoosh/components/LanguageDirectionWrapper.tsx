"use client"

import type React from "react"

import { useLanguage } from "@/contexts/language-context"

export function LanguageDirectionWrapper({ children }: { children: React.ReactNode }) {
  const { dir } = useLanguage()

  return <div dir={dir}>{children}</div>
}

