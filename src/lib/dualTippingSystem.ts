/**
 * DUAL TIPPING SYSTEM
 * - Cash tips: Sent directly to model (70% model, 30% platform via Stripe)
 * - Token tips: Model receives tokens (15% model, 60% platform, 15% director, 10% pool)
 * - Incentivizes token purchasing (more profitable for platform)
 */

import { supabase } from '../supabaseClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY || '')

// ============================================
// CASH TIP FLOW (Direct to Model)
// ============================================

export interface CashTip {
  tipId: string
  fromUserId: string
  toModelId: string
  streamId?: string
  privateChatId?: string
  amount: number // In USD cents
  message?: string
  status: 'pending' | 'completed' | 'failed'
  stripeChargeId?: string
  createdAt: Date
}

export async function processCashTip(
  fromUserId: string,
  toModelId: string,
  amount: number, // in cents ($1 = 100)
  context: { streamId?: string; privateChatId?: string; message?: string }
): Promise<{ success: boolean; tipId?: string; error?: string }> {
  try {
    // Get user's Stripe payment method
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', fromUserId)
      .single()

    if (!user?.stripe_customer_id) {
      return { success: false, error: 'Payment method not found' }
    }

    // Get model's Stripe Connect account
    const { data: model } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', toModelId)
      .single()

    if (!model?.stripe_connect_id) {
      return { success: false, error: 'Model does not have Stripe account' }
    }

    // Create Stripe charge
    // 70% to model, 30% to platform
    const modelAmount = Math.floor(amount * 0.7)
    const platformAmount = amount - modelAmount

    const charge = await stripe.charges.create(
      {
        amount: modelAmount,
        currency: 'usd',
        customer: user.stripe_customer_id,
        description: `Tip from ${fromUserId} on NeonLights.cam`,
        metadata: {
          from_user_id: fromUserId,
          to_model_id: toModelId,
          stream_id: context.streamId || '',
          private_chat_id: context.privateChatId || '',
        },
      },
      {
        stripeAccount: model.stripe_connect_id,
      }
    )

    // Record tip in database
    const { data: tip, error: dbError } = await supabase
      .from('cash_tips')
      .insert({
        from_user_id: fromUserId,
        to_model_id: toModelId,
        stream_id: context.streamId,
        private_chat_id: context.privateChatId,
        amount: modelAmount,
        platform_fee: platformAmount,
        message: context.message,
        stripe_charge_id: charge.id,
        status: 'completed',
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Notify model
    await notifyModelOfTip(toModelId, {
      tipper: fromUserId,
      amount: modelAmount,
      tipType: 'cash',
      message: context.message,
    })

    return { success: true, tipId: tip.id }
  } catch (error) {
    console.error('Cash tip processing error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================
// TOKEN TIP FLOW (Model gets tokens, platform profits)
// ============================================

export interface TokenTip {
  tipId: string
  fromUserId: string
  toModelId: string
  directorId?: string
  streamId?: string
  privateChatId?: string
  tokens: number
  message?: string
  status: 'pending' | 'completed'
  createdAt: Date
}

export async function processTokenTip(
  fromUserId: string,
  toModelId: string,
  tokens: number,
  context: { directorId?: string; streamId?: string; privateChatId?: string; message?: string }
): Promise<{ success: boolean; tipId?: string; error?: string }> {
  try {
    // Check user has enough tokens
    const { data: tipper } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', fromUserId)
      .single()

    if (!tipper || tipper.token_balance < tokens) {
      return { success: false, error: 'Insufficient tokens' }
    }

    // Calculate split
    // 60% platform, 15% model, 15% director, 10% pool
    const platformTokens = Math.floor(tokens * 0.6)
    const modelTokens = Math.floor(tokens * 0.15)
    const directorTokens = context.directorId ? Math.floor(tokens * 0.15) : 0
    const poolTokens = tokens - platformTokens - modelTokens - directorTokens

    // Deduct from tipper
    await supabase
      .from('users')
      .update({ token_balance: tipper.token_balance - tokens })
      .eq('id', fromUserId)

    // Add to model
    const { data: model } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', toModelId)
      .single()

    await supabase
      .from('users')
      .update({ token_balance: (model?.token_balance || 0) + modelTokens })
      .eq('id', toModelId)

    // Add to director if applicable
    if (context.directorId) {
      const { data: director } = await supabase
        .from('users')
        .select('token_balance')
        .eq('id', context.directorId)
        .single()

      await supabase
        .from('users')
        .update({ token_balance: (director?.token_balance || 0) + directorTokens })
        .eq('id', context.directorId)
    }

    // Record tip
    const { data: tip, error: dbError } = await supabase
      .from('token_tips')
      .insert({
        from_user_id: fromUserId,
        to_model_id: toModelId,
        director_id: context.directorId,
        stream_id: context.streamId,
        private_chat_id: context.privateChatId,
        tokens: tokens,
        model_tokens: modelTokens,
        director_tokens: directorTokens,
        platform_tokens: platformTokens,
        pool_tokens: poolTokens,
        message: context.message,
        status: 'completed',
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Notify model
    await notifyModelOfTip(toModelId, {
      tipper: fromUserId,
      amount: tokens,
      tipType: 'tokens',
      message: context.message,
    })

    return { success: true, tipId: tip.id }
  } catch (error) {
    console.error('Token tip processing error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

async function notifyModelOfTip(
  modelId: string,
  details: {
    tipper: string
    amount: number
    tipType: 'cash' | 'tokens'
    message?: string
  }
) {
  try {
    // Get tipper username
    const { data: tipper } = await supabase
      .from('users')
      .select('username')
      .eq('id', details.tipper)
      .single()

    // Store notification
    await supabase.from('notifications').insert({
      user_id: modelId,
      type: 'tip_received',
      title: `New ${details.tipType} tip!`,
      message: `${tipper?.username} sent you ${details.amount} ${details.tipType === 'cash' ? 'USD' : 'tokens'}${details.message ? `: "${details.message}"` : ''}`,
      data: {
        tipper_id: details.tipper,
        amount: details.amount,
        type: details.tipType,
      },
      read: false,
    })

    // TODO: Send push notification if model has enabled notifications
  } catch (error) {
    console.error('Notification error:', error)
  }
}

// ============================================
// DATABASE SCHEMA ADDITIONS
// ============================================

/*
Run these migrations in Supabase:

CREATE TABLE IF NOT EXISTS cash_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_model_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
  private_chat_id UUID REFERENCES private_chat_sessions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- in USD cents
  platform_fee INTEGER NOT NULL,
  message TEXT,
  stripe_charge_id TEXT UNIQUE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_model_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  director_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stream_id UUID REFERENCES live_streams(id) ON DELETE SET NULL,
  private_chat_id UUID REFERENCES private_chat_sessions(id) ON DELETE SET NULL,
  tokens INTEGER NOT NULL,
  model_tokens INTEGER NOT NULL,
  director_tokens INTEGER DEFAULT 0,
  platform_tokens INTEGER NOT NULL,
  pool_tokens INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cash_tips_model ON cash_tips(to_model_id);
CREATE INDEX idx_token_tips_model ON token_tips(to_model_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
*/
