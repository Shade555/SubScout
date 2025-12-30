import { supabase } from '../lib/supabase'

export const userPreferencesService = {
  // Get user preferences
  async getUserPreferences() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          return await this.createDefaultPreferences()
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error getting user preferences:', error)
      throw error
    }
  },

  // Create default preferences for new users
  async createDefaultPreferences() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const defaultPreferences = {
        user_id: user.id,
        browser_notifications: false,
        push_notifications: false,
        email_notifications: true
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .insert([defaultPreferences])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating default preferences:', error)
      throw error
    }
  },

  // Update user preferences
  async updateUserPreferences(preferences) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  },

  // Update specific preference
  async updatePreference(key, value) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Try to update existing preferences first
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          [key]: value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        // If no preferences exist, create them with the new value
        if (error.code === 'PGRST116') {
          const defaultPreferences = {
            user_id: user.id,
            browser_notifications: false,
            push_notifications: false,
            email_notifications: true,
            [key]: value
          }

          const { data: newData, error: insertError } = await supabase
            .from('user_preferences')
            .insert([defaultPreferences])
            .select()
            .single()

          if (insertError) throw insertError
          return newData
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating preference:', error)
      throw error
    }
  },

  // Save push subscription to database
  async savePushSubscription(subscription) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // First, remove any existing subscriptions for this user
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      // Then insert the new subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert([{
          user_id: user.id,
          subscription: subscription
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving push subscription:', error)
      throw error
    }
  },

  // Remove push subscription
  async removePushSubscription() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing push subscription:', error)
      throw error
    }
  },

  // Get push subscription
  async getPushSubscription() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No subscription found
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error getting push subscription:', error)
      return null
    }
  }
}