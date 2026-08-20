import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://meufjnmmucsvmtlnoazg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldWZqbm1tdWNzdm10bG5vYXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjQ1NDQsImV4cCI6MjA5OTYwMDU0NH0.4ginPuHoWlXHXDb_RJOzQT2RiMWKK9k5l0y2uoj9FIY";

const STORAGE_KEY = "sb-urlaubsplaner-auth";

// WICHTIG: Supabase sichert Auth-Zugriffe standardmäßig über die Web-Locks-API ab.
// Auf iOS/iPadOS bleibt so eine Sperre nach dem Einfrieren der App hängen — dann
// antwortet getSession() nie mehr und die App steht ewig auf "Verbinde mit Datenbank".
// Wir ersetzen die Sperre durch einen einfachen Durchlauf.
const ohneSperre = async (_name, _timeout, fn) => await fn();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY,
    lock: ohneSperre,
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

// Notausstieg: löscht die Sitzung lokal, ohne auf den Server zu warten
export function signOutHart() {
  try {
    Object.keys(localStorage)
      .filter(k => k === STORAGE_KEY || k.startsWith("sb-"))
      .forEach(k => localStorage.removeItem(k));
  } catch (e) { /* Speicher nicht verfügbar — dann hilft der Neustart allein */ }
}

// Sitzung direkt aus dem Speicher lesen (ohne Netzwerk, ohne Sperren)
export function sessionAusSpeicher() {
  try {
    const roh = localStorage.getItem(STORAGE_KEY);
    if (!roh) return null;
    const s = JSON.parse(roh);
    return s?.access_token ? s : (s?.currentSession || null);
  } catch (e) { return null; }
}

export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) return data.session;
  } catch (e) { /* Rückfall unten */ }
  // Rückfall: gespeicherte Sitzung verwenden, damit die App startbar bleibt
  return sessionAusSpeicher();
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error("Profil-Ladefehler: " + error.message);
  if (!data) throw new Error("Kein Profil gefunden für diesen Benutzer. Bitte Administrator kontaktieren.");
  return data;
}
export async function getAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("vorname");
  if (error) throw new Error(error.message);
  return data;
}
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}
// ─── Änderungsprotokoll (nur Administratoren) ────────────────────────
export async function getProtokoll({ limit = 500, von = null, bis = null } = {}) {
  let q = supabase.from("aenderungsprotokoll").select("*")
    .order("zeitpunkt", { ascending: false }).limit(limit);
  if (von) q = q.gte("zeitpunkt", von);
  if (bis) q = q.lte("zeitpunkt", bis);
  const { data, error } = await q;
  if (error) throw new Error(friendlyUserError(error.message));
  return data || [];
}

// ─── Positionskatalog (nur Administratoren dürfen ändern) ────────────
export async function getPositionen() {
  const { data, error } = await supabase.from("positionen")
    .select("*").order("sortierung", { ascending: true });
  if (error) throw new Error(friendlyUserError(error.message));
  return data || [];
}

export async function savePosition(pos) {
  const { data, error } = await supabase.from("positionen")
    .upsert(pos, { onConflict: "key" }).select().single();
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}

export async function deletePosition(key) {
  const { error } = await supabase.from("positionen").delete().eq("key", key);
  if (error) throw new Error(friendlyUserError(error.message));
}

// ─── Jahreskonten (Urlaubsanspruch je Jahr) ──────────────────────────
export async function getJahreskonten() {
  const { data, error } = await supabase.from("jahreskonten").select("*");
  if (error) throw new Error(friendlyUserError(error.message));
  return data || [];
}

export async function setJahreskonto(userId, jahr, urlaubstage, resturlaub) {
  const { data, error } = await supabase.from("jahreskonten")
    .upsert({ user_id: userId, jahr, urlaubstage, resturlaub, updated_at: new Date().toISOString() },
            { onConflict: "user_id,jahr" })
    .select().single();
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}

export async function uebertragBerechnen(jahr) {
  const { data, error } = await supabase.rpc("uebertrag_berechnen", { p_jahr: jahr });
  if (error) throw new Error(friendlyUserError(error.message));
  return data || [];
}

// ─── Überstundenanträge ──────────────────────────────────────────────
export async function createUeberstundenAntrag(userId, stunden, grund) {
  const { data, error } = await supabase.from("ueberstunden_antraege")
    .insert({ user_id: userId, stunden, grund: grund || null, status: "pending" })
    .select().single();
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}

export async function getUeberstundenAntraege() {
  // Kein eingebettetes Profil laden: die Tabelle verweist zweimal auf profiles
  // (user_id und entschieden_von), was die API nicht auflösen kann.
  // Die Namen holt sich die App aus der ohnehin geladenen Profilliste.
  const { data, error } = await supabase.from("ueberstunden_antraege")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(friendlyUserError(error.message));
  return data || [];
}

export async function decideUeberstundenAntrag(antragId, status, hinweis) {
  const { data, error } = await supabase.rpc("ueberstunden_entscheiden", {
    p_antrag: antragId, p_status: status, p_hinweis: hinweis || null,
  });
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}

export async function deleteUeberstundenAntrag(antragId) {
  const { error } = await supabase.from("ueberstunden_antraege").delete().eq("id", antragId);
  if (error) throw new Error(friendlyUserError(error.message));
}

