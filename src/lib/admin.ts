/**
 * Admin System for Neon Chat
 * Simple admin account with unlimited tokens
 */

import { supabase } from '../supabaseClient'

export const ADMIN_EMAIL = 'm.zarling86@gmail.com'

export async function createAdminAccount(password: string) {
  try {
    // Create admin user via Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user' }
    }

    // Create admin profile with unlimited tokens
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      username: 'admin',
      email: ADMIN_EMAIL,
      is_streamer: true,
      is_admin: true,
      token_balance: 999999, // Unlimited
      total_earnings: 0,
      is_verified: true,
    })

    if (profileError) {
      console.error('Profile error:', profileError)
      return { error: profileError.message }
    }

    return { success: true, userId: authData.user.id }
  } catch (error) {
    console.error('Admin creation error:', error)
    return { error: String(error) }
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    return data?.is_admin || false
  } catch (error) {
    return false
  }
}

export async function getAdminUser() {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single()

    return data
  } catch (error) {
    return null
  }
}

export async function addTokensToAdmin(amount: number) {
  try {
    const admin = await getAdminUser()
    if (!admin) return { error: 'Admin not found' }

    const { error } = await supabase
      .from('users')
      .update({ token_balance: admin.token_balance + amount })
      .eq('id', admin.id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (error) {
    return { error: String(error) }
  }
}
