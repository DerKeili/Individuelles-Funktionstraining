import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://meufjnmmucsvmtlnoazg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldWZqbm1tdWNzdm10bG5vYXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjQ1NDQsImV4cCI6MjA5OTYwMDU0NH0.4ginPuHoWlXHXDb_RJOzQT2RiMWKK9k5l0y2uoj9FIY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Automatisch Token erneuern bei Timing-Problemen
    flowType: "implicit",
  },
  global: {
    headers: {
      // Toleranz für Zeitabweichungen (JWT clock skew)
      "x-client-info": "urlaubsplaner/1.0",
    },
  },
});

// Token bei Zeitproblemen automatisch erneuern
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED") {
    console.log("Token erneuert");
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}
export async function signOut() { await supabase.auth.signOut(); }
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw new Error(error.message);
  return data;
}
export async function getAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("vorname");
  if (error) throw new Error(error.message);
  return data;
}
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function createUser({ email, password, vorname, nachname, role, position, color, urlaubstage, ueberstunden, resturlaub, einstellungsdatum, geburtsdatum }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: { data: { vorname, nachname, role: role || "trainer" } },
  });
  if (authError) throw new Error(authError.message);
  const userId = authData.user?.id;
  if (!userId) throw new Error("User-ID nicht erhalten");

  // E-Mail sofort bestätigen damit User sich direkt einloggen kann
  try {
    await supabase.rpc("admin_confirm_user", { target_user_id: userId });
  } catch (e) {
    console.warn("Auto-confirm:", e.message);
  }
  const { data, error } = await supabase.from("profiles").upsert({
    id: userId, email, role: role || "trainer",
    vorname, nachname, position: position || "Trainer",
    color: color || "#2563EB",
    urlaubstage: urlaubstage ?? 30,
    ueberstunden: ueberstunden ?? 0,
    resturlaub: resturlaub ?? 0,
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function deleteUser(userId) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}

// ─── Entries ──────────────────────────────────────────────────────────────────
export async function getAllEntries() {
  const { data, error } = await supabase.from("entries").select("*, profiles(vorname, nachname, color, email)").order("von");
  if (error) throw new Error(error.message);
  return data;
}
export async function getMyEntries(userId) {
  const { data, error } = await supabase.from("entries").select("*").eq("user_id", userId).order("von");
  if (error) throw new Error(error.message);
  return data;
}
export async function getConfirmedEntries() {
  const { data, error } = await supabase.from("entries").select("*, profiles(vorname, nachname, color)").eq("status", "confirmed").order("von");
  if (error) throw new Error(error.message);
  return data;
}
export async function createEntry({ user_id, type, von, bis, note = "" }) {
  const { data, error } = await supabase.from("entries").insert({ user_id, type, von, bis, note, status: "pending" }).select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function updateEntry(id, updates) {
  const { data, error } = await supabase.from("entries").update(updates).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function setEntryStatus(id, status) {
  const { data, error } = await supabase.from("entries").update({ status }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}
export async function deleteEntry(id) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export async function checkConflicts(userId, von, bis) {
  const { data, error } = await supabase.from("entries").select("*, profiles(vorname, nachname)").eq("status", "confirmed").neq("user_id", userId).lte("von", bis).gte("bis", von);
  if (error) throw new Error(error.message);
  return data;
}

// ─── Admin: Passwort zurücksetzen ─────────────────────────────────────────────
export async function adminResetPassword(userId, newPassword) {
  const { error } = await supabase.rpc("admin_reset_password", {
    target_user_id: userId,
    new_password: newPassword,
  });
  if (error) throw new Error(error.message);
}

// ─── Passwort vergessen ───────────────────────────────────────────────────────
export async function requestPasswordReset(email) {
  const { error } = await supabase.from("password_reset_requests").insert({
    email,
    requested_at: new Date().toISOString(),
    status: "pending",
  });
  if (error) throw new Error(error.message);
}
export async function getPasswordResetRequests() {
  const { data, error } = await supabase.from("password_reset_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
export async function dismissResetRequest(id) {
  const { error } = await supabase.from("password_reset_requests").update({ status: "done" }).eq("id", id);
  if (error) throw new Error(error.message);
}
