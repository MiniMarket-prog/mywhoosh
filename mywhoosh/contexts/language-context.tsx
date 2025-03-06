"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Language = "en" | "ar" | "fr" | "es" | "de"

// Simple translations for demonstration
const translations: Record<Language, Record<string, string>> = {
  en: {
    "settings.title": "Settings",
    "settings.subtitle": "Manage your store settings and preferences.",
    "settings.save": "Save Changes",
    "settings.saving": "Saving...",
    "settings.reset": "Reset",
    "settings.tab.general": "General",
    "settings.tab.receipt": "Receipt",
    "settings.tab.tax": "Tax",
    "settings.tab.preferences": "Preferences",
    "settings.tab.backup": "Backup",
    "settings.general.title": "General Settings",
    "settings.general.description": "Configure your store information and basic settings.",
    "settings.general.storeName": "Store Name",
    "settings.general.address": "Address",
    "settings.general.phone": "Phone",
    "settings.general.email": "Email",
    "settings.general.currency": "Currency",
    "settings.preferences.title": "Preferences",
    "settings.preferences.description": "Customize your application experience.",
    "settings.preferences.theme": "Theme",
    "settings.preferences.language": "Language",
    "settings.preferences.dateFormat": "Date Format",
    "settings.preferences.timeFormat": "Time Format",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "language.english": "English",
    "language.arabic": "Arabic",
    "language.spanish": "Spanish",
    "language.french": "French",
    "language.german": "German",
  },
  ar: {
    "settings.title": "الإعدادات",
    "settings.subtitle": "إدارة إعدادات وتفضيلات المتجر الخاص بك.",
    "settings.save": "حفظ التغييرات",
    "settings.saving": "جاري الحفظ...",
    "settings.reset": "إعادة تعيين",
    "settings.tab.general": "عام",
    "settings.tab.receipt": "الإيصال",
    "settings.tab.tax": "الضريبة",
    "settings.tab.preferences": "التفضيلات",
    "settings.tab.backup": "النسخ الاحتياطي",
    "settings.general.title": "الإعدادات العامة",
    "settings.general.description": "تكوين معلومات المتجر والإعدادات الأساسية.",
    "settings.general.storeName": "اسم المتجر",
    "settings.general.address": "العنوان",
    "settings.general.phone": "الهاتف",
    "settings.general.email": "البريد الإلكتروني",
    "settings.general.currency": "العملة",
    "settings.preferences.title": "التفضيلات",
    "settings.preferences.description": "تخصيص تجربة التطبيق الخاصة بك.",
    "settings.preferences.theme": "المظهر",
    "settings.preferences.language": "اللغة",
    "settings.preferences.dateFormat": "تنسيق التاريخ",
    "settings.preferences.timeFormat": "تنسيق الوقت",
    "theme.light": "فاتح",
    "theme.dark": "داكن",
    "theme.system": "النظام",
    "language.english": "الإنجليزية",
    "language.arabic": "العربية",
    "language.spanish": "الإسبانية",
    "language.french": "الفرنسية",
    "language.german": "الألمانية",
  },
  fr: {
    "settings.title": "Paramètres",
    "settings.subtitle": "Gérez les paramètres et préférences de votre magasin.",
    "settings.save": "Enregistrer",
    "settings.saving": "Enregistrement...",
    "settings.reset": "Réinitialiser",
    "settings.tab.general": "Général",
    "settings.tab.receipt": "Reçu",
    "settings.tab.tax": "Taxe",
    "settings.tab.preferences": "Préférences",
    "settings.tab.backup": "Sauvegarde",
    "settings.general.title": "Paramètres Généraux",
    "settings.general.description": "Configurez les informations et paramètres de base de votre magasin.",
    "settings.general.storeName": "Nom du Magasin",
    "settings.general.address": "Adresse",
    "settings.general.phone": "Téléphone",
    "settings.general.email": "Email",
    "settings.general.currency": "Devise",
    "settings.preferences.title": "Préférences",
    "settings.preferences.description": "Personnalisez votre expérience d'application.",
    "settings.preferences.theme": "Thème",
    "settings.preferences.language": "Langue",
    "settings.preferences.dateFormat": "Format de Date",
    "settings.preferences.timeFormat": "Format d'Heure",
    "theme.light": "Clair",
    "theme.dark": "Sombre",
    "theme.system": "Système",
    "language.english": "Anglais",
    "language.arabic": "Arabe",
    "language.spanish": "Espagnol",
    "language.french": "Français",
    "language.german": "Allemand",
  },
  es: {
    "settings.title": "Configuración",
    "settings.subtitle": "Administre la configuración y preferencias de su tienda.",
    "settings.save": "Guardar Cambios",
    "settings.saving": "Guardando...",
    "settings.reset": "Restablecer",
    "settings.tab.general": "General",
    "settings.tab.receipt": "Recibo",
    "settings.tab.tax": "Impuesto",
    "settings.tab.preferences": "Preferencias",
    "settings.tab.backup": "Respaldo",
    "settings.general.title": "Configuración General",
    "settings.general.description": "Configure la información y configuración básica de su tienda.",
    "settings.general.storeName": "Nombre de la Tienda",
    "settings.general.address": "Dirección",
    "settings.general.phone": "Teléfono",
    "settings.general.email": "Correo Electrónico",
    "settings.general.currency": "Moneda",
    "settings.preferences.title": "Preferencias",
    "settings.preferences.description": "Personalice su experiencia de aplicación.",
    "settings.preferences.theme": "Tema",
    "settings.preferences.language": "Idioma",
    "settings.preferences.dateFormat": "Formato de Fecha",
    "settings.preferences.timeFormat": "Formato de Hora",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "theme.system": "Sistema",
    "language.english": "Inglés",
    "language.arabic": "Árabe",
    "language.spanish": "Español",
    "language.french": "Francés",
    "language.german": "Alemán",
  },
  de: {
    "settings.title": "Einstellungen",
    "settings.subtitle": "Verwalten Sie Ihre Geschäftseinstellungen und Präferenzen.",
    "settings.save": "Änderungen Speichern",
    "settings.saving": "Speichern...",
    "settings.reset": "Zurücksetzen",
    "settings.tab.general": "Allgemein",
    "settings.tab.receipt": "Quittung",
    "settings.tab.tax": "Steuer",
    "settings.tab.preferences": "Präferenzen",
    "settings.tab.backup": "Sicherung",
    "settings.general.title": "Allgemeine Einstellungen",
    "settings.general.description": "Konfigurieren Sie Ihre Geschäftsinformationen und grundlegende Einstellungen.",
    "settings.general.storeName": "Geschäftsname",
    "settings.general.address": "Adresse",
    "settings.general.phone": "Telefon",
    "settings.general.email": "E-Mail",
    "settings.general.currency": "Währung",
    "settings.preferences.title": "Präferenzen",
    "settings.preferences.description": "Passen Sie Ihre Anwendungserfahrung an.",
    "settings.preferences.theme": "Thema",
    "settings.preferences.language": "Sprache",
    "settings.preferences.dateFormat": "Datumsformat",
    "settings.preferences.timeFormat": "Zeitformat",
    "theme.light": "Hell",
    "theme.dark": "Dunkel",
    "theme.system": "System",
    "language.english": "Englisch",
    "language.arabic": "Arabisch",
    "language.spanish": "Spanisch",
    "language.french": "Französisch",
    "language.german": "Deutsch",
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Get direction based on language
  const dir = language === "ar" ? "rtl" : "ltr"

  // Simple translation function
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}

