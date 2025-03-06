"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type Settings = {
  receipt: {
    showLogo: boolean
  }
  tax: {
    taxName: string
  }
  general: {
    email: string
  }
  preferences: {
    language: string
  }
  advanced: {
    debugMode: boolean
    maintenanceMode: boolean
    cacheTimeout: number
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    receipt: { showLogo: true },
    tax: { taxName: "Sale" },
    general: { email: "" },
    preferences: { language: "en" },
    advanced: {
      debugMode: false,
      maintenanceMode: false,
      cacheTimeout: 60,
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    // Check if profile is loaded
    if (profile === undefined) {
      // Still loading profile, don't redirect yet
      return
    }

    // For development/testing purposes, you can comment out this check
    // or modify it to allow access for testing
    // if (profile?.role !== "admin") {
    //   router.push("/dashboard")
    //   return
    // }

    fetchSettings()
  }, [profile, router])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").order("id")

      if (error) throw error

      // Convert array of settings to object
      const settingsObject: Settings = {
        receipt: { showLogo: true },
        tax: { taxName: "Sale" },
        general: { email: "" },
        preferences: { language: "en" },
        advanced: {
          debugMode: false,
          maintenanceMode: false,
          cacheTimeout: 60,
        },
      }

      data.forEach((item) => {
        const value = item.value
        switch (item.id) {
          case "receipt":
            settingsObject.receipt = value
            break
          case "tax":
            settingsObject.tax = value
            break
          case "general":
            settingsObject.general = value
            break
          case "preferences":
            settingsObject.preferences = value
            break
          case "advanced":
            settingsObject.advanced = value
            break
        }
      })

      setSettings(settingsObject)
    } catch (error: any) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = async (id: keyof Settings, value: any) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("settings")
        .update({
          value,
          updated_by: profile?.id,
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
      })

      // Update local state
      setSettings((prev) => ({
        ...prev,
        [id]: value,
      }))

      // If language preference is updated, update the language context
      if (id === "preferences" && value.language) {
        await setLanguage(value.language)
      }
    } catch (error: any) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="receipt">{t("receipt")}</TabsTrigger>
          <TabsTrigger value="tax">{t("tax")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("preferences")}</TabsTrigger>
          <TabsTrigger value="advanced">{t("advanced")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("general.title")}</CardTitle>
              <CardDescription>{t("general.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">{t("contact.email")}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.general.email}
                  onChange={(e) => {
                    const newValue = { ...settings.general, email: e.target.value }
                    updateSetting("general", newValue)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle>{t("receipt.title")}</CardTitle>
              <CardDescription>{t("receipt.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-logo"
                  checked={settings.receipt.showLogo}
                  onCheckedChange={(checked) => {
                    const newValue = { ...settings.receipt, showLogo: checked }
                    updateSetting("receipt", newValue)
                  }}
                />
                <Label htmlFor="show-logo">{t("show.logo")}</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>{t("tax.title")}</CardTitle>
              <CardDescription>{t("tax.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-name">{t("tax.name")}</Label>
                <Input
                  id="tax-name"
                  value={settings.tax.taxName}
                  onChange={(e) => {
                    const newValue = { ...settings.tax, taxName: e.target.value }
                    updateSetting("tax", newValue)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("preferences.title")}</CardTitle>
              <CardDescription>{t("preferences.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t("language")}</Label>
                <select
                  id="language"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.preferences.language}
                  onChange={(e) => {
                    const newValue = { ...settings.preferences, language: e.target.value }
                    updateSetting("preferences", newValue)
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>{t("advanced.title")}</CardTitle>
              <CardDescription>{t("advanced.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debug-mode" className="text-base">
                    {t("debug.mode")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("debug.description")}</p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={settings.advanced.debugMode}
                  onCheckedChange={(checked) => {
                    const newValue = { ...settings.advanced, debugMode: checked }
                    updateSetting("advanced", newValue)
                  }}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode" className="text-base">
                    {t("maintenance.mode")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("maintenance.description")}</p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.advanced.maintenanceMode}
                  onCheckedChange={(checked) => {
                    const newValue = { ...settings.advanced, maintenanceMode: checked }
                    updateSetting("advanced", newValue)
                  }}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="cache-timeout">{t("cache.timeout")}</Label>
                <Input
                  id="cache-timeout"
                  type="number"
                  min="0"
                  max="1440"
                  value={settings.advanced.cacheTimeout}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value) || 0
                    const newValue = { ...settings.advanced, cacheTimeout: value }
                    updateSetting("advanced", newValue)
                  }}
                />
                <p className="text-xs text-muted-foreground">{t("cache.description")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isSaving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("saving")}
        </div>
      )}
    </div>
  )
}

