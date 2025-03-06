"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Simple translations for demonstration
const translations: Record<string, Record<string, string>> = {
  en: {
    settings: "Settings",
    "settings.description": "Manage your application settings and preferences.",
    general: "General",
    receipt: "Receipt",
    tax: "Tax",
    preferences: "Preferences",
    advanced: "Advanced",
    "general.title": "General Settings",
    "general.description": "Configure general settings for your store.",
    "contact.email": "Contact Email",
    "receipt.title": "Receipt Settings",
    "receipt.description": "Customize how your receipts are printed.",
    "show.logo": "Show Logo on Receipt",
    "tax.title": "Tax Settings",
    "tax.description": "Configure tax-related settings.",
    "tax.name": "Tax Name",
    "preferences.title": "Preferences",
    "preferences.description": "Set your application preferences.",
    language: "Language",
    "advanced.title": "Advanced Settings",
    "advanced.description": "Configure advanced system settings. Use with caution.",
    "debug.mode": "Debug Mode",
    "debug.description": "Enable detailed logging and debugging information",
    "maintenance.mode": "Maintenance Mode",
    "maintenance.description": "Put the application in maintenance mode",
    "cache.timeout": "Cache Timeout (minutes)",
    "cache.description": "Set to 0 to disable caching",
    saving: "Saving changes...",
    dashboard: "Dashboard",
    "point.of.sale": "Point of Sale",
    inventory: "Inventory",
    alerts: "Alerts",
    sales: "Sales",
    reports: "Reports",
    expenses: "Expenses",
    "user.management": "User Management",
    main: "Main",
    management: "Management",
    collapse: "Collapse",
  },
  es: {
    settings: "Configuración",
    "settings.description": "Administre la configuración y preferencias de su aplicación.",
    general: "General",
    receipt: "Recibo",
    tax: "Impuesto",
    preferences: "Preferencias",
    advanced: "Avanzado",
    "general.title": "Configuración General",
    "general.description": "Configure los ajustes generales de su tienda.",
    "contact.email": "Correo Electrónico de Contacto",
    "receipt.title": "Configuración de Recibos",
    "receipt.description": "Personalice cómo se imprimen sus recibos.",
    "show.logo": "Mostrar Logo en el Recibo",
    "tax.title": "Configuración de Impuestos",
    "tax.description": "Configure los ajustes relacionados con impuestos.",
    "tax.name": "Nombre del Impuesto",
    "preferences.title": "Preferencias",
    "preferences.description": "Establezca sus preferencias de aplicación.",
    language: "Idioma",
    "advanced.title": "Configuración Avanzada",
    "advanced.description": "Configure ajustes avanzados del sistema. Use con precaución.",
    "debug.mode": "Modo de Depuración",
    "debug.description": "Habilitar registro detallado e información de depuración",
    "maintenance.mode": "Modo de Mantenimiento",
    "maintenance.description": "Poner la aplicación en modo de mantenimiento",
    "cache.timeout": "Tiempo de Caché (minutos)",
    "cache.description": "Establecer a 0 para deshabilitar el caché",
    saving: "Guardando cambios...",
    dashboard: "Panel",
    "point.of.sale": "Punto de Venta",
    inventory: "Inventario",
    alerts: "Alertas",
    sales: "Ventas",
    reports: "Informes",
    expenses: "Gastos",
    "user.management": "Gestión de Usuarios",
    main: "Principal",
    management: "Administración",
    collapse: "Colapsar",
  },
  fr: {
    settings: "Paramètres",
    "settings.description": "Gérez les paramètres et préférences de votre application.",
    general: "Général",
    receipt: "Reçu",
    tax: "Taxe",
    preferences: "Préférences",
    advanced: "Avancé",
    "general.title": "Paramètres Généraux",
    "general.description": "Configurez les paramètres généraux de votre magasin.",
    "contact.email": "Email de Contact",
    "receipt.title": "Paramètres de Reçu",
    "receipt.description": "Personnalisez comment vos reçus sont imprimés.",
    "show.logo": "Afficher le Logo sur le Reçu",
    "tax.title": "Paramètres de Taxe",
    "tax.description": "Configurez les paramètres liés aux taxes.",
    "tax.name": "Nom de la Taxe",
    "preferences.title": "Préférences",
    "preferences.description": "Définissez vos préférences d'application.",
    language: "Langue",
    "advanced.title": "Paramètres Avancés",
    "advanced.description": "Configurez les paramètres système avancés. Utilisez avec précaution.",
    "debug.mode": "Mode Débogage",
    "debug.description": "Activer la journalisation détaillée et les informations de débogage",
    "maintenance.mode": "Mode Maintenance",
    "maintenance.description": "Mettre l'application en mode maintenance",
    "cache.timeout": "Délai de Cache (minutes)",
    "cache.description": "Définir à 0 pour désactiver le cache",
    saving: "Enregistrement des modifications...",
    dashboard: "Tableau de Bord",
    "point.of.sale": "Point de Vente",
    inventory: "Inventaire",
    alerts: "Alertes",
    sales: "Ventes",
    reports: "Rapports",
    expenses: "Dépenses",
    "user.management": "Gestion des Utilisateurs",
    main: "Principal",
    management: "Gestion",
    collapse: "Réduire",
  },
  ar: {
    settings: "الإعدادات",
    "settings.description": "إدارة إعدادات وتفضيلات التطبيق الخاص بك.",
    general: "عام",
    receipt: "إيصال",
    tax: "ضريبة",
    preferences: "تفضيلات",
    advanced: "متقدم",
    "general.title": "الإعدادات العامة",
    "general.description": "تكوين الإعدادات العامة لمتجرك.",
    "contact.email": "البريد الإلكتروني للاتصال",
    "receipt.title": "إعدادات الإيصال",
    "receipt.description": "تخصيص كيفية طباعة الإيصالات الخاصة بك.",
    "show.logo": "إظهار الشعار على الإيصال",
    "tax.title": "إعدادات الضريبة",
    "tax.description": "تكوين الإعدادات المتعلقة بالضرائب.",
    "tax.name": "اسم الضريبة",
    "preferences.title": "التفضيلات",
    "preferences.description": "تعيين تفضيلات التطبيق الخاص بك.",
    language: "اللغة",
    "advanced.title": "الإعدادات المتقدمة",
    "advanced.description": "تكوين إعدادات النظام المتقدمة. استخدم بحذر.",
    "debug.mode": "وضع التصحيح",
    "debug.description": "تمكين التسجيل المفصل ومعلومات التصحيح",
    "maintenance.mode": "وضع الصيانة",
    "maintenance.description": "وضع التطبيق في وضع الصيانة",
    "cache.timeout": "مهلة ذاكرة التخزين المؤقت (دقائق)",
    "cache.description": "تعيين إلى 0 لتعطيل التخزين المؤقت",
    saving: "جاري حفظ التغييرات...",
    dashboard: "لوحة التحكم",
    "point.of.sale": "نقطة البيع",
    inventory: "المخزون",
    alerts: "التنبيهات",
    sales: "المبيعات",
    reports: "التقارير",
    expenses: "المصروفات",
    "user.management": "إدارة المستخدمين",
    main: "الرئيسية",
    management: "الإدارة",
    collapse: "طي",
  },
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState("en")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load language preference from database on initial load
    const fetchLanguagePreference = async () => {
      try {
        const { data, error } = await supabase.from("settings").select("value").eq("id", "preferences").single()

        if (error) throw error

        if (data && data.value && data.value.language) {
          setLanguageState(data.value.language)
        }
      } catch (error) {
        console.error("Error fetching language preference:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguagePreference()
  }, [])

  const setLanguage = async (lang: string) => {
    try {
      // Update language in database
      const { data, error } = await supabase.from("settings").select("value").eq("id", "preferences").single()

      if (error) throw error

      const currentPreferences = data?.value || { language: "en" }
      const newPreferences = { ...currentPreferences, language: lang }

      const { error: updateError } = await supabase
        .from("settings")
        .update({ value: newPreferences })
        .eq("id", "preferences")

      if (updateError) throw updateError

      // Update state
      setLanguageState(lang)

      // Update HTML dir attribute for RTL languages
      if (lang === "ar") {
        document.documentElement.dir = "rtl"
        document.documentElement.lang = "ar"
      } else {
        document.documentElement.dir = "ltr"
        document.documentElement.lang = lang
      }
    } catch (error) {
      console.error("Error updating language:", error)
    }
  }

  // Translation function
  const t = (key: string) => {
    return translations[language]?.[key] || translations["en"][key] || key
  }

  // Set initial direction for RTL languages
  useEffect(() => {
    if (language === "ar") {
      document.documentElement.dir = "rtl"
      document.documentElement.lang = "ar"
    } else {
      document.documentElement.dir = "ltr"
      document.documentElement.lang = language
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>{!isLoading && children}</LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

