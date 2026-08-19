-- Mirrors migration applied live to Supabase (source of truth) on 2026-08-19.
--
-- send_room_tip, accept_private_show, unlock_bundle, unlock_perk, unlock_video,
-- and unlock_private_recording credited total_earnings (a USD column, paid out
-- via Stripe Transfer in api/request-payout.ts) as `price_tokens * 0.85`,
-- treating 1 token = $1. Real token pricing (src/lib/stripe.ts TOKEN_PACKAGES)
-- ranges ~$0.099/token down to ~$0.043/token with bonus tiers. Confirmed real
-- blended rate from the live Stripe ledger (transactions where
-- type='token_purchase'): $299.99 / 7000 tokens = $0.0429/token.
--
-- Added v_token_usd_value := 0.0429 to each function so payouts reflect real
-- revenue collected: total_earnings += price_tokens * 0.0429 * 0.85 (still an
-- 85/15 creator/platform split of actual dollars, not of a fictional $1/token).
-- unlock_private_recording's requester-refund (paid back in tokens) and
-- platform_savings_pool (tracked in tokens) legs are untouched -- no $ involved.
--
-- A companion one-off data migration (not schema, not replayed here) recomputed
-- existing users.total_earnings from real tip/unlock history at the corrected
-- rate, replacing values accrued under the old formula.

