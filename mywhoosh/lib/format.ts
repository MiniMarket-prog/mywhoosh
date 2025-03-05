// Currency formatting utility
export function formatCurrency(amount: number, currency = "MAD"): string {
    const currencyOptions: { [key: string]: Intl.NumberFormatOptions } = {
      MAD: {
        style: "currency",
        currency: "MAD",
        currencyDisplay: "symbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      USD: {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      EUR: {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      GBP: {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      JPY: {
        style: "currency",
        currency: "JPY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    }
  
    // Default to MAD if the currency is not supported
    const options = currencyOptions[currency] || currencyOptions.MAD
  
    return new Intl.NumberFormat("en-US", options).format(amount)
  }
  
  // Date formatting utility
  export function formatDate(date: Date | string, format = "MM/DD/YYYY"): string {
    const d = typeof date === "string" ? new Date(date) : date
  
    // Simple formatting based on the format string
    const day = d.getDate().toString().padStart(2, "0")
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const year = d.getFullYear()
  
    switch (format) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`
      case "MM/DD/YYYY":
      default:
        return `${month}/${day}/${year}`
    }
  }
  
  