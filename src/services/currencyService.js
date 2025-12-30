// Currency conversion service
export const currencyService = {
  // Exchange rates (you can replace with real API later)
  exchangeRates: {
    USD: 1,      // Base currency
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.12,
    CAD: 1.35,
    JPY: 110.0,
    AUD: 1.45,
    CHF: 0.92,
    CNY: 7.20
  },

  currencies: {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    INR: { symbol: '₹', name: 'Indian Rupee' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    JPY: { symbol: '¥', name: 'Japanese Yen' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    CHF: { symbol: 'CHF', name: 'Swiss Franc' },
    CNY: { symbol: '¥', name: 'Chinese Yuan' }
  },

  // Convert amount from one currency to another
  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount

    // Convert to USD first, then to target currency
    const usdAmount = amount / this.exchangeRates[fromCurrency]
    const convertedAmount = usdAmount * this.exchangeRates[toCurrency]
    
    return convertedAmount
  },

  // Format amount with currency symbol
  format(amount, currency) {
    const currencyInfo = this.currencies[currency]
    if (!currencyInfo) return `${amount.toFixed(2)} ${currency}`

    // Handle special formatting for different currencies
    if (currency === 'INR') {
      // Indian number formatting (lakhs/crores)
      return `${currencyInfo.symbol} ${this.formatIndianNumber(amount)}`
    }

    return `${currencyInfo.symbol} ${amount.toFixed(2)}`
  },

  // Format numbers in Indian style (lakhs/crores)
  formatIndianNumber(num) {
    if (num >= 10000000) { // 1 crore
      return `${(num / 10000000).toFixed(2)} Cr`
    } else if (num >= 100000) { // 1 lakh
      return `${(num / 100000).toFixed(2)} L`
    } else if (num >= 1000) { // 1 thousand
      return `${(num / 1000).toFixed(2)} K`
    }
    return num.toFixed(2)
  },

  // Get all available currencies
  getAvailableCurrencies() {
    return Object.keys(this.currencies).map(code => ({
      code,
      ...this.currencies[code]
    }))
  },

  // Update exchange rates (you can call this with real API data)
  updateExchangeRates(rates) {
    this.exchangeRates = { ...this.exchangeRates, ...rates }
  },

  // Fetch live exchange rates (placeholder for real API)
  async fetchLiveRates() {
    try {
      // You can replace this with a real API like:
      // - https://api.exchangerate-api.com/v4/latest/USD
      // - https://api.fixer.io/latest
      // - https://openexchangerates.org/api/latest.json
      
      console.log('Using static exchange rates. Implement live API for real-time rates.')
      return this.exchangeRates
    } catch (error) {
      console.error('Failed to fetch live exchange rates:', error)
      return this.exchangeRates
    }
  }
}