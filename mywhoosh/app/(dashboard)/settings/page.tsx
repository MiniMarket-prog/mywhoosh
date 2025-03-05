"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage, type Language } from "@/contexts/language-context"
import { Building, Receipt, Percent, User, Database, Moon, Sun, Globe, Save, Undo, Loader2 } from "lucide-react"
import type { AllSettings } from "@/app/api/settings/route"

// Mock settings data for initial state
const defaultSettings: AllSettings = {
  general: {
    storeName: "Mini Market",
    address: "123 Market Street, City, Country",
    phone: "+1 234 567 8900",
    email: "contact@minimarket.com",
    currency: "USD",
  },
  receipt: {
    headerText: "Thank you for shopping at Mini Market!",
    footerText: "Please come again!",
    showLogo: true,
    printReceipt: true,
    emailReceipt: false,
  },
  tax: {
    enableTax: true,
    taxRate: 7.5,
    taxName: "Sales Tax",
    taxIncluded: false,
  },
  preferences: {
    theme: "light",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AllSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const { toast } = useToast()
  const { profile } = useAuth()
  const { t, language, setLanguage, dir } = useLanguage()
  const isAdmin = profile?.role === "admin"
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/settings")
        const data = await response.json()

        if (data.settings) {
          setSettings(data.settings)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings. Using default values.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  // Update the document direction when language changes
  useEffect(() => {
    document.documentElement.dir = dir
  }, [dir])

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [name]: value,
      },
    })
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      receipt: {
        ...settings.receipt,
        [name]: value,
      },
    })
  }

  const handleReceiptSwitchChange = (name: string, checked: boolean) => {
    setSettings({
      ...settings,
      receipt: {
        ...settings.receipt,
        [name]: checked,
      },
    })
  }

  const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings({
      ...settings,
      tax: {
        ...settings.tax,
        [name]: name === "taxRate" ? Number.parseFloat(value as string) : value,
      },
    })
  }

  const handleTaxSwitchChange = (name: string, checked: boolean) => {
    setSettings({
      ...settings,
      tax: {
        ...settings.tax,
        [name]: checked,
      },
    })
  }

  const handlePreferenceChange = (name: string, value: string) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [name]: value,
      },
    })

    // If language preference is changed, update the language context
    if (name === "language") {
      setLanguage(value as Language)
    }
  }

  const handleSaveSettings = async () => {
    setIsProcessing(true)

    try {
      // Save the current section's settings
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: activeTab,
          settings: settings[activeTab as keyof AllSettings],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings")
      }

      toast({
        title: "Settings saved",
        description: data.message || "Your settings have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings(defaultSettings)
      toast({
        title: "Settings reset",
        description: "All settings have been reset to default values. Click Save to apply changes.",
      })
    }
  }

  const handleBackupDatabase = () => {
    // Create a link to download the backup
    const link = document.createElement("a")
    link.href = "/api/backup"
    link.download = `mini-market-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Backup initiated",
      description: "Your backup is being downloaded.",
    })
  }

  // Update the handleRestoreDatabase function
  const handleRestoreDatabase = () => {
    // Trigger the file input click
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Add a function to handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsProcessing(true)

      // Read the file
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string)

          // Send the backup to the restore API
          const response = await fetch("/api/restore", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(backup),
          })

          const result = await response.json()

          if (result.success) {
            toast({
              title: "Restore completed",
              description: "Your database has been restored successfully.",
            })
          } else {
            toast({
              title: "Restore failed",
              description: result.error || "An error occurred during restore.",
              variant: "destructive",
            })
          }
        } catch (error: any) {
          toast({
            title: "Restore failed",
            description: `Error parsing backup file: ${error.message}`,
            variant: "destructive",
          })
        } finally {
          setIsProcessing(false)
        }
      }

      reader.readAsText(file)
    } catch (error: any) {
      toast({
        title: "Restore failed",
        description: `Error reading file: ${error.message}`,
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const fileInput = useRef<HTMLInputElement>(null)

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings} disabled={isProcessing}>
            <Undo className="mr-2 h-4 w-4" />
            {t("settings.reset")}
          </Button>
          <Button onClick={handleSaveSettings} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("settings.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("settings.save")}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Building className="mr-2 h-4 w-4" />
            {t("settings.tab.general")}
          </TabsTrigger>
          <TabsTrigger value="receipt">
            <Receipt className="mr-2 h-4 w-4" />
            {t("settings.tab.receipt")}
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Percent className="mr-2 h-4 w-4" />
            {t("settings.tab.tax")}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <User className="mr-2 h-4 w-4" />
            {t("settings.tab.preferences")}
          </TabsTrigger>
          <TabsTrigger value="backup" disabled={!isAdmin}>
            <Database className="mr-2 h-4 w-4" />
            {t("settings.tab.backup")}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general.title")}</CardTitle>
              <CardDescription>{t("settings.general.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">{t("settings.general.storeName")}</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    value={settings.general.storeName}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("settings.general.currency")}</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => {
                      setSettings({
                        ...settings,
                        general: {
                          ...settings.general,
                          currency: value,
                        },
                      })
                    }}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAD">MAD (DH)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("settings.general.address")}</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={settings.general.address}
                  onChange={handleGeneralChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("settings.general.phone")}</Label>
                  <Input id="phone" name="phone" value={settings.general.phone} onChange={handleGeneralChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.general.email")}</Label>
                  <Input id="email" name="email" value={settings.general.email} onChange={handleGeneralChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Settings</CardTitle>
              <CardDescription>Customize your receipt appearance and behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headerText">Receipt Header</Label>
                <Textarea
                  id="headerText"
                  name="headerText"
                  value={settings.receipt.headerText}
                  onChange={handleReceiptChange}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Receipt Footer</Label>
                <Textarea
                  id="footerText"
                  name="footerText"
                  value={settings.receipt.footerText}
                  onChange={handleReceiptChange}
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showLogo">Show Logo</Label>
                    <p className="text-sm text-muted-foreground">Display your store logo on receipts</p>
                  </div>
                  <Switch
                    id="showLogo"
                    checked={settings.receipt.showLogo}
                    onCheckedChange={(checked) => handleReceiptSwitchChange("showLogo", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="printReceipt">Print Receipt</Label>
                    <p className="text-sm text-muted-foreground">Automatically print receipt after sale</p>
                  </div>
                  <Switch
                    id="printReceipt"
                    checked={settings.receipt.printReceipt}
                    onCheckedChange={(checked) => handleReceiptSwitchChange("printReceipt", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailReceipt">Email Receipt</Label>
                    <p className="text-sm text-muted-foreground">Send receipt to customer email if available</p>
                  </div>
                  <Switch
                    id="emailReceipt"
                    checked={settings.receipt.emailReceipt}
                    onCheckedChange={(checked) => handleReceiptSwitchChange("emailReceipt", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rates and calculation methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableTax">Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">Apply tax to sales</p>
                </div>
                <Switch
                  id="enableTax"
                  checked={settings.tax.enableTax}
                  onCheckedChange={(checked) => handleTaxSwitchChange("enableTax", checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxName">Tax Name</Label>
                  <Input
                    id="taxName"
                    name="taxName"
                    value={settings.tax.taxName}
                    onChange={handleTaxChange}
                    disabled={!settings.tax.enableTax}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.tax.taxRate}
                    onChange={handleTaxChange}
                    disabled={!settings.tax.enableTax}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="taxIncluded">Tax Included in Price</Label>
                  <p className="text-sm text-muted-foreground">Product prices already include tax</p>
                </div>
                <Switch
                  id="taxIncluded"
                  checked={settings.tax.taxIncluded}
                  onCheckedChange={(checked) => handleTaxSwitchChange("taxIncluded", checked)}
                  disabled={!settings.tax.enableTax}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.preferences.title")}</CardTitle>
              <CardDescription>{t("settings.preferences.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">{t("settings.preferences.theme")}</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => handlePreferenceChange("theme", value)}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="mr-2 h-4 w-4" />
                          {t("theme.light")}
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="mr-2 h-4 w-4" />
                          {t("theme.dark")}
                        </div>
                      </SelectItem>
                      <SelectItem value="system">{t("theme.system")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t("settings.preferences.language")}</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) => handlePreferenceChange("language", value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {t("language.english")}
                        </div>
                      </SelectItem>
                      <SelectItem value="ar">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {t("language.arabic")}
                        </div>
                      </SelectItem>
                      <SelectItem value="es">{t("language.spanish")}</SelectItem>
                      <SelectItem value="fr">{t("language.french")}</SelectItem>
                      <SelectItem value="de">{t("language.german")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">{t("settings.preferences.dateFormat")}</Label>
                  <Select
                    value={settings.preferences.dateFormat}
                    onValueChange={(value) => handlePreferenceChange("dateFormat", value)}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">{t("settings.preferences.timeFormat")}</Label>
                  <Select
                    value={settings.preferences.timeFormat}
                    onValueChange={(value) => handlePreferenceChange("timeFormat", value)}
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage your data backup and restoration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="font-medium">Database Backup</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a backup of your entire database. This includes all products, sales, customers, and settings.
                  </p>
                  <Button className="mt-2 w-full sm:w-auto" onClick={handleBackupDatabase}>
                    <Database className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="font-medium">Restore Database</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore your database from a previous backup. This will overwrite all current data.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input type="file" accept=".sql,.json" />
                    <Button variant="outline" onClick={handleRestoreDatabase}>
                      Restore
                    </Button>
                  </div>
                  <input type="file" ref={fileInput} accept=".json" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex flex-col space-y-2">
                  <h3 className="font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Export specific data to CSV format for use in other applications.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button variant="outline" size="sm">
                      Products
                    </Button>
                    <Button variant="outline" size="sm">
                      Sales
                    </Button>
                    <Button variant="outline" size="sm">
                      Customers
                    </Button>
                    <Button variant="outline" size="sm">
                      Inventory
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 text-sm text-muted-foreground">
              <p>
                Note: Regular backups are recommended to prevent data loss. Backups are stored securely and encrypted.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

