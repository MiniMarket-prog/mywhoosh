"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define the available languages
export type Language = "en" | "ar" | "es" | "fr" | "de"

// Define the translations interface
export interface Translations {
  [key: string]: string
}

// Define the language context type
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

// Create the language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// English translations (default)
const enTranslations: Translations = {
  // Common
  "app.name": "Mini Market",
  "app.logout": "Logout",

  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.inventory": "Inventory",
  "nav.pos": "POS",
  "nav.sales": "Sales",
  "nav.customers": "Customers",
  "nav.reports": "Reports",
  "nav.settings": "Settings",
  "nav.setup": "Setup",

  // Settings
  "settings.title": "Settings",
  "settings.subtitle": "Manage your store settings and preferences.",
  "settings.save": "Save Settings",
  "settings.reset": "Reset",
  "settings.saving": "Saving...",

  // Settings tabs
  "settings.tab.general": "General",
  "settings.tab.receipt": "Receipt",
  "settings.tab.tax": "Tax",
  "settings.tab.preferences": "Preferences",
  "settings.tab.backup": "Backup & Restore",

  // General settings
  "settings.general.title": "General Settings",
  "settings.general.description": "Manage your store information and basic settings.",
  "settings.general.storeName": "Store Name",
  "settings.general.currency": "Currency",
  "settings.general.address": "Address",
  "settings.general.phone": "Phone",
  "settings.general.email": "Email",

  // Preferences
  "settings.preferences.title": "User Preferences",
  "settings.preferences.description": "Customize your application experience.",
  "settings.preferences.theme": "Theme",
  "settings.preferences.language": "Language",
  "settings.preferences.dateFormat": "Date Format",
  "settings.preferences.timeFormat": "Time Format",

  // Languages
  "language.english": "English",
  "language.arabic": "Arabic",
  "language.spanish": "Spanish",
  "language.french": "French",
  "language.german": "German",

  // Themes
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",
}

// Arabic translations
const arTranslations: Translations = {
  // Common
  "app.name": "ميني ماركت",
  "app.logout": "تسجيل الخروج",

  // Navigation
  "nav.dashboard": "لوحة التحكم",
  "nav.inventory": "المخزون",
  "nav.pos": "نقطة البيع",
  "nav.sales": "المبيعات",
  "nav.customers": "العملاء",
  "nav.reports": "التقارير",
  "nav.settings": "الإعدادات",
  "nav.setup": "الإعداد",

  // Settings
  "settings.title": "الإعدادات",
  "settings.subtitle": "إدارة إعدادات المتجر والتفضيلات.",
  "settings.save": "حفظ الإعدادات",
  "settings.reset": "إعادة تعيين",
  "settings.saving": "جاري الحفظ...",

  // Settings tabs
  "settings.tab.general": "عام",
  "settings.tab.receipt": "الإيصال",
  "settings.tab.tax": "الضريبة",
  "settings.tab.preferences": "التفضيلات",
  "settings.tab.backup": "النسخ الاحتياطي والاستعادة",

  // General settings
  "settings.general.title": "الإعدادات العامة",
  "settings.general.description": "إدارة معلومات المتجر والإعدادات الأساسية.",
  "settings.general.storeName": "اسم المتجر",
  "settings.general.currency": "العملة",
  "settings.general.address": "العنوان",
  "settings.general.phone": "الهاتف",
  "settings.general.email": "البريد الإلكتروني",

  // Preferences
  "settings.preferences.title": "تفضيلات المستخدم",
  "settings.preferences.description": "تخصيص تجربة التطبيق الخاصة بك.",
  "settings.preferences.theme": "السمة",
  "settings.preferences.language": "اللغة",
  "settings.preferences.dateFormat": "تنسيق التاريخ",
  "settings.preferences.timeFormat": "تنسيق الوقت",

  // Languages
  "language.english": "الإنجليزية",
  "language.arabic": "العربية",
  "language.spanish": "الإسبانية",
  "language.french": "الفرنسية",
  "language.german": "الألمانية",

  // Themes
  "theme.light": "فاتح",
  "theme.dark": "داكن",
  "theme.system": "النظام",
}

// Spanish translations (basic)
const esTranslations: Translations = {
  // Common
  "app.name": "Mini Market",
  "app.logout": "Cerrar sesión",

  // Navigation
  "nav.dashboard": "Panel",
  "nav.inventory": "Inventario",
  "nav.pos": "TPV",
  "nav.sales": "Ventas",
  "nav.customers": "Clientes",
  "nav.reports": "Informes",
  "nav.settings": "Configuración",
  "nav.setup": "Configuración",

  // Settings
  "settings.title": "Configuración",
  "settings.subtitle": "Administre la configuración y preferencias de su tienda.",
  "settings.save": "Guardar configuración",
  "settings.reset": "Restablecer",
  "settings.saving": "Guardando...",
}

// French translations (basic)
const frTranslations: Translations = {
  // Common
  "app.name": "Mini Market",
  "app.logout": "Déconnexion",

  // Navigation
  "nav.dashboard": "Tableau de bord",
  "nav.inventory": "Inventaire",
  "nav.pos": "Caisse",
  "nav.sales": "Ventes",
  "nav.customers": "Clients",
  "nav.reports": "Rapports",
  "nav.settings": "Paramètres",
  "nav.setup": "Configuration",

  // Settings
  "settings.title": "Paramètres",
  "settings.subtitle": "Gérez les paramètres et préférences de votre magasin.",
  "settings.save": "Enregistrer les paramètres",
  "settings.reset": "Réinitialiser",
  "settings.saving": "Enregistrement...",
}

// German translations (basic)
const deTranslations: Translations = {
  // Common
  "app.name": "Mini Market",
  "app.logout": "Abmelden",

  // Navigation
  "nav.dashboard": "Dashboard",
  "nav.inventory": "Inventar",
  "nav.pos": "Kasse",
  "nav.sales": "Verkäufe",
  "nav.customers": "Kunden",
  "nav.reports": "Berichte",
  "nav.settings": "Einstellungen",
  "nav.setup": "Einrichtung",

  // Settings
  "settings.title": "Einstellungen",
  "settings.subtitle": "Verwalten Sie Ihre Geschäftseinstellungen und Präferenzen.",
  "settings.save": "Einstellungen speichern",
  "settings.reset": "Zurücksetzen",
  "settings.saving": "Speichern...",
}

// All translations
const translations: Record<Language, Translations> = {
  en: enTranslations,
  ar: arTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
}

// Language provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Determine text direction based on language
  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr"

  // Fetch the user's language preference from settings
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        const response = await fetch("/api/settings")
        const data = await response.json()

        if (data.settings?.preferences?.language) {
          setLanguage(data.settings.preferences.language as Language)
        }
      } catch (error) {
        console.error("Error fetching language preference:", error)
      }
    }

    fetchLanguagePreference()
  }, [])

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key
  }

  // Update language preference in settings when changed
  const handleSetLanguage = async (newLanguage: Language) => {
    setLanguage(newLanguage)

    try {
      // Update the language preference in settings
      await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "preferences",
          settings: {
            language: newLanguage,
          },
        }),
      })
    } catch (error) {
      console.error("Error updating language preference:", error)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext)

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}

