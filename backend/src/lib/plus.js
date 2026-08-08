import { supabaseAdmin } from '../config/database.js';

export const AI_LIMITS = {
  chat: { limit: 5, period: 'day' },
  speaking: { limit: 3, period: 'day' },
  lesson_plan: { limit: 4, period: 'week' },
};

export function dayKey() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function weekKey() {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().slice(0, 10);
}

export function getAiPeriod(kind) {
  return AI_LIMITS[kind]?.period === 'week' ? weekKey() : dayKey();
}

export async function getPlusStatus(userId) {
  if (!userId) return { active: false, endAt: null, plan: null };
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, period, status, start_at, end_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const active = !!data && data.status === 'active' && new Date(data.end_at) > new Date();
  return { active, endAt: data?.end_at || null, plan: data?.plan || null, period: data?.period || null, startAt: data?.start_at || null };
}

export async function hasActivePlus(userId) {
  if (!userId) return false;
  return (await getPlusStatus(userId)).active;
}

export async function activatePlus(userId, orderId, periodMonths, price, confirmedById) {
  const current = await getPlusStatus(userId);
  const start = current.active && current.endAt ? new Date(current.endAt) : new Date();
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + periodMonths);

  const { data: sub, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan: 'plus',
      period: periodMonths,
      price: price || null,
      status: 'active',
      start_at: start.toISOString(),
      end_at: end.toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;

  if (orderId) {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString(), confirmed_by: confirmedById || null })
      .eq('id', orderId);
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    from_user_id: userId,
    type: 'purchase',
    message: `Bạn đã kích hoạt gói Plus ${periodMonths} tháng thành công.`,
  });
  return sub;
}

export async function getAiUsage(userId, kind) {
  const { data } = await supabaseAdmin
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('period_key', getAiPeriod(kind))
    .maybeSingle();
  return data?.count || 0;
}

export async function getAiRemaining(userId) {
  if (await hasActivePlus(userId)) return null;
  const out = {};
  for (const kind of Object.keys(AI_LIMITS)) {
    const used = await getAiUsage(userId, kind);
    out[`${kind}Left`] = Math.max(0, AI_LIMITS[kind].limit - used);
  }
  return out;
}

export async function canUseAi(userId, kind) {
  const limit = AI_LIMITS[kind]?.limit;
  if (await hasActivePlus(userId)) return { ok: true, remaining: null, limit: null };
  const used = await getAiUsage(userId, kind);
  const remaining = Math.max(0, limit - used);
  return { ok: remaining > 0, remaining, limit };
}

export async function incrementAiUsage(userId, kind) {
  const { data, error } = await supabaseAdmin.rpc('increment_ai_usage', {
    p_user: userId,
    p_kind: kind,
  });
  if (error) throw error;
  return data;
}
