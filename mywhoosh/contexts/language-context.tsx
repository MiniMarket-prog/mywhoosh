"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Users } from "lucide-react"

export type Language = "en" | "es" | "fr" | "ar"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: (key: string) => string
  dir: "ltr" | "rtl"
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
    overview: "Overview",
    analytics: "Analytics",
    "total.revenue": "Total Revenue",
    "from.last.month": "from last month",
    products: "Products",
    "new.products": "new products",
    "analytics.coming.soon": "Analytics coming soon",
    "reports.coming.soon": "Reports coming soon",
    "comparison.report": "Comparison Report",
    "comparison.description": "Compare sales and expenses between this month and last month.",
    "sales.comparison": "Sales Comparison",
    "expenses.comparison": "Expenses Comparison",
    "this.month": "This Month",
    "last.month": "Last Month",
    difference: "Difference",
    "percent.change": "% Change",
    "app.logout": "Logout",
    "logout.confirmation": "Are you sure you want to logout?",
    "logout.message": "You will be logged out of your account. Any unsaved changes may be lost.",
    cancel: "Cancel",
    logout: "Logout",
    "Mini-Market": "Mini Market",
    setup: "Setup",
    "income.vs.expenses": "Income vs Expenses",
    "financial.goals": "Financial Goals",
    commissions: "Commissions",
    pos: "POS",
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
    overview: "Resumen",
    analytics: "Análisis",
    "total.revenue": "Ingresos Totales",
    "from.last.month": "desde el mes pasado",
    products: "Productos",
    "new.products": "nuevos productos",
    "analytics.coming.soon": "Análisis próximamente",
    "reports.coming.soon": "Informes próximamente",
    "comparison.report": "Informe Comparativo",
    "comparison.description": "Compare ventas y gastos entre este mes y el mes pasado.",
    "sales.comparison": "Comparación de Ventas",
    "expenses.comparison": "Comparación de Gastos",
    "this.month": "Este Mes",
    "last.month": "Mes Pasado",
    difference: "Diferencia",
    "percent.change": "% Cambio",
    "app.logout": "Cerrar sesión",
    "logout.confirmation": "¿Estás seguro de que quieres cerrar sesión?",
    "logout.message": "Se cerrará la sesión de tu cuenta. Cualquier cambio no guardado puede perderse.",
    cancel: "Cancelar",
    logout: "Cerrar sesión",
    "Mini-Market": "Mini Mercado",
    setup: "Configuración",
    "income.vs.expenses": "Ingresos vs Gastos",
    "financial.goals": "Objetivos Financieros",
    commissions: "Comisiones",
    pos: "POS",
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
    overview: "Aperçu",
    analytics: "Analytique",
    "total.revenue": "Revenu Total",
    "from.last.month": "par rapport au mois dernier",
    products: "Produits",
    "new.products": "nouveaux produits",
    "analytics.coming.soon": "Analytique à venir",
    "reports.coming.soon": "Rapports à venir",
    "comparison.report": "Rapport Comparatif",
    "comparison.description": "Comparez les ventes et les dépenses entre ce mois-ci et le mois dernier.",
    "sales.comparison": "Comparaison des Ventes",
    "expenses.comparison": "Comparaison des Dépenses",
    "this.month": "Ce Mois",
    "last.month": "Mois Dernier",
    difference: "Différence",
    "percent.change": "% Changement",
    "app.logout": "Déconnexion",
    "logout.confirmation": "Êtes-vous sûr de vouloir vous déconnecter?",
    "logout.message": "Vous serez déconnecté de votre compte. Tout changement non enregistré peut être perdu.",
    cancel: "Annuler",
    logout: "Déconnexion",
    "Mini-Market": "Mini Marché",
    setup: "Configuration",
    "income.vs.expenses": "Revenus vs Dépenses",
    "financial.goals": "Objectifs Financiers",
    commissions: "Commissions",
    pos: "PDV",
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
    "tax.name": "ا��م الضريبة",
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
    users: "المستخدمين",
    alerts: "التنبيهات",
    sales: "المبيعات",
    reports: "التقارير",
    expenses: "المصروفات",
    "user.management": "إدارة المستخدمين",
    main: "الرئيسية",
    management: "الإدارة",
    collapse: "طي",
    overview: "نظرة عامة",
    analytics: "التحليلات",
    "total.revenue": "إجمالي الإيرادات",
    "from.last.month": "من الشهر الماضي",
    products: "المنتجات",
    "new.products": "منتجات جديدة",
    "analytics.coming.soon": "التحليلات قادمة قريبا",
    "reports.coming.soon": "التقارير قادمة قريبا",
    "comparison.report": "تقرير المقارنة",
    "comparison.description": "قارن المبيعات والمصروفات بين هذا الشهر والشهر الماضي.",
    "sales.comparison": "مقارنة المبيعات",
    "expenses.comparison": "مقارنة المصروفات",
    "this.month": "هذا الشهر",
    "last.month": "الشهر الماضي",
    difference: "الفرق",
    "percent.change": "نسبة التغيير",
    "app.logout": "تسجيل الخروج",
    "logout.confirmation": "هل أنت متأكد أنك تريد تسجيل الخروج؟",
    "logout.message": "سيتم تسجيل خروجك من حسابك. قد تفقد أي تغييرات غير محفوظة.",
    cancel: "إلغاء",
    logout: "تسجيل الخروج",
    "Mini-Market": "ميني ماركت",
    setup: "إعداد",
    "income.vs.expenses": "الإيرادات مقابل المصروفات",
    "financial.goals": "الأهداف المالية",
    commissions: "العمولات",
    pos: "نقطة البيع",
  },
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load language preference from database on initial load
    const fetchLanguagePreference = async () => {
      try {
        const { data, error } = await supabase.from("settings").select("value").eq("id", "preferences").single()

        if (error) throw error

        if (data && data.value && data.value.language) {
          setLanguageState(data.value.language as Language)
        }
      } catch (error) {
        console.error("Error fetching language preference:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguagePreference()
  }, [])

  const setLanguage = async (lang: Language) => {
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
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir: language === "ar" ? "rtl" : "ltr",
      }}
    >
      {!isLoading && children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