CREATE OR REPLACE FUNCTION public.send_room_tip(p_room_id uuid, p_amount integer)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_id UUID := auth.uid();
  v_receiver_id UUID;
  v_sender_balance INT;
  v_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_sender_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid tip amount'; END IF;

  SELECT streamer_id INTO v_receiver_id FROM rooms WHERE id = p_room_id;
  IF v_receiver_id IS NULL THEN RAISE EXCEPTION 'Room not found'; END IF;
  IF v_receiver_id = v_sender_id THEN RAISE EXCEPTION 'Cannot tip your own stream'; END IF;

  SELECT token_balance INTO v_sender_balance FROM users WHERE id = v_sender_id FOR UPDATE;
  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN RAISE EXCEPTION 'Insufficient token balance'; END IF;

  UPDATE users SET token_balance = token_balance - p_amount, updated_at = now() WHERE id = v_sender_id;
  UPDATE users SET total_earnings = total_earnings + (p_amount * v_token_usd_value * v_payout_rate), updated_at = now() WHERE id = v_receiver_id;

  INSERT INTO tips (room_id, sender_id, receiver_id, amount) VALUES (p_room_id, v_sender_id, v_receiver_id, p_amount);

  RETURN json_build_object('success', true, 'newBalance', v_sender_balance - p_amount);
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_private_show(p_request_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_streamer_id UUID := auth.uid();
  v_requester_id UUID;
  v_room_id UUID;
  v_price INT;
  v_status TEXT;
  v_balance INT;
  v_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_streamer_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT requester_id, room_id, offered_tokens, status INTO v_requester_id, v_room_id, v_price, v_status
  FROM private_show_requests WHERE id = p_request_id AND streamer_id = v_streamer_id FOR UPDATE;

  IF v_requester_id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_status != 'pending' THEN RAISE EXCEPTION 'Request already handled'; END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_requester_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_price THEN
    UPDATE private_show_requests SET status = 'declined', responded_at = now() WHERE id = p_request_id;
    RAISE EXCEPTION 'Requester no longer has enough tokens';
  END IF;

  UPDATE users SET token_balance = token_balance - v_price, updated_at = now() WHERE id = v_requester_id;
  UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_payout_rate), updated_at = now() WHERE id = v_streamer_id;
  UPDATE private_show_requests SET status = 'accepted', responded_at = now() WHERE id = p_request_id;
  UPDATE rooms SET is_private_show = true, private_show_requester_id = v_requester_id WHERE id = v_room_id;

  RETURN json_build_object('success', true, 'roomId', v_room_id, 'requesterId', v_requester_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unlock_bundle(p_bundle_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_price INT;
  v_balance INT;
  v_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id, price_tokens INTO v_owner_id, v_price FROM photo_bundles WHERE id = p_bundle_id;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Bundle not found'; END IF;
  IF v_owner_id = v_user_id THEN RETURN json_build_object('success', true, 'alreadyOwned', true); END IF;
  IF EXISTS (SELECT 1 FROM bundle_unlocks WHERE user_id = v_user_id AND bundle_id = p_bundle_id) THEN
    RETURN json_build_object('success', true, 'alreadyUnlocked', true);
  END IF;
  IF v_price = 0 THEN RETURN json_build_object('success', true, 'free', true); END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_price THEN RAISE EXCEPTION 'Insufficient token balance'; END IF;

  UPDATE users SET token_balance = token_balance - v_price, updated_at = now() WHERE id = v_user_id;
  UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_payout_rate), updated_at = now() WHERE id = v_owner_id;
  INSERT INTO bundle_unlocks (user_id, bundle_id) VALUES (v_user_id, p_bundle_id);

  RETURN json_build_object('success', true, 'newBalance', v_balance - v_price);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unlock_perk(p_perk_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_price INT;
  v_reveal TEXT;
  v_balance INT;
  v_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id, price_tokens, reveal_content INTO v_owner_id, v_price, v_reveal
  FROM creator_perks WHERE id = p_perk_id AND is_active = true;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Perk not found'; END IF;
  IF v_owner_id = v_user_id THEN RETURN json_build_object('success', true, 'reveal', v_reveal); END IF;

  IF EXISTS (SELECT 1 FROM perk_unlocks WHERE user_id = v_user_id AND perk_id = p_perk_id) THEN
    RETURN json_build_object('success', true, 'reveal', v_reveal);
  END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_price THEN RAISE EXCEPTION 'Insufficient token balance'; END IF;

  UPDATE users SET token_balance = token_balance - v_price, updated_at = now() WHERE id = v_user_id;
  UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_payout_rate), updated_at = now() WHERE id = v_owner_id;
  INSERT INTO perk_unlocks (user_id, perk_id) VALUES (v_user_id, p_perk_id);

  RETURN json_build_object('success', true, 'reveal', v_reveal, 'newBalance', v_balance - v_price);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unlock_video(p_video_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_price INT;
  v_balance INT;
  v_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id, price_tokens INTO v_owner_id, v_price FROM vod_library WHERE id = p_video_id;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Video not found'; END IF;
  IF v_owner_id = v_user_id THEN RETURN json_build_object('success', true, 'alreadyOwned', true); END IF;
  IF EXISTS (SELECT 1 FROM video_unlocks WHERE user_id = v_user_id AND video_id = p_video_id) THEN
    RETURN json_build_object('success', true, 'alreadyUnlocked', true);
  END IF;
  IF v_price = 0 THEN
    UPDATE vod_library SET view_count = view_count + 1 WHERE id = p_video_id;
    RETURN json_build_object('success', true, 'free', true);
  END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_price THEN RAISE EXCEPTION 'Insufficient token balance'; END IF;

  UPDATE users SET token_balance = token_balance - v_price, updated_at = now() WHERE id = v_user_id;
  UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_payout_rate), updated_at = now() WHERE id = v_owner_id;
  UPDATE vod_library SET view_count = view_count + 1 WHERE id = p_video_id;
  INSERT INTO video_unlocks (user_id, video_id) VALUES (v_user_id, p_video_id);

  RETURN json_build_object('success', true, 'newBalance', v_balance - v_price);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unlock_private_recording(p_video_id uuid)
 RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner_id UUID;
  v_requester_id UUID;
  v_price INT;
  v_is_private BOOLEAN;
  v_balance INT;
  v_streamer_share NUMERIC := 0.70;
  v_requester_share NUMERIC := 0.10;
  v_pool_share NUMERIC := 0.10;
  v_standard_payout_rate NUMERIC := 0.85;
  v_token_usd_value NUMERIC := 0.0429;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT user_id, price_tokens, is_private_show_recording, original_requester_id
  INTO v_owner_id, v_price, v_is_private, v_requester_id
  FROM vod_library WHERE id = p_video_id;

  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Video not found'; END IF;
  IF v_owner_id = v_user_id THEN RETURN json_build_object('success', true, 'alreadyOwned', true); END IF;
  IF EXISTS (SELECT 1 FROM video_unlocks WHERE user_id = v_user_id AND video_id = p_video_id) THEN
    RETURN json_build_object('success', true, 'alreadyUnlocked', true);
  END IF;
  IF v_price = 0 THEN
    UPDATE vod_library SET view_count = view_count + 1 WHERE id = p_video_id;
    RETURN json_build_object('success', true, 'free', true);
  END IF;

  SELECT token_balance INTO v_balance FROM users WHERE id = v_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < v_price THEN RAISE EXCEPTION 'Insufficient token balance'; END IF;

  UPDATE users SET token_balance = token_balance - v_price, updated_at = now() WHERE id = v_user_id;

  IF v_is_private AND v_requester_id IS NOT NULL THEN
    UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_streamer_share), updated_at = now() WHERE id = v_owner_id;
    UPDATE users SET token_balance = token_balance + ROUND(v_price * v_requester_share), updated_at = now() WHERE id = v_requester_id;
    UPDATE platform_savings_pool SET balance_tokens = balance_tokens + ROUND(v_price * v_pool_share), updated_at = now() WHERE id = 1;
    INSERT INTO savings_pool_transactions (type, amount_tokens, reason, related_user_id)
    VALUES ('deposit', ROUND(v_price * v_pool_share), 'Private recording resale', v_owner_id);
  ELSE
    UPDATE users SET total_earnings = total_earnings + (v_price * v_token_usd_value * v_standard_payout_rate), updated_at = now() WHERE id = v_owner_id;
  END IF;

  UPDATE vod_library SET view_count = view_count + 1 WHERE id = p_video_id;
  INSERT INTO video_unlocks (user_id, video_id) VALUES (v_user_id, p_video_id);
  RETURN json_build_object('success', true, 'newBalance', v_balance - v_price);
END;
$function$;
