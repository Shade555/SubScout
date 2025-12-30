import { supabase } from '../lib/supabase'

export const subscriptionService = {
  // Get all subscriptions for current user
  async getSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get active subscriptions
  async getActiveSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .order('next_payment_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get cancelled subscriptions (history)
  async getCancelledSubscriptions() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', false)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Add new subscription
  async addSubscription(subscription) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Calculate next payment date
      const nextPaymentDate = this.calculateNextPaymentDate(
        subscription.start_date,
        subscription.billing_cycle
      )

      const subscriptionData = {
        ...subscription,
        user_id: user.id,
        next_payment_date: nextPaymentDate
      }

      console.log('Adding subscription:', subscriptionData)

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      return data[0]
    } catch (error) {
      console.error('Service error:', error)
      throw error
    }
  },

  // Update subscription
  async updateSubscription(id, updates) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Cancel subscription (set is_active to false)
  async cancelSubscription(id) {
    return this.updateSubscription(id, { is_active: false })
  },

  // Reactivate subscription
  async reactivateSubscription(id) {
    return this.updateSubscription(id, { is_active: true })
  },

  // Delete subscription permanently
  async deleteSubscription(id) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Mark payment as completed and update next payment date
  async markPaymentCompleted(subscription) {
    const nextPaymentDate = this.calculateNextPaymentDate(
      subscription.next_payment_date,
      subscription.billing_cycle
    )

    // For now, just update the next payment date
    // We'll add last_payment_date after running the SQL migration
    return this.updateSubscription(subscription.id, {
      next_payment_date: nextPaymentDate
    })
  },

  // Update subscription details
  async editSubscription(id, subscriptionData) {
    // If billing cycle or start date changed, recalculate next payment
    if (subscriptionData.billing_cycle || subscriptionData.start_date) {
      const currentSub = await this.getSubscriptionById(id)
      const baseDate = subscriptionData.start_date || currentSub.next_payment_date
      const cycle = subscriptionData.billing_cycle || currentSub.billing_cycle
      
      subscriptionData.next_payment_date = this.calculateNextPaymentDate(baseDate, cycle)
    }

    return this.updateSubscription(id, subscriptionData)
  },

  // Get single subscription by ID
  async getSubscriptionById(id) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Calculate next payment date
  calculateNextPaymentDate(startDate, billingCycle) {
    const date = new Date(startDate)
    
    switch (billingCycle) {
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'quarterly':
        date.setMonth(date.getMonth() + 3)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        date.setMonth(date.getMonth() + 1)
    }
    
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  },

  // Get upcoming payments (next 30 days)
  async getUpcomingPayments() {
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .gte('next_payment_date', today.toISOString().split('T')[0])
      .lte('next_payment_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('next_payment_date', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get overdue payments
  async getOverduePayments() {
    const today = new Date()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .lt('next_payment_date', today.toISOString().split('T')[0])
      .order('next_payment_date', { ascending: true })
    
    if (error) throw error
    return data
  }
}