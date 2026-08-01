/**
 * Admin System for Neon Chat
 * Simple admin account with unlimited tokens
 */

import { supabase } from '../supabaseClient'

export const ADMIN_EMAIL = 'm.zarling86@gmail.com'

// NOTE: admin accounts are provisioned directly in Supabase (SQL), not
// through any client-reachable code path. A previous version of this file
// had a createAdminAccount(password) function wired to a public /setup
// route that only checked a client-supplied password against nothing —
// any visitor could have called it. Removed. If you need to grant admin
// to another account, do it via a migration/SQL, not client code.

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