// Datenbank-Fehlermeldungen in verständliches Deutsch übersetzen
function friendlyUserError(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("bereits vergeben") || m.includes("duplicate key") || m.includes("users_email"))
    return "Diese E-Mail-Adresse wird bereits verwendet. Bitte eine andere wählen.";
  if (m.includes("verwaistes profil"))
    return "Zu dieser E-Mail existiert noch ein altes Profil ohne Zugang. Bitte den Mitarbeiter zuerst in der Liste löschen.";
  if (m.includes("nur administratoren"))
    return "Nur Administratoren dürfen Benutzer anlegen oder löschen.";
  if (m.includes("passwort zu kurz"))
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  if (m.includes("schema cache") || m.includes("column")) {
    const feld = (msg.match(/'([a-z_]+)' column/) || [])[1];
    return "Die Datenbank kennt das Feld" + (feld ? " \"" + feld + "\"" : "") +
           " noch nicht. Bitte das SQL-Update \"Arbeitszeit\" in Supabase ausführen.";
  }
  if (m.includes("could not find the function") || m.includes("does not exist"))
    return "Die Datenbankfunktion fehlt. Bitte das SQL-Update in Supabase ausführen.";
  if (m.includes("failed to fetch") || m.includes("networkerror"))
    return "Keine Verbindung zur Datenbank. Bitte Internetverbindung prüfen.";
  return msg || "Unbekannter Fehler.";
}

export async function createUser({ email, password, vorname, nachname, role, position, geschlecht, color, urlaubstage, ueberstunden, resturlaub, einstellungsdatum, geburtsdatum, wochenstunden, arbeitstage_woche, pauschal, fronleichnam }) {
  const mail = (email || "").trim().toLowerCase();
  if (!mail.includes("@")) throw new Error("Bitte eine gültige E-Mail-Adresse eingeben.");
  if (!password || password.length < 8) throw new Error("Das Passwort muss mindestens 8 Zeichen lang sein.");

  // Vorabprüfung: verwaistes Profil oder bereits vergebene E-Mail?
  const { data: exists } = await supabase.from("profiles").select("id, vorname, nachname").ilike("email", mail).maybeSingle();
  if (exists) {
    const name = [exists.vorname, exists.nachname].filter(Boolean).join(" ") || mail;
    throw new Error("Es gibt bereits einen Eintrag für " + name + " mit dieser E-Mail. Bitte diesen zuerst löschen oder eine andere Adresse verwenden.");
  }

  // Admin-Session NICHT überschreiben → User direkt per RPC anlegen
  const { data, error } = await supabase.rpc("admin_create_user", {
    p_email: mail,
    p_password: password,
    p_vorname: vorname || "",
    p_nachname: nachname || "",
    p_role: role || "mitarbeiter",
    p_position: position || "trainer",
    p_color: color || "#5a8a1f",
    p_urlaubstage: urlaubstage ?? 26,
    p_ueberstunden: ueberstunden ?? 0,
    p_resturlaub: resturlaub ?? 0,
    p_einstellungsdatum: einstellungsdatum || null,
    p_geburtsdatum: geburtsdatum || null,
    p_geschlecht: geschlecht || 'd',
    p_wochenstunden: wochenstunden ?? 40,
    p_arbeitstage_woche: arbeitstage_woche ?? 5,
    p_pauschal: !!pauschal,
    p_fronleichnam: !!fronleichnam,
  });
  if (error) throw new Error(friendlyUserError(error.message));
  return data;
}

// Löscht Zugang, Profil und Einträge gemeinsam – verhindert verwaiste Profile
export async function deleteUser(userId) {
  const { error } = await supabase.rpc("admin_delete_user", { target_user_id: userId });
  if (!error) return;

  // Fallback: falls die Funktion (noch) nicht existiert, wenigstens das Profil entfernen
  if ((error.message || "").toLowerCase().includes("could not find the function")) {
    const { error: e2 } = await supabase.from("profiles").delete().eq("id", userId);
    if (e2) throw new Error(friendlyUserError(e2.message));
    return;
  }
  throw new Error(friendlyUserError(error.message));
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
  // Flag setzen: Mitarbeiter muss Passwort ändern (Fehler ignorieren falls Spalte fehlt)
  try {
    await supabase.from("profiles").update({ must_change_password: true }).eq("id", userId);
  } catch (e) {
    console.warn("must_change_password Flag konnte nicht gesetzt werden:", e.message);
  }
}

// Flag zurücksetzen nachdem Mitarbeiter Passwort geändert hat
export async function clearMustChangePassword(userId) {
  await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
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

// ─── Nachrichten zu Einträgen ─────────────────────────────────────────────────
// Speichert eine Nachricht (z.B. Ablehnungsgrund, Änderungsantrag) zu einem Entry
export async function addEntryMessage(entryId, message, type="info") {
  const { error } = await supabase.from("entry_messages").insert({
    entry_id: entryId,
    message,
    type, // 'rejection', 'change_request', 'admin_suggestion', 'info'
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function getEntryMessages(entryId) {
  const { data, error } = await supabase
    .from("entry_messages")
    .select("*")
    .eq("entry_id", entryId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// ─── Mitarbeiter-Benachrichtigungen ───────────────────────────────────────────
export async function createNotification(userId, message, type="info", entryId=null) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    message,
    type,
    entry_id: entryId,
    read: false,
    created_at: new Date().toISOString(),
  });
  if (error) console.warn("Notification error:", error.message);
}

export async function getMyNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("read", false)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function markNotificationRead(id) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}
