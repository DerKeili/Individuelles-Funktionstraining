import { useState, useRef, useEffect } from "react";
import {
  supabase, signIn, signOut, getSession,
  getProfile, getAllProfiles, updateProfile, createUser, deleteUser, signOutHart, sessionAusSpeicher,
  getAllEntries, getMyEntries, getConfirmedEntries,
  createEntry, updateEntry, setEntryStatus, deleteEntry, checkConflicts,
  adminResetPassword, requestPasswordReset,
  getPasswordResetRequests, dismissResetRequest,
  createNotification, getMyNotifications, markNotificationRead,
  clearMustChangePassword,
  getJahreskonten, setJahreskonto, uebertragBerechnen,
  createUeberstundenAntrag, getUeberstundenAntraege,
  decideUeberstundenAntrag, deleteUeberstundenAntrag,
} from "./supabase.js";

// ─── Feiertagsdaten 2025–2027 (alle 16 Bundesländer) ─────────────────────────
const KALENDER_DB = {"BW":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-01-07","2025-01-07","Heilige Drei Könige"],["2025-03-27","2025-04-04","Osterferien"],["2025-05-30","2025-05-30","Pfingstfreitag"],["2025-06-10","2025-06-21","Pfingstferien"],["2025-07-31","2025-09-13","Sommerferien"],["2025-10-28","2025-10-31","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-01-06","2026-01-06","Heilige Drei Könige"],["2026-04-09","2026-04-18","Osterferien"],["2026-06-09","2026-06-20","Pfingstferien"],["2026-07-30","2026-09-12","Sommerferien"],["2026-11-02","2026-11-06","Herbstferien"],["2026-12-23","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-10","Osterferien"],["2027-06-08","2027-06-19","Pfingstferien"],["2027-07-29","2027-09-11","Sommerferien"],["2027-11-01","2027-11-05","Herbstferien"],["2027-12-22","2028-01-07","Weihnachtsferien"]]}},"BY":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-06-19":"Fronleichnam","2025-08-15":"Mariä Himmelfahrt","2025-11-01":"Allerheiligen"},"ferien":[["2025-02-27","2025-03-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-31","2025-09-12","Sommerferien"],["2025-11-03","2025-11-07","Herbstferien"],["2025-12-24","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-06-04":"Fronleichnam","2026-08-15":"Mariä Himmelfahrt","2026-11-01":"Allerheiligen"},"ferien":[["2026-02-19","2026-02-27","Winterferien"],["2026-04-09","2026-04-17","Osterferien"],["2026-07-30","2026-09-11","Sommerferien"],["2026-11-02","2026-11-06","Herbstferien"],["2026-12-23","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-05-27":"Fronleichnam","2027-08-15":"Mariä Himmelfahrt","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-01","2027-03-05","Winterferien"],["2027-03-29","2027-04-09","Osterferien"],["2027-07-29","2027-09-10","Sommerferien"],["2027-11-01","2027-11-05","Herbstferien"],["2027-12-24","2028-01-05","Weihnachtsferien"]]}},"BE":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-03-08":"Internationaler Frauentag"},"ferien":[["2025-01-27","2025-02-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-24","2025-09-06","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-03-08":"Internationaler Frauentag"},"ferien":[["2026-02-02","2026-02-06","Winterferien"],["2026-04-01","2026-04-17","Osterferien"],["2026-07-16","2026-08-28","Sommerferien"],["2026-10-19","2026-10-30","Herbstferien"],["2026-12-21","2027-01-03","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-03-08":"Internationaler Frauentag"},"ferien":[["2027-02-01","2027-02-05","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-15","2027-08-27","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-20","2028-01-02","Weihnachtsferien"]]}},"BB":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-27","2025-02-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-24","2025-09-06","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-06","Winterferien"],["2026-04-01","2026-04-17","Osterferien"],["2026-07-16","2026-08-28","Sommerferien"],["2026-10-19","2026-10-30","Herbstferien"],["2026-12-21","2027-01-03","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-05","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-15","2027-08-27","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-20","2028-01-02","Weihnachtsferien"]]}},"HB":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-03","2025-02-04","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-03","Winterferien"],["2026-03-25","2026-04-09","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-02","Winterferien"],["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"HH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-31","2025-01-31","Winterferien"],["2025-03-10","2025-03-21","Frühjahrsferien"],["2025-07-10","2025-08-20","Sommerferien"],["2025-10-03","2025-10-17","Herbstferien"],["2025-12-19","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-01-30","2026-01-30","Winterferien"],["2026-03-02","2026-03-13","Frühjahrsferien"],["2026-07-16","2026-08-26","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-18","2027-01-01","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-03-01","2027-03-12","Frühjahrsferien"],["2027-07-15","2027-08-25","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-20","2027-12-31","Weihnachtsferien"]]}},"HE":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam"},"ferien":[["2025-03-24","2025-04-04","Osterferien"],["2025-07-07","2025-08-15","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-09","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-07-06","2026-08-14","Sommerferien"],["2026-10-12","2026-10-24","Herbstferien"],["2026-12-21","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-07-05","2027-08-13","Sommerferien"],["2027-10-11","2027-10-23","Herbstferien"],["2027-12-22","2028-01-07","Weihnachtsferien"]]}},"MV":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-03-08":"Internationaler Frauentag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-07","2025-08-16","Sommerferien"],["2025-10-04","2025-10-18","Herbstferien"],["2025-12-22","2026-01-03","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-03-08":"Internationaler Frauentag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-16","2026-02-21","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-06","2026-08-15","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-03-08":"Internationaler Frauentag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-15","2027-02-20","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-05","2027-08-14","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}},"NI":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-31","2025-01-31","Winterferien"],["2025-04-07","2025-04-22","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-03","Winterferien"],["2026-03-25","2026-04-09","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-24","Herbstferien"],["2026-12-23","2027-01-05","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-02","Winterferien"],["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-23","Herbstferien"],["2027-12-22","2028-01-04","Weihnachtsferien"]]}},"NW":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-05","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-11","Osterferien"],["2026-06-29","2026-08-11","Sommerferien"],["2026-10-05","2026-10-17","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-10","Osterferien"],["2027-06-28","2027-08-10","Sommerferien"],["2027-10-04","2027-10-16","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"RP":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-01","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-07","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-06-29","2026-08-07","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-06-28","2027-08-06","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SL":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-08-15":"Mariä Himmelfahrt","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-01","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-07","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-08-15":"Mariä Himmelfahrt","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-06-29","2026-08-07","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-08-15":"Mariä Himmelfahrt","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-06-28","2027-08-06","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SN":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-10-31":"Reformationstag","2025-11-19":"Buß- und Bettag"},"ferien":[["2025-02-17","2025-03-01","Winterferien"],["2025-04-18","2025-04-26","Osterferien"],["2025-07-21","2025-08-29","Sommerferien"],["2025-10-06","2025-10-17","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-10-31":"Reformationstag","2026-11-18":"Buß- und Bettag"},"ferien":[["2026-02-16","2026-02-28","Winterferien"],["2026-04-09","2026-04-18","Osterferien"],["2026-07-20","2026-08-28","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-10-31":"Reformationstag","2027-11-17":"Buß- und Bettag"},"ferien":[["2027-02-15","2027-02-27","Winterferien"],["2027-03-29","2027-04-10","Osterferien"],["2027-07-19","2027-08-27","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}},"ST":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-24","Osterferien"],["2025-07-10","2025-08-20","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-10-31":"Reformationstag"},"ferien":[["2026-02-09","2026-02-14","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-09","2026-08-19","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-21","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-10-31":"Reformationstag"},"ferien":[["2027-02-08","2027-02-13","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-08","2027-08-18","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-04-07","2025-04-18","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-03-30","2026-04-17","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-05","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-04","Weihnachtsferien"]]}},"TH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-09-20":"Weltkindertag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-07","2025-08-16","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-03","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-09-20":"Weltkindertag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-16","2026-02-21","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-06","2026-08-15","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-09-20":"Weltkindertag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-15","2027-02-20","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-05","2027-08-14","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}}};



// ─── Sicheres Passwort generieren ────────────────────────────────────────────
function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const pick = (s, n) => Array.from({length:n}, ()=>s[Math.floor(Math.random()*s.length)]);
  const all = [...pick(upper,3),...pick(lower,3),...pick(digits,3),...pick(special,2)];
  for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
  return all.join("");
}

// ─── Urlaubstage anhand Betriebszugehörigkeit berechnen ──────────────────────
function calcUrlaubstage(einstellungsdatum, refYear=new Date().getFullYear()) {
  if (!einstellungsdatum) return 26;
  const einDate = new Date(einstellungsdatum);
  const refDate = new Date(refYear, 11, 31); // 31.12. des Referenzjahres
  let jahre = refDate.getFullYear() - einDate.getFullYear();
  // Exakt: hat der MA das Jubiläum im Referenzjahr schon erreicht?
  const jubiläum = new Date(refYear, einDate.getMonth(), einDate.getDate());
  if (refDate < jubiläum) jahre--;
  if (jahre < 1) return 26;
  if (jahre < 5) return 27;
  if (jahre < 10) return 28;
  return 29;
}

const BUNDESLAENDER=[["","—"],["BW","Baden-Württemberg"],["BY","Bayern"],["BE","Berlin"],["BB","Brandenburg"],["HB","Bremen"],["HH","Hamburg"],["HE","Hessen"],["MV","Mecklenburg-Vorpommern"],["NI","Niedersachsen"],["NW","Nordrhein-Westfalen"],["RP","Rheinland-Pfalz"],["SL","Saarland"],["SN","Sachsen"],["ST","Sachsen-Anhalt"],["SH","Schleswig-Holstein"],["TH","Thüringen"]];
const MONTHS=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DAYS_SHORT=["Mo","Di","Mi","Do","Fr","Sa","So"];
const PRESET_COLORS=["#2563EB","#DC2626","#059669","#D97706","#7C3AED","#DB2777","#0891B2","#65A30D","#EA580C","#0F766E"];

// ─── Kalender-Helpers ─────────────────────────────────────────────────────────
// Ostersonntag nach der Gaußschen Osterformel — Grundlage aller beweglichen Feiertage
function osterSonntag(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
        f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
        i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
        mo=Math.floor((h+l-7*m+114)/31),tg=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,tg);
}
const plusTage=(dt,n)=>{const d=new Date(dt);d.setDate(d.getDate()+n);return d;};
// Bundeslandspezifische Feiertage
const FT_REGIONAL={
  dreikoenige:["BW","BY","ST"],
  fronleichnam:["BW","BY","HE","NW","RP","SL"],   // in SN nur einzelne Gemeinden → je Mitarbeiter
  mariaeHimmelfahrt:["BY","SL"],
  reformation:["BB","HB","HH","MV","NI","SN","ST","SH","TH"],
  allerheiligen:["BW","BY","NW","RP","SL"],
  bussUndBettag:["SN"],
  frauentag:["BE","MV"],
  weltkindertag:["TH"],
};
// Buß- und Bettag: Mittwoch vor dem 23. November
function bussBettag(y){const d=new Date(y,10,23);d.setDate(23-((d.getDay()+4)%7||7));return d;}
function berechneFeiertage(state,y){
  const ft={},setze=(dt,name)=>{ft[isoOf(dt)]=name;};
  const o=osterSonntag(y);
  setze(new Date(y,0,1),"Neujahr");
  setze(plusTage(o,-2),"Karfreitag");
  setze(o,"Ostersonntag");
  setze(plusTage(o,1),"Ostermontag");
  setze(new Date(y,4,1),"Tag der Arbeit");
  setze(plusTage(o,39),"Christi Himmelfahrt");
  setze(plusTage(o,49),"Pfingstsonntag");
  setze(plusTage(o,50),"Pfingstmontag");
  setze(new Date(y,9,3),"Tag der Deutschen Einheit");
  setze(new Date(y,11,25),"1. Weihnachtstag");
  setze(new Date(y,11,26),"2. Weihnachtstag");
  const hat=k=>FT_REGIONAL[k].includes(state);
  if(hat("dreikoenige"))       setze(new Date(y,0,6),"Heilige Drei Könige");
  if(hat("frauentag"))         setze(new Date(y,2,8),"Internationaler Frauentag");
  if(hat("fronleichnam"))      setze(plusTage(o,60),"Fronleichnam");
  if(hat("mariaeHimmelfahrt")) setze(new Date(y,7,15),"Mariä Himmelfahrt");
  if(hat("weltkindertag"))     setze(new Date(y,8,20),"Weltkindertag");
  if(hat("reformation"))       setze(new Date(y,9,31),"Reformationstag");
  if(hat("allerheiligen"))     setze(new Date(y,10,1),"Allerheiligen");
  if(hat("bussUndBettag"))     setze(bussBettag(y),"Buß- und Bettag");
  return ft;
}
// Fronleichnam = Ostersonntag + 60 Tage. In Sachsen nur in einzelnen Gemeinden
// des Landkreises Bautzen gesetzlicher Feiertag — deshalb je Mitarbeiter wählbar.
const FRONLEICHNAM_WAHL_BL=["SN","TH"];
const FL_CACHE={};
function fronleichnamISO(y){
  if(!FL_CACHE[y])FL_CACHE[y]=isoOf(plusTage(osterSonntag(y),60));
  return FL_CACHE[y];
}
const FT_CACHE={};
// Hinterlegte Jahre nutzen; für alle anderen Jahre die Feiertage berechnen.
// Ferien werden von den Kultusministerien festgelegt und lassen sich nicht berechnen.
function getSD(state,year){
  if(!state)return{feiertage:{},ferien:[]};
  const y=String(year);
  // 1. Amtliche Daten aus der API (falls geladen)
  if(API_DB[state+y])return API_DB[state+y];
  // 2. Fest hinterlegte Daten
  const db=KALENDER_DB[state];
  if(db&&db[y])return db[y];
  // 3. Berechnete Feiertage
  const key=state+y;
  if(!FT_CACHE[key])FT_CACHE[key]={feiertage:berechneFeiertage(state,Number(year)),ferien:[]};
  return FT_CACHE[key];
}
// ─── Amtliche Daten von der OpenHolidays-API ────────────────────────────────
// Kostenfreies Open-Data-Projekt mit Feiertagen UND Schulferien aller Bundesländer.
// Die Daten werden im Browser zwischengespeichert, damit die App auch offline läuft.
const API_DB={};                       // "SN2028" -> {feiertage,ferien}
const API_BASIS="https://openholidaysapi.org";
const API_CACHE_TAGE=14;
const apiKey=(st,y)=>"up_kal_"+st+"_"+y;

function ausCache(st,y){
  try{
    const roh=localStorage.getItem(apiKey(st,y));
    if(!roh)return null;
    const c=JSON.parse(roh);
    if(Date.now()-c.zeit>API_CACHE_TAGE*24*60*60*1000)return null;
    return c.daten;
  }catch(e){return null;}
}
function inCache(st,y,daten){
  try{localStorage.setItem(apiKey(st,y),JSON.stringify({zeit:Date.now(),daten}));}catch(e){}
}
const apiName=n=>{
  if(!Array.isArray(n))return "";
  return (n.find(x=>x.language==="DE")||n[0]||{}).text||"";
};
async function holeVonApi(pfad,st,y){
  const q="countryIsoCode=DE&subdivisionCode=DE-"+st+"&languageIsoCode=DE"
         +"&validFrom="+y+"-01-01&validTo="+y+"-12-31";
  const r=await fetch(API_BASIS+"/"+pfad+"?"+q,{headers:{accept:"application/json"}});
  if(!r.ok)throw new Error("API "+r.status);
  return await r.json();
}
// Lädt Feiertage und Ferien; liefert true, wenn neue Daten vorliegen
async function ladeKalenderJahr(st,y){
  if(!st)return false;
  const k=st+y;
  if(API_DB[k])return false;
  const c=ausCache(st,y);
  if(c){API_DB[k]=c;return true;}
  try{
    const[ft,fr]=await Promise.all([holeVonApi("PublicHolidays",st,y),holeVonApi("SchoolHolidays",st,y)]);
    const feiertage={};
    (ft||[]).forEach(e=>{
      const name=apiName(e.name);
      let cur=e.startDate;
      while(cur&&cur<=(e.endDate||e.startDate)){
        feiertage[cur]=name;
        const[a1,b1,c1]=cur.split("-").map(Number);
        cur=isoOf(new Date(a1,b1-1,c1+1));
      }
    });
    const ferien=(fr||[]).map(e=>[e.startDate,e.endDate||e.startDate,apiName(e.name)]);
    const daten={feiertage,ferien};
    API_DB[k]=daten;inCache(st,y,daten);
    return true;
  }catch(e){
    return false;   // Kein Netz oder API nicht erreichbar → hinterlegte Daten nutzen
  }
}
const ferienVorhanden=(state,year)=>{
  const k=state+year;
  if(API_DB[k]&&API_DB[k].ferien&&API_DB[k].ferien.length)return true;
  return !!(KALENDER_DB[state]&&KALENDER_DB[state][String(year)]);
};
const isFT=(iso,s,y)=>getSD(s,y).feiertage[iso]||null;
const isFer=(iso,s,y)=>{for(const[v,b,n]of getSD(s,y).ferien){if(iso>=v&&iso<=b)return n;}return null;};
const dimM=(y,m)=>new Date(y,m+1,0).getDate();
const fwdM=(y,m)=>{let d=new Date(y,m,1).getDay();return d===0?6:d-1;};
const isWE=(y,m,d)=>{let w=new Date(y,m,d).getDay();return w===0||w===6;};
const toISO=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const fmtDE=iso=>{if(!iso)return"";const[y,m,d]=iso.split("-");return`${d}.${m}.${y}`;};
const wday=iso=>{const[y,m,d]=iso.split("-").map(Number);return["So","Mo","Di","Mi","Do","Fr","Sa"][new Date(y,m-1,d).getDay()];};
// ─── Urlaubstage-Berechnung mit Feiertagen ───────────────────────────────────
// Bundesland der laufenden Sitzung (wird in App() bei jedem Render gesetzt)
let AKT_BL="SN";
// Tage, die nur zur Hälfte vom Urlaubskonto abgezogen werden (Format MM-TT)
const HALBE_TAGE=["12-24","12-31"];
const isoOf=dt=>dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
// Wieviel Urlaub kostet ein einzelner Tag? 0 = Wochenende/Feiertag, 0.5 = halber Tag, 1 = voll
function tagesFaktor(dt,u){
  const w=dt.getDay();
  if(w===0||w===6)return 0;                       // Wochenende
  const iso=isoOf(dt);
  if(HALBE_TAGE.includes(iso.slice(5)))return 0.5; // Heiligabend / Silvester
  const jahr=dt.getFullYear();
  if(isFT(iso,AKT_BL,jahr))return 0;               // gesetzlicher Feiertag
  // Fronleichnam nur, wenn für diesen Mitarbeiter hinterlegt
  if(u&&u.fronleichnam&&FRONLEICHNAM_WAHL_BL.includes(AKT_BL)&&iso===fronleichnamISO(jahr))return 0;
  return 1;
}
function countWD(von,bis,u){
  if(!von||!bis)return 0;
  const[y1,m1,d1]=von.split("-").map(Number),[y2,m2,d2]=bis.split("-").map(Number);
  let s=new Date(y1,m1-1,d1),e=new Date(y2,m2-1,d2);
  if(e<s)return 0;
  let c=0,cur=new Date(s);
  while(cur<=e){c+=tagesFaktor(cur,u);cur.setDate(cur.getDate()+1);}
  return Math.round(c*2)/2;
}
// Zahl für die Anzeige: 4 → "4", 4.5 → "4,5"
const fmtT=n=>{const v=Number(n)||0;return Number.isInteger(v)?String(v):String(v).replace(".",",");};
function eDays(entries=[],type,u){return entries.filter(e=>e.type===type).reduce((s,e)=>s+countWD(e.von,e.bis,u),0);}

// ─── Geschlecht, Positionen & Berechtigungen ─────────────────────────────────
const GESCHLECHTER=[["w","weiblich"],["m","männlich"],["d","divers"]];
// scope: "alle" = darf alle bearbeiten · "bereich" = nur eigenen Fachbereich · "selbst" = nur sich
const POSITIONEN=[
  {key:"geschaeftsleitung",scope:"alle",   bereich:null,     l:{m:"Geschäftsleitung",w:"Geschäftsleitung",d:"Geschäftsleitung"}},
  {key:"praxisleitung",    scope:"alle",   bereich:null,     l:{m:"Praxisleitung",w:"Praxisleitung",d:"Praxisleitung"}},
  {key:"tl_physio",        scope:"bereich",bereich:"physio", l:{m:"Teamleitung Physiotherapie",w:"Teamleitung Physiotherapie",d:"Teamleitung Physiotherapie"}},
  {key:"tl_ergo",          scope:"bereich",bereich:"ergo",   l:{m:"Teamleitung Ergotherapie",w:"Teamleitung Ergotherapie",d:"Teamleitung Ergotherapie"}},
  {key:"tl_trainer",       scope:"bereich",bereich:"trainer",l:{m:"Teamleitung Trainer",w:"Teamleitung Trainer",d:"Teamleitung Trainer"}},
  {key:"tl_logo",          scope:"bereich",bereich:"logo",   l:{m:"Teamleitung Logopädie",w:"Teamleitung Logopädie",d:"Teamleitung Logopädie"}},
  {key:"tl_podo",          scope:"bereich",bereich:"podo",   l:{m:"Teamleitung Podologie",w:"Teamleitung Podologie",d:"Teamleitung Podologie"}},
  {key:"physiotherapeut",  scope:"selbst", bereich:"physio", l:{m:"Physiotherapeut",w:"Physiotherapeutin",d:"Physiotherapeut/in"}},
  {key:"ergotherapeut",    scope:"selbst", bereich:"ergo",   l:{m:"Ergotherapeut",w:"Ergotherapeutin",d:"Ergotherapeut/in"}},
  {key:"logopaede",        scope:"selbst", bereich:"logo",   l:{m:"Logopäde",w:"Logopädin",d:"Logopäde/Logopädin"}},
  {key:"podologe",         scope:"selbst", bereich:"podo",   l:{m:"Podologe",w:"Podologin",d:"Podologe/Podologin"}},
  {key:"trainer",          scope:"selbst", bereich:"trainer",l:{m:"Trainer",w:"Trainerin",d:"Trainer/in"}},
  {key:"rezeption",        scope:"selbst", bereich:"rezeption",l:{m:"Rezeption",w:"Rezeption",d:"Rezeption"}},
];
const POS_MAP=Object.fromEntries(POSITIONEN.map(p=>[p.key,p]));
const BEREICH_NAME={physio:"Physiotherapie",ergo:"Ergotherapie",trainer:"Trainer",logo:"Logopädie",podo:"Podologie",rezeption:"Rezeption"};
function posInfo(key){return POS_MAP[key]||{key:key,scope:"selbst",bereich:null,l:null};}
// Anzeigename je nach Geschlecht; unbekannte (alte) Werte werden unverändert gezeigt
function posLabel(key,geschlecht){
  const p=POS_MAP[key];
  if(!p)return key||"—";
  return p.l[geschlecht||"d"]||p.l.d;
}
// Darf "actor" das Profil/den Urlaub von "target" sehen und bearbeiten?
function canManage(actor,target){
  if(!actor||!target)return false;
  if(actor.id===target.id)return true;
  if(actor.role==="admin")return true;
  const a=posInfo(actor.position);
  if(a.scope==="alle")return true;
  if(a.scope==="bereich")return posInfo(target.position).bereich===a.bereich;
  return false;
}
// Darf "actor" über den Antrag von "target" entscheiden? Der eigene Antrag zählt nicht.
function darfEntscheiden(actor,target){
  if(!actor||!target)return false;
  if(actor.id===target.id)return actor.role==="admin"||posInfo(actor.position).scope==="alle";
  return canManage(actor,target);
}
// Hat jemand überhaupt Leitungsrechte (über sich selbst hinaus)?
function istLeitung(p){
  if(!p)return false;
  if(p.role==="admin")return true;
  const s=posInfo(p.position).scope;
  return s==="alle"||s==="bereich";
}
// ─── Arbeitszeit ─────────────────────────────────────────────────────────────
const WOCHENTAGE_AUSWAHL=[1,2,3,4,5,6];
const stdProTag=u=>{
  if(u?.pauschal)return 0;                       // keine feste Tagesstundenzahl
  const w=Number(u?.wochenstunden)||0,t=Number(u?.arbeitstage_woche)||0;
  return (w>0&&t>0)?Math.round((w/t)*100)/100:0;
};
const fmtStd=n=>{const v=Number(n)||0;return (Number.isInteger(v)?String(v):v.toFixed(2).replace(/0$/,"")).replace(".",",");};
// Urlaubstage in Stunden umrechnen (für Überstundenkonto)
const tageInStd=(tage,u)=>Math.round((Number(tage)||0)*stdProTag(u)*100)/100;
const naechsterTag=iso=>{const[y,m,d]=iso.split("-").map(Number);const dt=new Date(y,m-1,d+1);return isoOf(dt);};
// Datum, an dem "budget" Urlaubstage innerhalb von..bis aufgebraucht sind (oder null)
function splitDatum(von,bis,budget){
  if(budget<=0)return null;
  const[y1,m1,d1]=von.split("-").map(Number),[y2,m2,d2]=bis.split("-").map(Number);
  let cur=new Date(y1,m1-1,d1);const ende=new Date(y2,m2-1,d2);
  let verbraucht=0,letzter=null;
  while(cur<=ende){
    const f=tagesFaktor(cur);
    if(f>0){
      if(verbraucht+f>budget)break;
      verbraucht+=f;letzter=isoOf(cur);
    }
    cur.setDate(cur.getDate()+1);
  }
  return letzter;
}

// Schmaler Bildschirm (Handy)? Steuert die kompakte Darstellung der Kalenderleiste
function useSchmal(grenze=780){
  const [schmal,setSchmal]=useState(typeof window!=="undefined"&&window.innerWidth<grenze);
  useEffect(()=>{
    const pruefe=()=>setSchmal(window.innerWidth<grenze);
    window.addEventListener("resize",pruefe);
    window.addEventListener("orientationchange",pruefe);
    return()=>{window.removeEventListener("resize",pruefe);window.removeEventListener("orientationchange",pruefe);};
  },[grenze]);
  return schmal;
}

// Welche Feiertage und halben Tage liegen im gewählten Zeitraum?
function besondereTage(von,bis,u){
  if(!von||!bis||bis<von)return [];
  const[y1,m1,d1]=von.split("-").map(Number),[y2,m2,d2]=bis.split("-").map(Number);
  let cur=new Date(y1,m1-1,d1);const ende=new Date(y2,m2-1,d2);
  const liste=[];
  while(cur<=ende){
    const w=cur.getDay(),iso=isoOf(cur);
    if(w!==0&&w!==6){
      if(HALBE_TAGE.includes(iso.slice(5)))
        liste.push({iso,name:iso.slice(5)==="12-24"?"Heiligabend":"Silvester",halb:true});
      else{
        const ft=isFT(iso,AKT_BL,cur.getFullYear());
        if(ft)liste.push({iso,name:ft,halb:false});
        else if(u&&u.fronleichnam&&FRONLEICHNAM_WAHL_BL.includes(AKT_BL)&&iso===fronleichnamISO(cur.getFullYear()))
          liste.push({iso,name:"Fronleichnam",halb:false});
      }
    }
    cur.setDate(cur.getDate()+1);
  }
  return liste;
}
// Alter in Jahren aus dem Geburtsdatum (Geburtstag im laufenden Jahr berücksichtigt)
function alterAus(iso){
  if(!iso)return null;
  const[y,m,d]=iso.split("-").map(Number);
  if(!y||!m||!d)return null;
  const heute=new Date();
  let a=heute.getFullYear()-y;
  const hatteGeburtstag=(heute.getMonth()+1>m)||(heute.getMonth()+1===m&&heute.getDate()>=d);
  if(!hatteGeburtstag)a--;
  return (a>=0&&a<130)?a:null;
}
// Steht der Geburtstag heute oder in den nächsten Tagen an?
function tageBisGeburtstag(iso){
  if(!iso)return null;
  const[,m,d]=iso.split("-").map(Number);
  if(!m||!d)return null;
  const heute=new Date();heute.setHours(0,0,0,0);
  let next=new Date(heute.getFullYear(),m-1,d);
  if(next<heute)next=new Date(heute.getFullYear()+1,m-1,d);
  return Math.round((next-heute)/86400000);
}
// ─── Neuerungen im Programm ──────────────────────────────────────────────────
// Neueste Version steht oben. Bei jeder grundlegenden Änderung hier einen
// Eintrag ergänzen und die Version hochzählen — die App zeigt dann allen
// Benutzern beim nächsten Anmelden den Hinweis.
const CHANGELOG=[
  {
    version:"2026.08.11",
    datum:"11. August 2026",
    titel:"Jahresplanung, Überstunden und Pauschalkräfte",
    punkte:[
      "Urlaubsanspruch und Resturlaub werden ab sofort für jedes Kalenderjahr getrennt geführt. Beim Jahreswechsel wird nicht verbrauchter Urlaub als Resturlaub übertragen.",
      "Neue Abgabefrist: Bis zum 30.11. müssen mindestens 90 % des Urlaubs für das Folgejahr verplant sein. Oben erscheint ein Countdown mit Fortschrittsbalken.",
      "Resturlaub aus dem Vorjahr wird bei einem Antrag automatisch zuerst verbraucht.",
      "Überstunden können jederzeit als freie Tage beantragt werden, ohne den Urlaubsanspruch zu belasten.",
      "Mitarbeiter können eine Änderung ihrer Überstunden beantragen; die Leitung genehmigt oder lehnt ab.",
      "Neue Position „Rezeption“ sowie Pauschalkräfte ohne feste Stundenzahl und ohne Urlaubsanspruch.",
      "Fronleichnam lässt sich je Mitarbeiter als Feiertag hinterlegen (Landkreis Bautzen).",
    ],
  },
];
const AKTUELLE_VERSION=CHANGELOG[0].version;
// Alle Einträge, die neuer sind als die zuletzt bestätigte Version
function neueEintraege(gelesen){
  if(!gelesen)return CHANGELOG;
  return CHANGELOG.filter(e=>e.version>gelesen);
}

// ─── Abgabefrist für die Jahresurlaubsplanung ────────────────────────────────
const FRIST_MONAT=10, FRIST_TAG=30;      // 30. November (Monat 0-basiert)
const MINDEST_ANTEIL=0.9;                // 90 % des Anspruchs müssen verplant sein
// Frist für die Planung des Jahres "planJahr" – sie liegt im Jahr davor
const fristFuer=planJahr=>new Date(planJahr-1,FRIST_MONAT,FRIST_TAG,23,59,59);
function fristRest(planJahr){
  const ms=fristFuer(planJahr).getTime()-Date.now();
  if(ms<=0)return null;
  const tage=Math.floor(ms/86400000);
  const stunden=Math.floor((ms%86400000)/3600000);
  const minuten=Math.floor((ms%3600000)/60000);
  return{ms,tage,stunden,minuten};
}

// Pauschalkraft: keine feste Wochenstundenzahl, kein fester Urlaubsanspruch
const istPauschal=u=>!!u?.pauschal;
const TYP_LABEL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
const ROLLEN=[["mitarbeiter","Mitarbeiter"],["admin","Administrator"]];
const rolleLabel=r=>r==="admin"?"Administrator":"Mitarbeiter";
const ca=(hex,a)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;};
const lighten=(hex,f=0.4)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`#${Math.round(r+(255-r)*f).toString(16).padStart(2,"0")}${Math.round(g+(255-g)*f).toString(16).padStart(2,"0")}${Math.round(b+(255-b)*f).toString(16).padStart(2,"0")}`;};
const PRINT_STYLE=`@media print{body *{visibility:hidden!important;}.pt,.pt *{visibility:visible!important;}.pt{position:fixed;left:0;top:0;width:100%;height:100%;background:#fff;z-index:9999;}@page{margin-top:6mm;margin-bottom:6mm;size:A4 landscape;margin:6mm;}}`;

// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);       // eigenes Profil
  const [profiles,setProfiles]=useState([]);        // alle Profile
  const [entries,setEntries]=useState([]);           // alle sichtbaren Einträge
  const [loading,setLoading]=useState(true);
  const [year,setYear]=useState(new Date().getFullYear());
  const [bundesland,setBundesland]=useState("SN");
  const [showFerien,setShowFerien]=useState(true);
  const [showFeiertage,setShowFeiertage]=useState(true);
  const [kalBereich,setKalBereich]=useState("alle");   // Bereichsfilter im Kalender (nur Leitung)
  const [ueAntraege,setUeAntraege]=useState([]);       // Überstundenanträge
  const [jahreskonten,setJahreskonten]=useState([]);   // Urlaubsanspruch je Jahr
  const [neuerungenZu,setNeuerungenZu]=useState(false); // in dieser Sitzung weggeklickt
  const [fristTick,setFristTick]=useState(0);          // aktualisiert den Countdown
  useEffect(()=>{const t=setInterval(()=>setFristTick(x=>x+1),60000);return()=>clearInterval(t);},[]);
  // Für welches Jahr muss geplant werden? Bis zum 30.11. für das Folgejahr,
  // danach ist die Planung des Folgejahres abgeschlossen.
  const heuteJetzt=new Date();
  const planJahr=heuteJetzt.getFullYear()+1;
  const schmal=useSchmal();                            // Handy-Ansicht?
  const [view,setView]=useState("kalender");
  const [modal,setModal]=useState(null);
  const [tooltip,setTooltip]=useState(null);
  const [profileDirty,setProfileDirty]=useState(false);
  const [pendingView,setPendingView]=useState(null);
  const [myNotifications,setMyNotifications]=useState([]);
  const [pendingJumpYear,setPendingJumpYear]=useState(null);
  const [dashRefresh,setDashRefresh]=useState(0);
  const [printMode,setPrintMode]=useState(null);
  const [notif,setNotif]=useState(null);
  const styleRef=useRef(false);
  const profileLoadedRef=useRef(false);
  const [dbError,setDbError]=useState(false);

  if(!styleRef.current){
    const s=document.createElement("style");
    s.textContent=PRINT_STYLE+`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Nunito Sans',sans-serif;background:#f0f4f0;color:#2d3a2e;}input,select,textarea{font-family:inherit;}button{cursor:pointer;font-family:inherit;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#e8f0e8;}::-webkit-scrollbar-thumb{background:#7ab529;border-radius:3px;}`;
    document.head.appendChild(s);
    styleRef.current=true;
  }

  const isAdmin=profile?.role==="admin";
  const isLeitung=istLeitung(profile);
  AKT_BL=bundesland;   // Feiertagslogik der Urlaubsberechnung auf das gewählte Bundesland setzen
  // Nur Geschäfts-/Praxisleitung und Administratoren sehen alle Bereiche und dürfen umschalten
  const darfBereichFiltern=isAdmin||posInfo(profile?.position).scope==="alle";

  // ── Session-Init ──────────────────────────────────────────────────
  // Sitzung abgelaufen? Neuer Kalendertag ODER älter als 24 Stunden → neu anmelden
  function sessionAbgelaufen(sess){
    // ACHTUNG: "expires_at" ist die Gültigkeit des Zugriffstokens (eine Stunde)
    // und NICHT das Ende der Sitzung. Supabase erneuert es im Hintergrund selbst.
    // Es darf deshalb hier nicht geprüft werden — sonst wird man nach einer
    // Stunde Nutzung fälschlich mit dem Hinweis "neuer Tag" abgemeldet.
    const last=sess?.user?.last_sign_in_at;
    if(!last)return false;
    const anmeldung=new Date(last);
    if(isNaN(anmeldung.getTime()))return false;
    if(Date.now()-anmeldung.getTime()>24*60*60*1000)return true;      // älter als 24 h
    const heute=new Date();
    return anmeldung.getFullYear()!==heute.getFullYear()
        || anmeldung.getMonth()!==heute.getMonth()
        || anmeldung.getDate()!==heute.getDate();                       // anderer Kalendertag
  }

  // Harte Zeitgrenze: ein hängender Netzwerkaufruf blockiert sonst dauerhaft
  // (genau das passiert beim Wechsel WLAN → Mobilfunk: die alte Verbindung antwortet nie mehr)
  function mitZeitlimit(promise,ms=8000){
    return Promise.race([
      promise,
      new Promise((_,ab)=>setTimeout(()=>ab(new Error("Zeitüberschreitung")),ms)),
    ]);
  }
  // Netzwerkaufruf mit mehreren Versuchen — fängt schlafende Verbindungen nach App-Wechsel ab
  async function mitWiederholung(fn,versuche=3,limit=8000){
    let letzterFehler;
    for(let i=0;i<versuche;i++){
      try{return await mitZeitlimit(Promise.resolve().then(fn),limit);}
      catch(e){letzterFehler=e;if(i<versuche-1)await new Promise(r=>setTimeout(r,700*(i+1)));}
    }
    throw letzterFehler;
  }

  const bootRef=useRef(false);
  async function boot(){
    if(bootRef.current)return;          // kein paralleler Doppelstart
    bootRef.current=true;
    setDbError(false);
    setLoading(true);
    try{
      // ZUERST ohne Netzwerk prüfen: liegt die letzte Anmeldung vor dem heutigen Tag,
      // ist die Sitzung ohnehin hinfällig. Dann gar nicht erst versuchen, das
      // abgelaufene Token zu erneuern — genau dabei blieb die App bisher stehen.
      const gespeichert=sessionAusSpeicher();
      // Nur beim Start: liegt die Gültigkeit sehr weit zurück, ist auch das
      // Erneuerungstoken hinüber — dann direkt zur Anmeldung, ohne Wartezeit.
      const langeTot=gespeichert?.expires_at
        &&Date.now()-gespeichert.expires_at*1000>7*24*60*60*1000;
      if(gespeichert&&(langeTot||sessionAbgelaufen(gespeichert))){
        signOutHart();
        try{signOut();}catch(e){}
        setSession(null);setProfile(null);setProfiles([]);setEntries([]);
        profileLoadedRef.current=false;
        setLoading(false);
        return;
      }
      if(!gespeichert){setSession(null);setLoading(false);return;}

      const sess=await mitWiederholung(()=>getSession(),2,5000);
      if(!sess){setLoading(false);return;}
      if(sessionAbgelaufen(sess)){
        signOutHart();
        try{signOut();}catch(e){}
        setSession(null);setProfile(null);setProfiles([]);setEntries([]);
        profileLoadedRef.current=false;
        setLoading(false);
        return;
      }
      setSession(sess);
      await mitWiederholung(()=>loadAll(sess.user.id),2,8000);
      setLoading(false);
    }catch(e){
      // Ohne gültige gespeicherte Sitzung ist die Anmeldemaske die richtige Antwort
      if(!sessionAusSpeicher()){
        setSession(null);
        setLoading(false);
      }else if(neustartMitSchutz()){
        // Seite wird neu geladen — dabei entsteht eine frische Verbindung
      }else{
        if(document.visibilityState==="visible")setDbError(true);
        setLoading(false);
      }
    }finally{
      bootRef.current=false;
    }
  }

  useEffect(()=>{
    boot();

    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(event,sess)=>{
      // USER_UPDATED (nach Passwortänderung): NUR wenn Profil schon geladen ist,
      // ignorieren um must_change_password Schleife zu vermeiden.
      if(event==="USER_UPDATED"&&profileLoadedRef.current){
        setSession(sess);
        return;
      }
      // Abmeldung
      if(!sess){
        setSession(null);setProfile(null);setProfiles([]);setEntries([]);
        setLoading(false);profileLoadedRef.current=false;
        return;
      }
      // Anmeldung / initiale Session / Token-Refresh: Profil laden
      setSession(sess);
      await loadAll(sess.user.id);
    });
    return()=>{subscription.unsubscribe();};
  },[]);

  // ── Rückkehr aus dem Hintergrund: automatisch neu verbinden ───────
  const dbErrorRef=useRef(false);
  const sessionRef=useRef(null);
  const profileRef=useRef(null);
  const ladeRef=useRef(true);
  useEffect(()=>{ladeRef.current=loading;},[loading]);
  useEffect(()=>{dbErrorRef.current=dbError;},[dbError]);
  useEffect(()=>{sessionRef.current=session;},[session]);
  useEffect(()=>{profileRef.current=profile;},[profile]);

  // iOS/Safari hält nach dem Einfrieren der App die alte HTTPS-Verbindung offen,
  // obwohl sie längst tot ist. Neue Anfragen reihen sich daran an und antworten nie.
  // Nur ein vollständiger Seiten-Neustart baut eine frische Verbindung auf.
  function neustartMitSchutz(mindestAbstand=12000){
    try{
      const letzter=Number(sessionStorage.getItem("up_letzter_neustart")||0);
      if(Date.now()-letzter<mindestAbstand)return false;   // Schutz vor Neustart-Schleifen
      sessionStorage.setItem("up_letzter_neustart",String(Date.now()));
    }catch(e){}
    window.location.reload();
    return true;
  }
  // Wie lange lag die App im Hintergrund?
  const verstecktSeit=useRef(0);

  useEffect(()=>{
    async function beiRueckkehr(){
      if(document.visibilityState!=="visible"){
        verstecktSeit.current=Date.now();       // App wandert in den Hintergrund
        return;
      }
      const pause=verstecktSeit.current?Date.now()-verstecktSeit.current:0;
      verstecktSeit.current=0;
      const sess=sessionRef.current;

      // Lag die App länger als eine Minute im Hintergrund, ist die Verbindung
      // auf iOS praktisch immer tot. Dann sofort neu laden, statt erst zu prüfen,
      // zu scheitern und den Ladebildschirm zu zeigen.
      if(pause>60000&&sess&&!sessionAbgelaufen(sess)){
        if(neustartMitSchutz())return;
      }

      // Neuer Tag angebrochen, während die App im Hintergrund lag → abmelden
      if(sess&&sessionAbgelaufen(sess)){
        try{sessionStorage.setItem("up_tageswechsel","1");}catch(e){}
        signOutHart();
        try{signOut();}catch(e){}
        window.location.reload();
        return;
      }

      // Kurzer Verbindungstest: antwortet die Datenbank noch?
      let lebt=false;
      try{
        await mitZeitlimit(getProfile((sess||sessionAusSpeicher())?.user?.id),3000);
        lebt=true;
      }catch(e){lebt=false;}

      if(!lebt){
        // Tote Verbindung → Neustart der Seite, das ist der einzig verlässliche Weg
        if(neustartMitSchutz())return;
        await boot();
        return;
      }

      // Verbindung steht: hängengebliebenen Start abschließen bzw. Daten auffrischen
      if(!sess||ladeRef.current||dbErrorRef.current){await boot();return;}
      try{await loadEntries(istLeitung(profileRef.current),sess.user.id);}catch(e){}
    }
    // Netzverbindung ist zurück → sofort neu verbinden
    function beiOnline(){
      if(dbErrorRef.current||ladeRef.current){bootRef.current=false;boot();}
      else beiRueckkehr();
    }
    document.addEventListener("visibilitychange",beiRueckkehr);
    window.addEventListener("pagehide",()=>{verstecktSeit.current=Date.now();});
    window.addEventListener("pageshow",beiRueckkehr);
    window.addEventListener("online",beiOnline);
    return()=>{
      document.removeEventListener("visibilitychange",beiRueckkehr);
      window.removeEventListener("pageshow",beiRueckkehr);
      window.removeEventListener("online",beiOnline);
    };
  },[]);

  // Amtliche Feiertage/Ferien laden, sobald Jahr oder Bundesland wechseln
  const [kalTick,setKalTick]=useState(0);
  useEffect(()=>{
    if(!bundesland)return;
    let aktiv=true;
    (async()=>{
      let neu=false;
      for(const y of [year-1,year,year+1]){
        const ok=await ladeKalenderJahr(bundesland,y);
        neu=neu||ok;
      }
      if(aktiv&&neu)setKalTick(t=>t+1);
    })();
    return()=>{aktiv=false;};
  },[bundesland,year]);

  // Fehlerbild: alle 5 Sekunden selbst einen neuen Versuch starten,
  // damit sich die App nach einem Netzwechsel von allein wieder fängt
  const [wiederVersuch,setWiederVersuch]=useState(0);
  useEffect(()=>{
    if(!dbError)return;
    setWiederVersuch(0);
    const t=setInterval(()=>{
      setWiederVersuch(n=>n+1);
      bootRef.current=false;
      boot();
    },5000);
    return()=>clearInterval(t);
  },[dbError]);

  // Nach 8 Sekunden Ladezeit die Notausgänge einblenden
  const [langesLaden,setLangesLaden]=useState(false);
  useEffect(()=>{
    if(!loading){setLangesLaden(false);return;}
    const t=setTimeout(()=>setLangesLaden(true),8000);
    return()=>clearTimeout(t);
  },[loading]);

  // Wachhund: bleibt der Ladebildschirm länger als 20 Sekunden stehen, Fehlermeldung zeigen
  useEffect(()=>{
    if(!loading)return;
    const t=setTimeout(()=>{
      if(!ladeRef.current)return;
      bootRef.current=false;
      // Erst versuchen, mit einer frischen Verbindung neu zu starten
      if(neustartMitSchutz())return;
      setLoading(false);setDbError(true);
    },10000);
    return()=>clearTimeout(t);
  },[loading]);

  // Tageswechsel auch bei durchgehend geöffneter App erkennen (Prüfung jede Minute)
  useEffect(()=>{
    if(!session)return;
    const t=setInterval(()=>{
      if(!sessionAbgelaufen(sessionRef.current))return;
      // Nicht auf den Server warten: die Sitzung lokal löschen und neu starten.
      // Ein hängender Abmeldeaufruf hat die App sonst blockiert.
      try{sessionStorage.setItem("up_tageswechsel","1");}catch(e){}
      signOutHart();
      try{signOut();}catch(e){}
      window.location.reload();
    },60000);
    return()=>clearInterval(t);
  },[session]);

  async function loadAll(userId){
    setLoading(true);
    try{
      const[prof,profs]=await Promise.all([getProfile(userId),getAllProfiles()]);
      setProfile(prof);
      setProfiles(profs);
      await loadEntries(istLeitung(prof),userId);
      // Eigene Benachrichtigungen laden
      const notifs=await getMyNotifications(userId);
      setMyNotifications(notifs);
      profileLoadedRef.current=true;
    }catch(e){
      // JWT-Zeitfehler: Token neu holen und nochmal versuchen
      if(e.message?.includes("JWT")||e.message?.includes("future")||e.message?.includes("expired")){
        try{
          await supabase.auth.refreshSession();
          const[prof,profs]=await Promise.all([getProfile(userId),getAllProfiles()]);
          setProfile(prof);setProfiles(profs);
          await loadEntries(istLeitung(prof),userId);
        }catch(e2){notify(e2.message,"warn");}
      } else {
        notify(e.message,"warn");
      }
    }
    finally{setLoading(false);}
  }

  // Auto-Refresh: Einträge alle 30 Sekunden neu laden
  const prevPendingRef=useRef(0);
  useEffect(()=>{
    if(!session)return;
    const interval=setInterval(async()=>{
      try{
        // Laden ohne Spinner
        let newEntries=[];
        ladeUeAntraege();
        if(isLeitung){
          newEntries=await getAllEntries();
          setEntries(newEntries);
          // Neue ausstehende Einträge? → Benachrichtigung
          const newPending=newEntries.filter(e=>e.status==="pending").length;
          if(newPending>prevPendingRef.current&&prevPendingRef.current>=0){
            const diff=newPending-prevPendingRef.current;
            notify(`🔔 ${diff} neuer Urlaubsantrag eingegangen!`,"warn");
          }
          prevPendingRef.current=newPending;
        }else{
          // Trainer: eigene + bestätigte anderer
          const[mine,confirmed]=await Promise.all([
            getMyEntries(session.user.id),
            getConfirmedEntries()
          ]);
          // Prüfen ob eigene Einträge status-Änderung hatten
          const prevOwn=entries.filter(e=>e.user_id===session.user.id);
          mine.forEach(newE=>{
            const oldE=prevOwn.find(o=>o.id===newE.id);
            if(oldE&&oldE.status!==newE.status){
              if(newE.status==="confirmed")notify("✅ Dein Urlaubsantrag wurde bestätigt!","success");
              if(newE.status==="rejected")notify("❌ Dein Urlaubsantrag wurde abgelehnt.","warn");
            }
          });
          // Eigene Notifications neu laden
          const notifs=await getMyNotifications(session.user.id);
          setMyNotifications(notifs);
          const myIds=new Set(mine.map(e=>e.id));
          const others=confirmed.filter(e=>e.user_id!==session.user.id&&!myIds.has(e.id));
          const myProf=profiles.find(p=>p.id===session.user.id)||profile;
          setEntries([...mine.map(e=>({...e,profiles:myProf})),...others]);
        }
      }catch(e){}
    },30000);
    return()=>clearInterval(interval);
  },[session,isLeitung,profile]);

  async function loadEntries(isAdm,userId){
    try{
      if(isAdm){
        const all=await getAllEntries();
        setEntries(all);
      }else{
        const[mine,confirmed]=await Promise.all([getMyEntries(userId),getConfirmedEntries()]);
        const myIds=new Set(mine.map(e=>e.id));
        const others=confirmed.filter(e=>e.user_id!==userId&&!myIds.has(e.id));
        const myProf=profiles.find(p=>p.id===userId)||await getProfile(userId);
        const mineRich=mine.map(e=>({...e,profiles:myProf}));
        setEntries([...mineRich,...others]);
      }
    }catch(e){
      // JWT-Fehler still ignorieren — loadAll kümmert sich ums Retry
      if(!e.message?.includes("JWT")&&!e.message?.includes("future")){
        notify(e.message,"warn");
      }
    }
  }

  function notify(msg,type="success"){setNotif({msg,type});setTimeout(()=>setNotif(null),5000);}

  // ── Auth ──────────────────────────────────────────────────────────
  async function handleLogin(email,password){
    setLoading(true);
    setDbError(false);
    try{
      const data=await signIn(email,password);
      // Direkt Session + Profil laden — nicht auf onAuthStateChange warten
      const userId=data?.user?.id||(await getSession())?.user?.id;
      if(userId){
        setSession(data?.session||await getSession());
        await loadAll(userId);
      }else{
        setLoading(false);
        throw new Error("Anmeldung fehlgeschlagen — keine Sitzung erhalten.");
      }
    }catch(e){
      setLoading(false);
      throw e;
    }
  }
  async function handleLogout(){
    await signOut();
    setView("kalender");
  }

  // ── Profile CRUD ──────────────────────────────────────────────────
  // Felder, über deren Änderung der Mitarbeiter informiert wird
  const MELDEFELDER={
    urlaubstage:"Urlaubstage pro Jahr",
    ueberstunden:"Überstunden",
    resturlaub:"Resturlaub aus dem Vorjahr",
    wochenstunden:"Wochenarbeitszeit",
    arbeitstage_woche:"Arbeitstage pro Woche",
    position:"Position",
    role:"Berechtigung",
  };
  // Überstundenanträge laden (RLS liefert nur Eigene bzw. die geführten Mitarbeiter)
  const prevUeRef=useRef(-1);
  const ueFehlerGemeldet=useRef(false);
  async function ladeUeAntraege(){
    try{
      const liste=await getUeberstundenAntraege();
      setUeAntraege(liste);
      // Neue offene Anträge fremder Mitarbeiter? → Hinweis für die Leitung
      const offen=liste.filter(a=>a.status==="pending"&&a.user_id!==session?.user?.id).length;
      if(prevUeRef.current>=0&&offen>prevUeRef.current){
        notify(`🔔 ${offen-prevUeRef.current} neuer Überstundenantrag eingegangen!`,"warn");
      }
      prevUeRef.current=offen;
    }catch(e){
      // Fehler nicht mehr verschlucken — sonst bleibt die Liste unerklärt leer
      if(!ueFehlerGemeldet.current){
        ueFehlerGemeldet.current=true;
        notify("Überstundenanträge konnten nicht geladen werden: "+e.message,"warn");
      }
    }
  }
  async function ladeJahreskonten(){
    try{setJahreskonten(await getJahreskonten());}catch(e){/* Tabelle evtl. noch nicht angelegt */}
  }
  useEffect(()=>{if(session&&profile){ladeUeAntraege();ladeJahreskonten();}},[session,profile]);

  async function handleUeAntrag(stunden,grund){
    try{
      await createUeberstundenAntrag(session.user.id,stunden,grund);
      await ladeUeAntraege();
      notify("Überstundenantrag eingereicht – die Leitung entscheidet.");
    }catch(e){notify("Antrag fehlgeschlagen: "+e.message,"warn");}
  }
  async function handleUeEntscheiden(id,status,hinweis){
    try{
      const erg=await decideUeberstundenAntrag(id,status,hinweis);
      await ladeUeAntraege();
      const profs=await getAllProfiles();
      setProfiles(profs);
      const eigen=profs.find(p=>p.id===session.user.id);
      if(eigen)setProfile(eigen);
      setDashRefresh(x=>x+1);       // Dashboard-Karten neu berechnen
      if(status==="confirmed"){
        const neu=erg&&erg.ueberstunden_neu!==undefined?erg.ueberstunden_neu:null;
        notify(neu!==null
          ? "Überstunden übernommen – Konto steht jetzt auf "+fmtT(neu)+" Tagen."
          : "Überstunden übernommen.");
      }else{
        notify("Antrag abgelehnt.");
      }
    }catch(e){
      // Fehler deutlich und dauerhaft anzeigen, nicht nur kurz einblenden
      window.alert("Der Antrag konnte nicht verbucht werden:\n\n"+e.message);
      notify("Nicht verbucht: "+e.message,"warn");
    }
  }
  async function handleUeZuruecknehmen(id){
    try{
      await deleteUeberstundenAntrag(id);
      await ladeUeAntraege();
      notify("Antrag zurückgezogen.");
    }catch(e){notify("Fehlgeschlagen: "+e.message,"warn");}
  }

  async function handleUpdateProfile(id,data,jahr){
    const vorher=profiles.find(x=>x.id===id)||null;
    // Urlaubsanspruch und Resturlaub gehören ins Jahreskonto, nicht ins Profil
    if(jahr&&!data.pauschal&&(data.urlaubstage!==undefined||data.resturlaub!==undefined)){
      try{
        await setJahreskonto(id,jahr,Number(data.urlaubstage)||0,Number(data.resturlaub)||0);
        await ladeJahreskonten();
      }catch(e){notify("Jahreskonto nicht gespeichert: "+e.message,"warn");}
    }
    const p=await updateProfile(id,data);
    setProfiles(prev=>prev.map(x=>x.id===id?p:x));
    if(id===profile?.id)setProfile(p);

    // Hat eine Leitung fremde Stammdaten geändert? Dann den Mitarbeiter informieren.
    if(vorher&&id!==profile?.id){
      const geaendert=Object.keys(MELDEFELDER)
        .filter(f=>f in data&&String(vorher[f]??"")!==String(p[f]??""))
        .map(f=>{
          const alt=f==="position"?posLabel(vorher[f],p.geschlecht)
                   :f==="role"?rolleLabel(vorher[f]):String(vorher[f]??"—");
          const neu=f==="position"?posLabel(p[f],p.geschlecht)
                   :f==="role"?rolleLabel(p[f]):String(p[f]??"—");
          return MELDEFELDER[f]+": "+alt+" → "+neu;
        });
      if(geaendert.length>0){
        const wer=[profile?.vorname,profile?.nachname].filter(Boolean).join(" ")||"Die Leitung";
        try{
          await createNotification(id,
            wer+" hat deine Stammdaten geändert — "+geaendert.join(" · "),"info");
        }catch(e){/* Benachrichtigung ist kein Grund, das Speichern scheitern zu lassen */}
      }
    }
    notify("Gespeichert.");
  }
  async function handleCreateUser(data){
    await createUser(data);
    const profs=await getAllProfiles();
    setProfiles(profs);
    notify("Mitarbeiter angelegt. Er kann sich nun anmelden.");
  }
  async function handleDeleteUser(id){
    try{
      await deleteUser(id);
      setProfiles(prev=>prev.filter(p=>p.id!==id));
      setEntries(prev=>prev.filter(e=>e.user_id!==id));
      notify("Mitarbeiter vollständig gelöscht (Zugang, Profil und Einträge).");
    }catch(e){
      notify("Löschen fehlgeschlagen: "+e.message,"warn");
    }
  }

  // ── Entries CRUD ──────────────────────────────────────────────────
  async function handleCreateEntry(data){
    const{user_id,type,von,bis,note}=data;
    // Doppelbuchung verhindern (zweite Sicherung, falls der Dialog umgangen wurde)
    const schonVorhanden=entries.filter(e=>
      e.user_id===user_id&&e.status!=="rejected"&&von<=e.bis&&bis>=e.von);
    if(schonVorhanden.length>0){
      notify("Für diesen Zeitraum besteht bereits ein Eintrag. Es wurde nichts gespeichert.","warn");
      return;
    }
    const zielProfil=profiles.find(p=>p.id===user_id)||null;
    // Wer den Zielmitarbeiter führen darf, trägt direkt bestätigt ein (eigener Urlaub nicht)
    const sofortBestaetigt=isAdmin||(user_id!==profile?.id&&canManage(profile,zielProfil));
    // Konfliktcheck (Mitarbeiter)
    if(!sofortBestaetigt){
      // Nur Überschneidungen im eigenen Fachbereich sind relevant
      const zb=posInfo(zielProfil?.position).bereich;
      const conflicts=(await checkConflicts(user_id,von,bis)).filter(c=>bereichVon(c.user_id)===zb);
      if(conflicts.length>0){
        notify(`Im Bereich ${BEREICH_NAME[zb]||"deines Teams"} ist im gewählten Zeitraum bereits Urlaub eingetragen. Der Antrag wurde gestellt – die Leitung entscheidet.`,"warn");
      }
    }
    const e=await createEntry({user_id,type,von,bis,note});
    if(sofortBestaetigt){await setEntryStatus(e.id,"confirmed");}
    await loadEntries(isLeitung,session.user.id);
    notify(sofortBestaetigt?"Eintrag bestätigt gespeichert.":"Urlaubsantrag eingereicht – wartet auf Genehmigung.");
  }
  async function handleUpdateEntry(id,data){
    await updateEntry(id,data);
    await loadEntries(isLeitung,session.user.id);
    notify("Eintrag aktualisiert.");
  }
  async function handleSetStatus(id,status){
    if(status==="confirmed"){
      const entry=entries.find(e=>e.id===id);
      if(entry){
        const zb=bereichVon(entry.user_id);
        const conflicts=(await checkConflicts(entry.user_id,entry.von,entry.bis))
          .filter(c=>bereichVon(c.user_id)===zb);
        if(conflicts.length>0){
          const names=conflicts.map(c=>c.profiles?.vorname||"jemand").join(", ");
          if(!window.confirm(`Überschneidung im Bereich ${BEREICH_NAME[zb]||"–"} mit: ${names}.\n\nTrotzdem bestätigen?`))return;
        }
      }
      await setEntryStatus(id,status);
      // Mitarbeiter benachrichtigen
      const e=entries.find(x=>x.id===id);
      if(e)await createNotification(e.user_id,`Dein Urlaubsantrag (${fmtDE(e.von)} – ${fmtDE(e.bis)}) wurde bestätigt. ✅`,"confirmed",id);
    } else if(status==="rejected"){
      // Ablehnungsgrund abfragen
      const grund=window.prompt("Optional: Begründung für die Ablehnung (wird dem Mitarbeiter mitgeteilt):");
      if(grund===null)return; // Abbrechen
      await setEntryStatus(id,status);
      const e=entries.find(x=>x.id===id);
      if(e){
        const msg=grund?.trim()
          ?`Dein Urlaubsantrag (${fmtDE(e.von)} – ${fmtDE(e.bis)}) wurde abgelehnt. Begründung: ${grund}`
          :`Dein Urlaubsantrag (${fmtDE(e.von)} – ${fmtDE(e.bis)}) wurde leider abgelehnt.`;
        await createNotification(e.user_id,msg,"rejected",id);
      }
    } else {
      await setEntryStatus(id,status);
    }
    await loadEntries(isLeitung,session.user.id);
    notify(status==="confirmed"?"✅ Eintrag bestätigt!":"❌ Eintrag abgelehnt.","success");
  }
  async function handleDeleteEntry(id, adminNote=""){
    const e=entries.find(x=>x.id===id);
    await deleteEntry(id);
    // Mitarbeiter benachrichtigen wenn Admin einen fremden Eintrag löscht
    if(e&&isLeitung&&e.user_id!==session.user.id){
      const msg=adminNote?.trim()
        ?`Dein Urlaubseintrag (${fmtDE(e.von)} – ${fmtDE(e.bis)}) wurde vom Admin gelöscht. Hinweis: ${adminNote}`
        :`Dein Urlaubseintrag (${fmtDE(e.von)} – ${fmtDE(e.bis)}) wurde vom Admin gelöscht.`;
      await createNotification(e.user_id,msg,"rejected");
    }
    await loadEntries(isLeitung,session.user.id);
    notify("Eintrag gelöscht.");
  }
  async function handleAdminResetPw(userId,newPw){
    const{error}=await supabase.rpc("admin_reset_password",{target_user_id:userId,new_password:newPw});
    if(error)throw new Error("Passwort konnte nicht zurückgesetzt werden: "+error.message);
  }
  async function handleChangePw(currentPw,newPw){
    // Supabase: zuerst neu-anmelden zum Verifizieren, dann updaten
    const{error:loginErr}=await supabase.auth.signInWithPassword({email:profile.email,password:currentPw});
    if(loginErr)throw new Error("Aktuelles Passwort falsch.");
    const{error}=await supabase.auth.updateUser({password:newPw});
    if(error)throw new Error(error.message);
  }

  function handlePrint(mode){
    if(mode==="kalender"){
      // Kalender: in neuem Fenster drucken für garantiertes Querformat
      setPrintMode("kalender_window");
      return;
    }
    setPrintMode(mode);
    setTimeout(()=>{
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          window.print();
          setTimeout(()=>setPrintMode(null),1000);
        });
      });
    },400);
  }

  // Kalender: bestätigte + eigene pending
  // Gehört diese Person zum aktuell gewählten Bereichsfilter?
  function imKalenderFilter(u){
    if(!u)return false;
    if(!darfBereichFiltern||kalBereich==="alle")return true;
    if(kalBereich==="leitung")return posInfo(u.position).scope==="alle";
    return posInfo(u.position).bereich===kalBereich;
  }
  function calEntries(){
    const sichtbar=entries.filter(e=>{
      if(e.user_id===session?.user.id)return true;              // eigene immer
      if(e.status!=="confirmed")return false;                    // fremde nur bestätigt
      return canManage(profile,profiles.find(p=>p.id===e.user_id)); // und nur wenn erlaubt
    });
    return sichtbar.filter(e=>imKalenderFilter(profiles.find(p=>p.id===e.user_id)));
  }
  // Profiles mit ihren Einträgen zusammenführen
  function profilesWithEntries(){
    // Urlaubsanspruch und Resturlaub aus dem Jahreskonto des angezeigten Jahres
    // überschreiben die alten Profilwerte — so rechnen alle Ansichten jahresgenau.
    return profiles.map(p=>{
      const k=kontoFuer(p,year);
      return{
        ...p,
        urlaubstage:istPauschal(p)?0:k.urlaubstage,
        resturlaub:istPauschal(p)?0:k.resturlaub,
        kontoEigen:k.eigen,
        entries:entries.filter(e=>e.user_id===p.id)
      };
    });
  }

  const stateName=BUNDESLAENDER.find(b=>b[0]===bundesland)?.[1]||"";
  const offeneUeAntraege=(ueAntraege||[]).filter(a=>
    a.status==="pending"&&darfEntscheiden(profile,profiles.find(p=>p.id===a.user_id)));
  const pendingCount=entries.filter(e=>e.status==="pending"&&darfEntscheiden(profile,profiles.find(p=>p.id===e.user_id))).length
    +offeneUeAntraege.length;

  if(dbError)return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
      <div style={{fontSize:44}}>⚠️</div>
      <div style={{color:"#f1f5f9",fontSize:17,fontWeight:700,textAlign:"center"}}>Datenbank nicht erreichbar</div>
      <div style={{color:"#94a3b8",fontSize:14,textAlign:"center",maxWidth:420,lineHeight:1.5}}>
        Die Verbindung ist unterbrochen. Das passiert meist kurz nach einem Wechsel zwischen WLAN und Mobilfunk.
      </div>
      <div style={{color:"#64748b",fontSize:13,textAlign:"center"}}>
        Es wird automatisch weiter versucht{wiederVersuch>0?" ("+wiederVersuch+". Versuch)":""}…
      </div>
      <button onClick={()=>{setDbError(false);setLoading(true);window.location.reload();}} style={{marginTop:8,background:"#5a8a1f",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:15,fontWeight:700,cursor:"pointer"}}>
        Jetzt neu verbinden
      </button>
    </div>
  );
  if(loading)return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:20,textAlign:"center"}}>
      <div style={{fontSize:40}}>📅</div>
      <div style={{color:"#64748b",fontSize:14}}>Verbindung wird hergestellt…</div>
      {/* Notausgänge erst anbieten, wenn es wirklich zu lange dauert */}
      {langesLaden&&(<>
        <button onClick={()=>{bootRef.current=false;setLoading(false);setDbError(false);setTimeout(()=>boot(),50);}}
          style={{marginTop:8,background:"none",border:"1px solid #334155",color:"#94a3b8",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>
          Neu verbinden
        </button>
        <button onClick={()=>{signOutHart();try{signOut();}catch(e){}window.location.reload();}}
          style={{background:"none",border:"none",color:"#475569",fontSize:12,cursor:"pointer",textDecoration:"underline",padding:8}}>
          Abmelden und neu starten
        </button>
      </>)}
    </div>
  );
  if(!session)return <LoginScreen onLogin={handleLogin}/>;

  // Session existiert aber Profil fehlt → Fehlermeldung statt Endlos-Schleife
  if(session&&!profile&&!loading){
    return (
      <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
        <div style={{fontSize:44}}>⚠️</div>
        <div style={{color:"#f1f5f9",fontSize:17,fontWeight:700,textAlign:"center"}}>Profil konnte nicht geladen werden</div>
        <div style={{color:"#94a3b8",fontSize:14,textAlign:"center",maxWidth:440,lineHeight:1.5}}>
          Die Anmeldung war erfolgreich, aber es konnte kein Benutzerprofil gefunden werden. Bitte wende dich an den Administrator.
        </div>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={async()=>{setLoading(true);const s=await getSession();if(s)await loadAll(s.user.id);else setLoading(false);}} style={{background:"#5a8a1f",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            Erneut versuchen
          </button>
          <button onClick={async()=>{await signOut();setSession(null);setProfile(null);profileLoadedRef.current=false;}} style={{background:"#334155",color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  // Einmalpasswort: Mitarbeiter muss neues Passwort setzen
  if(profile?.must_change_password){
    return <ForceChangePassword user={profile} onDone={async(newPw)=>{
      // WICHTIG: Reihenfolge — zuerst Flag in DB löschen, DANN Passwort ändern
      // (updateUser löst onAuthStateChange aus das das Profil neu lädt)
      try{
        // 1. Flag zuerst in der DB zurücksetzen
        await clearMustChangePassword(profile.id);
        // 2. Lokalen State sofort aktualisieren
        setProfile(p=>({...p,must_change_password:false}));
        // 3. Dann das Passwort ändern
        const{error}=await supabase.auth.updateUser({password:newPw});
        if(error){
          // Passwort-Änderung fehlgeschlagen → Flag wieder setzen wäre falsch,
          // da User schon durch ist. Nur Fehler zeigen.
          throw new Error(error.message);
        }
        notify("✅ Passwort erfolgreich geändert! Willkommen.");
      }catch(e){
        // Bei Fehler: Flag bleibt false (User kann normal weiterarbeiten)
        // aber Fehlermeldung zeigen
        throw e;
      }
    }}/>;
  }

  // Navigation mit Ungespeichert-Prüfung
  function handleNavClick(id){
    if(view==="profil"&&profileDirty&&id!=="profil"){
      setPendingView(id); // Dialog öffnen
    } else {
      setView(id);
    }
  }

  const navItems=isLeitung
    ?[["kalender","📅 Kalender"],["dashboard","📊 Dashboard"],["mitarbeiter","👥 Mitarbeiter"],["eintraege","📋 Einträge"],
      ...(isAdmin?[]:[["meinurlaub","🏖 Mein Urlaub"]]),
      ["feiertage","🗓 Ferien & Feiertage"],["profil","👤 Profil"]]
    :[["kalender","📅 Kalender"],["dashboard","📊 Dashboard"],["meinurlaub","🏖 Mein Urlaub"],["feiertage","🗓 Ferien & Feiertage"],["profil","👤 Profil"]];

  const pwu=profilesWithEntries();
  // Mitarbeiter, die die angemeldete Person führen darf (inkl. sich selbst)
  const meineLeute=pwu.filter(u=>canManage(profile,u));
  // Urlaubsanspruch einer Person für ein bestimmtes Jahr
  function kontoFuer(u,jahr){
    if(!u)return{urlaubstage:0,resturlaub:0,eigen:false};
    if(istPauschal(u))return{urlaubstage:0,resturlaub:0,eigen:true};
    const k=jahreskonten.find(x=>x.user_id===u.id&&Number(x.jahr)===Number(jahr));
    if(k)return{urlaubstage:Number(k.urlaubstage)||0,resturlaub:Number(k.resturlaub)||0,eigen:true};
    // Rückfall auf die alten Profilwerte, solange kein Jahreskonto besteht
    return{urlaubstage:Number(u.urlaubstage)||0,resturlaub:Number(u.resturlaub)||0,eigen:false};
  }
  // Verbrauch und Planungsstand einer Person in einem Jahr
  function planungFuer(u,jahr){
    const k=kontoFuer(u,jahr);
    const js=String(jahr);
    const ej=(u?.entries||[]).filter(e=>(e.von?.startsWith(js)||e.bis?.startsWith(js))&&e.status!=="rejected");
    const genutztUrlaub=eDays(ej,"urlaub",u), genutztRest=eDays(ej,"resturlaub",u);
    const anspruch=k.urlaubstage+k.resturlaub;
    const verplant=genutztUrlaub+genutztRest;
    return{...k,anspruch,verplant,genutztUrlaub,genutztRest,
           genutztUeber:eDays(ej,"ueberstunden",u),
           anteil:anspruch>0?verplant/anspruch:1};
  }

  // Fachbereich einer Person — Grundlage für Überschneidungen
  const bereichVon=id=>posInfo(profiles.find(p=>p.id===id)?.position).bereich;

  return(
    <div style={S.app}>
      {/* HEADER */}
      <header style={S.header}>
        <div style={S.hL}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TZ Westlausitz" style={{height:44,width:"auto",filter:"brightness(0) invert(1)"}}/>
            <div style={{borderLeft:"1px solid rgba(255,255,255,0.3)",paddingLeft:12}}>
              <div style={S.logoSub}>Urlaubsplaner</div>
            </div>
          </div>
          <div style={S.yearCtrl}>
            <button style={S.yBtn} onClick={()=>setYear(y=>y-1)}>‹</button>
            <span style={S.yLbl}>{year}</span>
            <button style={S.yBtn} onClick={()=>setYear(y=>y+1)}>›</button>
          </div>
          <select value={bundesland} onChange={e=>setBundesland(e.target.value)} style={S.blSel}>
            {BUNDESLAENDER.filter(b=>b[0]).map(([c,n])=><option key={c} value={c}>{n}</option>)}
          </select>
        </div>
        <div style={S.hR}>
          <div style={S.uBadge}>
            <div style={{...S.av,background:profile?.color||"#2563EB"}}>{profile?.vorname?.[0]||"?"}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#f1f5f9"}}>{profile?.vorname} {profile?.nachname}</div>
              <div style={{fontSize:10,color:isAdmin?"#fbbf24":"#64748b"}}>{posLabel(profile?.position,profile?.geschlecht)}{isAdmin?" · Administrator":""}</div>
            </div>
          </div>
          <button style={S.pBtn} onClick={()=>handlePrint("kalender")} title="Kalender">🖨</button>
          <button style={{...S.pBtn,background:"#1e3a5f"}} onClick={()=>handlePrint("liste")} title="Liste">📋</button>
          <button style={{...S.pBtn,background:"#7f1d1d",color:"#fca5a5"}} onClick={handleLogout}>Abmelden</button>
        </div>
      </header>

      {/* NAV */}
      <nav style={S.nav}>
        {navItems.map(([id,lbl])=>(
          <button key={id} style={{...S.navBtn,...(view===id?S.navAct:{})}} onClick={()=>handleNavClick(id)}>{lbl}</button>
        ))}
        {isLeitung&&pendingCount>0&&<button onClick={()=>{
          const firstPending=entries.filter(e=>e.status==="pending")
            .sort((a,b)=>a.von.localeCompare(b.von))[0];
          if(firstPending?.von){
            const py=parseInt(firstPending.von.substring(0,4));
            setYear(py);
            setPendingJumpYear(py);
          }
          setView("eintraege");
        }} style={{...S.pendBadge,cursor:"pointer",border:"none"}}>{pendingCount} ausstehend ▶</button>}
        <div style={{...S.legend,...(schmal?{marginLeft:0,alignItems:"stretch",width:"100%",gap:4}:{})}}>
          {/* Zeile 1: Mitarbeiterfarben */}
          <div style={{...S.legRow,...(schmal?{flexWrap:"nowrap",overflowX:"auto",justifyContent:"flex-start",gap:10,paddingBottom:2}:{})}}>
            {pwu.filter(u=>canManage(profile,u)&&imKalenderFilter(u)
                &&u.entries.some(e=>e.status==="confirmed"
                  &&(e.von?.startsWith(String(year))||e.bis?.startsWith(String(year))))).map(u=>(
              <div key={u.id} style={S.legItem}><div style={{...S.legDot,background:u.color}}/><span>{u.vorname}</span></div>
            ))}
          </div>
          {/* Zeile 2: Bereichsfilter — nur für Geschäfts-/Praxisleitung und Administratoren */}
          {darfBereichFiltern&&view==="kalender"&&(schmal?(
            /* Handy: platzsparendes Auswahlmenü */
            <select value={kalBereich} onChange={e=>setKalBereich(e.target.value)}
              style={{background:kalBereich==="alle"?"#f8faf0":"#e8f3d6",border:"1.5px solid "+(kalBereich==="alle"?"#c8d890":"#7ab529"),
                borderRadius:14,padding:"5px 10px",fontSize:12,fontWeight:700,
                color:"#4a6b0f",maxWidth:"100%",outline:"none"}}>
              {[["alle","👥 Alle"],["leitung","🔑 Leitung"],["physio","Physiotherapie"],["ergo","Ergotherapie"],["logo","Logopädie"],["podo","Podologie"],["trainer","Trainer"],["rezeption","Rezeption"]].map(([k,lbl])=>(
                <option key={k} value={k}>{k==="alle"?"Alle Bereiche":lbl.replace(/^[^ ]+ /,"")}</option>
              ))}
            </select>
          ):(
            <div style={S.legRow}>
              {[["alle","👥 Alle"],["leitung","🔑 Leitung"],["physio","Physiotherapie"],["ergo","Ergotherapie"],["logo","Logopädie"],["podo","Podologie"],["trainer","Trainer"],["rezeption","Rezeption"]].map(([k,lbl])=>(
                <button key={k} onClick={()=>setKalBereich(k)} title={"Nur "+lbl+" anzeigen"} style={{
                  background:kalBereich===k?"#e8f3d6":"none",cursor:"pointer",
                  border:"1px solid "+(kalBereich===k?"#7ab529":"#cbd5e1"),
                  borderRadius:14,padding:"3px 9px",transition:"all .15s",
                  opacity:kalBereich===k?1:0.55,
                  fontSize:11,fontWeight:600,color:kalBereich===k?"#4a6b0f":"#94a3b8",whiteSpace:"nowrap",
                }}>{lbl}</button>
              ))}
            </div>
          ))}
          {/* Zeile 3: Ferien- und Feiertagsanzeige */}
          <div style={{...S.legRow,...(schmal?{justifyContent:"flex-start"}:{})}}>
          {/* Ferien Toggle — klickbar */}
          <button onClick={()=>setShowFerien(v=>!v)} style={{
            display:"flex",alignItems:"center",gap:5,background:"none",cursor:"pointer",
            border:"1px solid "+(showFerien?"#f9a8d4":"#cbd5e1"),
            borderRadius:14,padding:"3px 9px",transition:"all .15s",
            opacity:showFerien?1:0.45,
          }} title={showFerien?"Ferien ausblenden":"Ferien einblenden"}>
            <div style={{...S.legDot,background:showFerien?"#fce7f3":"#e2e8f0",border:"1px solid "+(showFerien?"#f9a8d4":"#cbd5e1")}}/>
            <span style={{fontSize:11,color:showFerien?"#9d174d":"#94a3b8",fontWeight:600}}>
              {showFerien?"🌸 Ferien":"— Ferien"}
            </span>
          </button>
          {/* Feiertage Toggle — klickbar */}
          <button onClick={()=>setShowFeiertage(v=>!v)} style={{
            display:"flex",alignItems:"center",gap:5,background:"none",cursor:"pointer",
            border:"1px solid "+(showFeiertage?"#c9a07a":"#cbd5e1"),
            borderRadius:14,padding:"3px 9px",transition:"all .15s",
            opacity:showFeiertage?1:0.45,
          }} title={showFeiertage?"Feiertage ausblenden":"Feiertage einblenden"}>
            <div style={{...S.legDot,background:showFeiertage?"#d4b896":"#e2e8f0",border:"1px solid "+(showFeiertage?"#c9a07a":"#cbd5e1")}}/>
            <span style={{fontSize:11,color:showFeiertage?"#5c3d1a":"#94a3b8",fontWeight:600}}>
              {showFeiertage?"🎉 Feiertag":"— Feiertag"}
            </span>
          </button>
          </div>
        </div>
      </nav>

      {/* Mitarbeiter-Benachrichtigungen (persistent) */}
      {myNotifications.length>0&&(
        <div style={{background:"#f0fdf4",borderLeft:"4px solid #22c55e",padding:"10px 16px",display:"flex",flexDirection:"column",gap:6}}>
          {myNotifications.map(n=>(
            <div key={n.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <div>
                <span style={{fontSize:13,color:"#15803d",fontWeight:600}}>{n.type==="confirmed"?"✅":n.type==="rejected"?"❌":n.type==="change_request"?"🔄":"ℹ️"} {n.message}</span>
                <span style={{fontSize:11,color:"#86efac",marginLeft:8}}>{new Date(n.created_at).toLocaleDateString("de-DE")}</span>
              </div>
              <button onClick={async()=>{await markNotificationRead(n.id);setMyNotifications(p=>p.filter(x=>x.id!==n.id));}} style={{background:"none",border:"1px solid #86efac",color:"#15803d",borderRadius:6,padding:"2px 8px",fontSize:11,cursor:"pointer",flexShrink:0}}>
                ✓ Gelesen
              </button>
            </div>
          ))}
        </div>
      )}

      {/* NOTIFICATION — JWT-Fehler werden unterdrückt */}
      {notif&&!notif.msg?.includes("JWT")&&!notif.msg?.includes("future")&&(
        <div style={{...S.notif,background:notif.type==="warn"?"#fff7ed":"#f7fce8",borderColor:notif.type==="warn"?"#f0932b":"#7ab529",color:notif.type==="warn"?"#9a3412":"#4a6b0f"}}>
          {notif.type==="warn"?"⚠️":"✅"} {notif.msg}
        </div>
      )}

      {/* Hinweis auf Neuerungen nach einem Update */}
      {profile&&!neuerungenZu&&neueEintraege(profile.changelog_version).length>0&&(
        <NeuerungenModal
          eintraege={neueEintraege(profile.changelog_version)}
          onGelesen={async()=>{
            try{
              const p=await updateProfile(profile.id,{changelog_version:AKTUELLE_VERSION});
              setProfile(p);
              setProfiles(prev=>prev.map(x=>x.id===p.id?{...x,...p}:x));
            }catch(e){notify("Hinweis konnte nicht gespeichert werden: "+e.message,"warn");}
            setNeuerungenZu(true);
          }}
          onSpaeter={()=>setNeuerungenZu(true)}/>
      )}

      {/* MAIN */}
      <main style={S.main} onClick={()=>setTooltip(null)}>
        {/* Abgabefrist für die Jahresplanung */}
        <FristBanner planJahr={planJahr} tick={fristTick}
          eigene={profile&&!istPauschal(profile)?planungFuer(pwu.find(u=>u.id===session.user.id)||profile,planJahr):null}
          offeneLeute={isLeitung?meineLeute.filter(u=>!istPauschal(u)&&planungFuer(u,planJahr).anteil<MINDEST_ANTEIL):[]}
          istLeitung={isLeitung} darfBereichFiltern={darfBereichFiltern}
          onPlanen={()=>{if(year!==planJahr)setYear(planJahr);setView(isAdmin?"eintraege":"meinurlaub");}}/>
        {view==="kalender"&&<KalView key={"kal"+kalTick} year={year} entries={calEntries()} profiles={profiles} bl={bundesland} showFerien={showFerien} showFeiertage={showFeiertage} onTip={setTooltip} offTip={()=>setTooltip(null)}/>}
        {view==="dashboard"&&<DashView users={isLeitung?meineLeute:(pwu.find(u=>u.id===session.user.id)?pwu.filter(u=>u.id===session.user.id):(profile?[{...profile,entries:entries.filter(e=>e.user_id===session.user.id)}]:[]))} isAdmin={isLeitung} viewer={profile} year={year} refreshKey={dashRefresh} onEdit={u=>setModal({type:"editUser",data:u})} onResetPwForUser={(d)=>setModal({type:"resetPw",data:d})}/>}
        {view==="mitarbeiter"&&isLeitung&&<MitView users={meineLeute} viewer={profile} canDelete={isAdmin} onAdd={()=>setModal({type:"addUser"})} onEdit={u=>setModal({type:"editUser",data:u})} onDelete={async id=>{const u=profiles.find(p=>p.id===id);const nm=u?[u.vorname,u.nachname].filter(Boolean).join(" "):"Dieser Mitarbeiter";if(window.confirm(nm+" wird endgültig gelöscht:\n\n• Zugang (Anmeldung)\n• Profil\n• alle Urlaubseinträge\n\nDas kann nicht rückgängig gemacht werden. Fortfahren?"))await handleDeleteUser(id);}}/>}
        {view==="eintraege"&&isLeitung&&<EintAdmin viewer={profile} darfBereichFiltern={darfBereichFiltern} ueAntraege={ueAntraege.filter(a=>a.user_id!==profile?.id||isAdmin||posInfo(profile?.position).scope==="alle")} onUeEntscheiden={handleUeEntscheiden} entries={entries.filter(e=>canManage(profile,profiles.find(p=>p.id===e.user_id)))} profiles={profiles} year={pendingJumpYear||year} onStatus={handleSetStatus} onDelete={async(id,note)=>{if(window.confirm("Eintrag wirklich löschen?"))await handleDeleteEntry(id,note);}} onAdd={uid=>setModal({type:"addEntry",data:{userId:uid}})} onEdit={(uid,e)=>setModal({type:"editEntry",data:{userId:uid,entry:e}})}/>}
        {view==="meinurlaub"&&!isAdmin&&<MeinUrlaub user={pwu.find(u=>u.id===session.user.id)||profile} year={year} ueAntraege={ueAntraege} onUeAntrag={handleUeAntrag} onUeZurueck={handleUeZuruecknehmen} onAdd={()=>setModal({type:"addEntry",data:{userId:session.user.id}})} onEdit={e=>setModal({type:"editEntry",data:{userId:session.user.id,entry:e}})} onDelete={async(id,note)=>{if(window.confirm("Antrag löschen?"))await handleDeleteEntry(id,note);}} onRequestChange={e=>setModal({type:"changeRequest",data:{entry:e}})} onRequestDelete={e=>setModal({type:"deleteRequest",data:{entry:e}})}/>}
        {view==="feiertage"&&<FerView key={"fer"+kalTick} year={year} state={bundesland} stateName={stateName}/>}
        {view==="profil"&&<ProfView user={pwu.find(u=>u.id===session?.user.id)||profile} onSave={async(id,d)=>{await handleUpdateProfile(id,d);setProfileDirty(false);}} onChangePw={handleChangePw} onDirtyChange={setProfileDirty}/>}
      </main>

      {/* TOOLTIP */}
      {tooltip&&(
        <div style={{position:"fixed",left:Math.min(tooltip.x+14,window.innerWidth-250),top:Math.max(tooltip.y-8,60),background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"10px 14px",zIndex:3000,boxShadow:"0 12px 32px rgba(0,0,0,0.5)",pointerEvents:"none",maxWidth:250}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6}}>{tooltip.date}</div>
          {tooltip.lines.map((l,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><div style={{width:8,height:8,borderRadius:"50%",background:l.color,flexShrink:0}}/><span style={{fontSize:12,color:"#f1f5f9"}}>{l.text}</span></div>)}
        </div>
      )}

      {/* Dialog: Ungespeicherte Profiländerungen */}
      {pendingView&&(
        <div style={{position:"fixed",inset:0,background:"rgba(45,58,46,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:380,maxWidth:"90vw",border:"1px solid #d5e8a0",boxShadow:"0 20px 60px rgba(61,122,79,0.18)",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>💾</div>
            <div style={{fontSize:17,fontWeight:800,color:"#2d3a2e",marginBottom:8,fontFamily:"'Nunito',sans-serif"}}>Ungespeicherte Änderungen</div>
            <div style={{fontSize:14,color:"#5a6b4a",marginBottom:24,lineHeight:1.6}}>Du hast Änderungen in deinem Profil vorgenommen. Möchtest du diese speichern oder verwerfen?</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button style={{...S.savBtn,minWidth:120}} onClick={async()=>{
                // Speichern dann wechseln - ProfView muss save triggern
                // Wir setzen pendingView und schicken ein Custom-Event
                window.dispatchEvent(new CustomEvent("profil-save-and-leave",{detail:{target:pendingView}}));
                setPendingView(null);
              }}>💾 Speichern</button>
              <button style={{background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",minWidth:120}} onClick={()=>{
                setProfileDirty(false);
                setView(pendingView);
                setPendingView(null);
              }}>🗑 Verwerfen</button>
              <button style={{...S.canBtn,minWidth:120}} onClick={()=>setPendingView(null)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal?.type==="resetPw"&&<ResetPwModal
        user={modal.data.user}
        requestId={modal.data.requestId}
        onDone={async(reqId)=>{if(reqId){try{await dismissResetRequest(reqId);}catch(e){}}setDashRefresh(k=>k+1);notify("✅ Passwort zurückgesetzt! Nachricht kopiert.");}}
        onClose={()=>setModal(null)}
      />}
      {modal?.type==="addUser"&&<UserModal title="Neuer Mitarbeiter" isAdmin onSave={async d=>{await handleCreateUser(d);setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.type==="editUser"&&<UserModal title="Mitarbeiter bearbeiten" jahrHinweis={year}
        initial={{...modal.data,...(istPauschal(modal.data)?{}:{urlaubstage:kontoFuer(modal.data,year).urlaubstage,resturlaub:kontoFuer(modal.data,year).resturlaub})}}
        isAdmin usedColors={profiles.filter(p=>p.id!==modal.data?.id).map(p=>p.color).filter(Boolean)}
        onSave={async d=>{await handleUpdateProfile(modal.data.id,{...d,id:modal.data.id},year);setModal(null);}}
        onClose={()=>setModal(null)} onResetPw={handleAdminResetPw}/>}
      {/* Änderungsantrag für bestätigte Einträge */}
      {modal?.type==="changeRequest"&&(
        <ChangeRequestModal
          entry={modal.data.entry}
          year={year}
          onSave={async(newVon,newBis,grund)=>{
            // Bestehenden Eintrag auf "pending" zurücksetzen mit neuem Zeitraum
            await updateEntry(modal.data.entry.id,{von:newVon,bis:newBis,status:"pending",note:`Änderungsantrag: ${grund||"Neuer Zeitraum gewünscht"}`});
            // Admin benachrichtigen (via pending-count)
            await loadEntries(false,session.user.id);
            setModal(null);
            notify("Änderungsantrag gestellt — wartet auf Genehmigung.");
          }}
          onClose={()=>setModal(null)}
        />
      )}
      {/* Stornierungsantrag */}
      {modal?.type==="deleteRequest"&&(
        <DeleteRequestModal
          entry={modal.data.entry}
          onSave={async(grund)=>{
            // Status auf "pending" + Notiz für Stornierung
            await updateEntry(modal.data.entry.id,{status:"pending",note:`Stornierungsantrag: ${grund||"Stornierung gewünscht"}`});
            await loadEntries(false,session.user.id);
            setModal(null);
            notify("Stornierungsantrag gestellt — wartet auf Genehmigung.");
          }}
          onClose={()=>setModal(null)}
        />
      )}

      {modal?.type==="addEntry"&&<EntryModal title="Urlaubsantrag" year={year} isAdmin={isAdmin} allEntries={entries} currentUserId={session?.user.id}
        bereichVon={bereichVon} zielBereich={bereichVon(modal.data.userId)} zielUserId={modal.data.userId}
        zielUser={pwu.find(u=>u.id===modal.data.userId)}
        kontingent={(()=>{
          const u=pwu.find(x=>x.id===modal.data.userId);
          if(!u||istPauschal(u))return null;   // Pauschalkräfte haben kein Kontingent
          const pl=planungFuer(u,year);
          return{urlaubstage:pl.urlaubstage,resturlaub:pl.resturlaub,
                 ueberstunden:Number(u.ueberstunden)||0,stdProTag:stdProTag(u),
                 genutztUrlaub:pl.genutztUrlaub,genutztRest:pl.genutztRest,genutztUeber:pl.genutztUeber};
        })()}
        onSave={async pakete=>{
          for(const d of (Array.isArray(pakete)?pakete:[pakete])){
            await handleCreateEntry({...d,user_id:modal.data.userId});
          }
          setModal(null);
        }} onClose={()=>setModal(null)}/>}
      {modal?.type==="editEntry"&&<EntryModal title="Eintrag bearbeiten" year={year} isAdmin={isAdmin} initial={modal.data.entry} allEntries={entries} currentUserId={modal.data.entry?.user_id} bereichVon={bereichVon} zielBereich={bereichVon(modal.data.entry?.user_id)} zielUserId={modal.data.entry?.user_id} zielUser={pwu.find(u=>u.id===modal.data.entry?.user_id)} onSave={async d=>{await handleUpdateEntry(modal.data.entry.id,Array.isArray(d)?d[0]:d);setModal(null);}} onClose={()=>setModal(null)}/>}

      {/* PRINT */}
      {(printMode==="kalender"||printMode==="kalender_window")&&<PrintKal year={year} entries={calEntries().filter(e=>e.status==="confirmed")} profiles={profiles} state={bundesland} stateName={stateName} useNewWindow={printMode==="kalender_window"} onClose={()=>setPrintMode(null)}/>}
      {printMode==="liste"&&<PrintList year={year} users={meineLeute} stateName={stateName} onClose={()=>setPrintMode(null)}/>}
    </div>
  );
}


// ─── Erzwungener Passwort-Wechsel (Einmalpasswort) ───────────────────────────
function ForceChangePassword({user,onDone}){
  const[pw,setPw]=useState("");
  const[pw2,setPw2]=useState("");
  const[err,setErr]=useState("");
  const[busy,setBusy]=useState(false);
  const[showPw,setShowPw]=useState(false);

  // Passwort-Regeln prüfen
  const checks={
    len:pw.length>=8,
    upper:/[A-Z]/.test(pw),
    lower:/[a-z]/.test(pw),
    digit:/[0-9]/.test(pw),
  };
  const allOk=checks.len&&checks.upper&&checks.lower&&checks.digit;

  async function submit(){
    if(!checks.len){setErr("Das Passwort muss mindestens 8 Zeichen haben.");return;}
    if(!checks.upper){setErr("Das Passwort muss mindestens einen Großbuchstaben enthalten.");return;}
    if(!checks.lower){setErr("Das Passwort muss mindestens einen Kleinbuchstaben enthalten.");return;}
    if(!checks.digit){setErr("Das Passwort muss mindestens eine Zahl enthalten.");return;}
    if(pw!==pw2){setErr("Die Passwörter stimmen nicht überein.");return;}
    setBusy(true);setErr("");
    try{await onDone(pw);}
    catch(e){
      let msg=e.message||"Fehler beim Ändern des Passworts.";
      if(msg.includes("different from the old")){
        msg="Bitte wähle ein anderes Passwort als dein aktuelles Einmalpasswort.";
      }else if(msg.toLowerCase().includes("weak")||msg.includes("at least")){
        msg="Das Passwort ist zu schwach. Bitte erfülle alle Regeln unten.";
      }
      setErr(msg);setBusy(false);
    }
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5eb 0%,#f0f4f0 50%,#e0efe3 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#fff",borderRadius:16,padding:40,width:440,maxWidth:"90vw",border:"1px solid #d4e6d8",boxShadow:"0 20px 60px rgba(61,122,79,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:8}}>🔐</div>
          <div style={{fontSize:20,fontWeight:800,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>Neues Passwort festlegen</div>
          <div style={{fontSize:13,color:"#6b8f74",marginTop:8,lineHeight:1.5}}>
            Hallo {user?.vorname}, dein Passwort wurde zurückgesetzt. Bitte lege jetzt dein persönliches Passwort fest.
          </div>
        </div>
        <div style={{marginBottom:14,position:"relative"}}>
          <label style={S.lbl}>Neues Passwort</label>
          <input style={S.inp} type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Mindestens 6 Zeichen" autoFocus/>
          <button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:10,top:27,background:"none",border:"none",color:"#8aaa5f",cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.lbl}>Passwort bestätigen</label>
          <input style={S.inp} type={showPw?"text":"password"} value={pw2} onChange={e=>setPw2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&allOk&&submit()}/>
        </div>
        {/* Passwort-Regeln */}
        <div style={{background:"#f8faf0",border:"1px solid #d5e8a0",borderRadius:8,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#5a6b4a",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Passwort-Anforderungen</div>
          {[
            ["len","Mindestens 8 Zeichen"],
            ["upper","Mindestens ein Großbuchstabe (A-Z)"],
            ["lower","Mindestens ein Kleinbuchstabe (a-z)"],
            ["digit","Mindestens eine Zahl (0-9)"],
          ].map(([key,label])=>(
            <div key={key} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,marginBottom:4,color:checks[key]?"#15803d":"#94a3b8"}}>
              <span style={{fontSize:14}}>{checks[key]?"✅":"⬜"}</span>
              <span style={{textDecoration:checks[key]?"none":"none"}}>{label}</span>
            </div>
          ))}
          <div style={{fontSize:11,color:"#8aaa5f",marginTop:6,fontStyle:"italic"}}>Sonderzeichen (!,@,# …) sind erlaubt und erhöhen die Sicherheit.</div>
        </div>
        {err&&<div style={{fontSize:12,color:"#f87171",marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,0.1)",borderRadius:6}}>{err}</div>}
        <button style={{...S.savBtn,width:"100%",padding:"11px 0",fontSize:14,opacity:(busy||!allOk||pw!==pw2)?0.5:1,cursor:(busy||!allOk||pw!==pw2)?"not-allowed":"pointer"}} onClick={submit} disabled={busy||!allOk||pw!==pw2}>
          {busy?"Wird gespeichert…":"Passwort festlegen & fortfahren"}
        </button>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
// ─── Anmeldesperre nach Fehlversuchen (pro Gerät) ───────────────────────────
const SPERR_KEY="up_login_sperre";
const MAX_VERSUCHE=3, SPERRDAUER=30*60*1000;   // 30 Minuten
function ladeSperre(){
  try{return JSON.parse(localStorage.getItem(SPERR_KEY))||{n:0,bis:0};}
  catch(e){return{n:0,bis:0};}
}
function speichereSperre(v){try{localStorage.setItem(SPERR_KEY,JSON.stringify(v));}catch(e){}}
function loescheSperre(){try{localStorage.removeItem(SPERR_KEY);}catch(e){}}

function LoginScreen({onLogin}){
  // Wurde wegen Tageswechsel abgemeldet? Dann einmalig erklären, warum.
  const [tageswechsel]=useState(()=>{
    try{
      const v=sessionStorage.getItem("up_tageswechsel");
      if(v)sessionStorage.removeItem("up_tageswechsel");
      return !!v;
    }catch(e){return false;}
  });
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const [sperre,setSperre]=useState(ladeSperre());
  const [jetzt,setJetzt]=useState(Date.now());
  const gesperrt=sperre.bis>jetzt;
  const restMin=Math.max(1,Math.ceil((sperre.bis-jetzt)/60000));
  useEffect(()=>{const t=setInterval(()=>setJetzt(Date.now()),1000);return()=>clearInterval(t);},[]);
  const [forgotMode,setForgotMode]=useState(false);
  const [forgotEmail,setForgotEmail]=useState("");
  const [forgotSent,setForgotSent]=useState(false);

  async function submit(){
    if(gesperrt){setErr("Zu viele Fehlversuche. Bitte in "+restMin+" Minuten erneut versuchen.");return;}
    if(!email.trim()){setErr("Bitte E-Mail-Adresse eingeben.");return;}
    if(!email.includes("@")){setErr("Das ist keine gültige E-Mail-Adresse.");return;}
    if(!pw){setErr("Bitte Passwort eingeben.");return;}
    setBusy(true);setErr("");
    try{
      await onLogin(email.trim().toLowerCase(),pw);
      loescheSperre();setSperre({n:0,bis:0});
    }catch(e){
      const roh=(e.message||"").toLowerCase();
      let text;
      if(roh.includes("invalid login")||roh.includes("credentials"))
        text="E-Mail-Adresse oder Passwort ist falsch.";
      else if(roh.includes("email not confirmed"))
        text="Dieses Konto ist noch nicht freigeschaltet. Bitte an die Praxisleitung wenden.";
      else if(roh.includes("rate limit")||roh.includes("too many"))
        text="Zu viele Anmeldeversuche. Bitte einige Minuten warten.";
      else if(roh.includes("failed to fetch")||roh.includes("zeitüberschreitung")||roh.includes("network"))
        text="Keine Verbindung zum Server. Bitte Internetverbindung prüfen.";
      else text=e.message||"Anmeldung fehlgeschlagen.";

      const n=sperre.n+1;
      if(n>=MAX_VERSUCHE){
        const neu={n:0,bis:Date.now()+SPERRDAUER};
        speichereSperre(neu);setSperre(neu);
        setErr("Dreimal falsch angemeldet. Die Eingabe ist für 30 Minuten gesperrt.");
      }else{
        const neu={n,bis:0};
        speichereSperre(neu);setSperre(neu);
        setErr(text+" Noch "+(MAX_VERSUCHE-n)+" "+((MAX_VERSUCHE-n)===1?"Versuch":"Versuche")+".");
      }
    }finally{setBusy(false);}
  }

  async function sendForgotRequest(){
    if(!forgotEmail){setErr("Bitte E-Mail eingeben.");return;}
    setBusy(true);setErr("");
    try{
      await requestPasswordReset(forgotEmail);
      setForgotSent(true);
    }catch(e){setErr("Anfrage konnte nicht gesendet werden.");}
    finally{setBusy(false);}
  }

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5eb 0%,#f0f4f0 50%,#e0efe3 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,boxSizing:"border-box"}}>
      <div style={{background:"#ffffff",borderRadius:16,padding:"32px 24px",width:420,maxWidth:"calc(100vw - 32px)",boxSizing:"border-box",border:"1px solid #d5e8a0",boxShadow:"0 20px 60px rgba(61,122,79,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TZ Westlausitz" style={{maxWidth:"100%",width:"auto",height:"auto",maxHeight:80,display:"block",margin:"0 auto 8px"}}/>
          <div style={{fontSize:13,color:"#5a6b4a",marginTop:8,fontWeight:600,letterSpacing:"0.02em"}}>Urlaubsplaner</div>
          {tageswechsel&&(
            <div style={{fontSize:12,color:"#92400e",background:"#fff7ed",border:"1px solid #fcd9b0",
              borderRadius:8,padding:"8px 12px",marginTop:12,textAlign:"left"}}>
              Ein neuer Tag hat begonnen — aus Sicherheitsgründen ist eine erneute Anmeldung nötig.
            </div>
          )}
        </div>

        {!forgotMode?(
          <>
            <div style={{marginBottom:14}}><label style={S.lbl}>E-Mail</label><input style={S.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus placeholder="name@tz-westlausitz.de"/></div>
            <div style={{marginBottom:8,position:"relative"}}><label style={S.lbl}>Passwort</label><input style={S.inp} type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/><button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:10,top:27,background:"none",border:"none",color:"#64748b",cursor:"pointer"}}>{showPw?"🙈":"👁"}</button></div>
            <div style={{textAlign:"right",marginBottom:16}}>
              <button onClick={()=>{setForgotMode(true);setForgotEmail(email);setErr("");}} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Passwort vergessen?</button>
            </div>
            {err&&<div style={{fontSize:12,color:"#f87171",marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,0.1)",borderRadius:6,border:"1px solid rgba(248,113,113,0.2)"}}>{err}</div>}
            <button style={{...S.savBtn,width:"100%",padding:"11px 0",fontSize:14,opacity:(busy||gesperrt)?0.5:1,cursor:gesperrt?"not-allowed":"pointer"}} onClick={submit} disabled={busy||gesperrt}>{gesperrt?("Gesperrt – noch "+restMin+" Min."):(busy?"Anmelden…":"Anmelden")}</button>
          </>
        ):(
          <>
            {!forgotSent?(
              <>
                <div style={{fontSize:14,color:"#5a6b4a",marginBottom:16,lineHeight:1.5}}>
                  Gib deine E-Mail-Adresse ein. Der Administrator wird benachrichtigt und setzt dein Passwort zurück.
                </div>
                <div style={{marginBottom:14}}><label style={S.lbl}>E-Mail-Adresse</label><input style={S.inp} type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} autoFocus/></div>
                {err&&<div style={{fontSize:12,color:"#f87171",marginBottom:12,padding:"8px 12px",background:"rgba(248,113,113,0.1)",borderRadius:6}}>{err}</div>}
                <button style={{...S.savBtn,width:"100%",padding:"11px 0",fontSize:14,opacity:busy?0.6:1,marginBottom:10}} onClick={sendForgotRequest} disabled={busy}>{busy?"Senden…":"Anfrage senden"}</button>
                <button onClick={()=>{setForgotMode(false);setErr("");}} style={{width:"100%",background:"none",border:"none",color:"#64748b",fontSize:13,cursor:"pointer",padding:"8px 0"}}>← Zurück zum Login</button>
              </>
            ):(
              <>
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:40,marginBottom:12}}>✅</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#2d3a2e",marginBottom:8}}>Anfrage gesendet!</div>
                  <div style={{fontSize:13,color:"#5a6b4a",lineHeight:1.6}}>Der Administrator wurde benachrichtigt und wird dein Passwort in Kürze zurücksetzen.</div>
                </div>
                <button onClick={()=>{setForgotMode(false);setForgotSent(false);setErr("");}} style={{...S.savBtn,width:"100%",padding:"11px 0",fontSize:14,marginTop:16}}>← Zurück zum Login</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Kalender ─────────────────────────────────────────────────────────────────
function KalView({year,entries,profiles,bl,showFerien=true,showFeiertage=true,onTip,offTip}){
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>{MONTHS.map((_,m)=><MonthCard key={m} year={year} month={m} entries={entries} profiles={profiles} bl={bl} showFerien={showFerien} showFeiertage={showFeiertage} onTip={onTip} offTip={offTip}/>)}</div>);
}
function MonthCard({year,month,entries,profiles,bl,showFerien=true,showFeiertage=true,onTip,offTip}){
  const d=dimM(year,month),f=fwdM(year,month);
  const cells=[];for(let i=0;i<f;i++)cells.push(null);for(let x=1;x<=d;x++)cells.push(x);while(cells.length%7!==0)cells.push(null);
  return(
    <div style={S.mCard}>
      <div style={S.mTitle}>{MONTHS[month]} {year}</div>
      <div style={S.cGrid}>
        {DAYS_SHORT.map(x=><div key={x} style={S.dHd}>{x}</div>)}
        {cells.map((day,i)=>{
          if(!day)return<div key={i}/>;
          const wk=isWE(year,month,day),iso=toISO(year,month,day);
          const feiRaw=isFT(iso,bl,year),ferRaw=isFer(iso,bl,year);
          const fei=showFeiertage?feiRaw:null;
          const fer=showFerien?ferRaw:null;
          const mk=[],pend=[];
          for(const e of entries){
            if(iso>=e.von&&iso<=e.bis){
              const prof=profiles.find(p=>p.id===e.user_id)||e.profiles;
              const color=prof?.color||"#2563EB";
              const name=prof?.vorname||"?";
              if(e.status==="confirmed")mk.push({color,type:e.type,name});
              else if(e.status==="pending")pend.push({color,name});
            }
          }
          let bg="transparent",tc=wk?"#b0c8b5":"#6b8f74";
          if(mk.length===1){bg=ca(mk[0].color,mk[0].type==="ueberstunden"?0.3:0.75);tc="#fff";}
          else if(mk.length>1){bg=`linear-gradient(135deg,${mk.map((m,i)=>`${ca(m.color,0.72)} ${i*100/mk.length}% ${(i+1)*100/mk.length}%`).join(",")})`;tc="#fff";}
          else if(pend.length>0){bg=ca(pend[0].color,0.18);}
          else if(fei&&!fer){bg="#d4b896";tc="#5c3d1a";}
          else if(fer&&!fei){bg="#fce7f3";tc="#9d174d";}
          else if(fei&&fer){bg="linear-gradient(135deg,#fce7f3 50%,#d4b896 50%)";tc="#7c2d4e";}
          function hEnter(ev){
            const lines=[],TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
            if(fei)lines.push({color:"#c9a07a",text:"🎉 "+fei});
            if(fer)lines.push({color:"#f9a8d4",text:"🌸 "+fer});
            mk.forEach(m=>lines.push({color:m.color,text:`${m.name} · ${TL[m.type]||m.type}`}));
            pend.forEach(m=>lines.push({color:m.color,text:`⏳ ${m.name} (ausstehend)`}));
            if(lines.length)onTip({x:ev.clientX,y:ev.clientY,date:`${wday(iso)}, ${fmtDE(iso)}`,lines});
          }
          return(
            <div key={i} onMouseEnter={hEnter} onMouseLeave={offTip} style={{...S.dCell,color:tc,background:bg,fontSize:10,fontWeight:mk.length>0?600:400,outline:(!mk.length&&fei)?"1px solid #c9a07a":(!mk.length&&fer&&!fei)?"1px solid #f9a8d4":"none",outlineOffset:"-1px",border:pend.length>0&&!mk.length?"1px dashed "+ca(pend[0].color,0.5):"none",cursor:(mk.length||fei||fer||pend.length)?"help":"default"}}>
              {day}
              {mk.length>1&&<div style={{display:"flex",gap:1,justifyContent:"center",marginTop:1}}>{mk.map((m,mi)=><div key={mi} style={{width:3,height:3,borderRadius:"50%",background:m.color}}/>)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── PDF-Druck für Urlaubsübersicht ──────────────────────────────────────────
function printUserPDF(u, year) {
  const w = window.open("about:blank","_pdf_"+Date.now(),"width=900,height=700");
  if(!w) return;
  const yStr=String(year);const uEntries = [...(u.entries||[])].filter(e=>e.type!=="ueberstunden"&&(e.von?.startsWith(yStr)||e.bis?.startsWith(yStr))).sort((a,b)=>a.von.localeCompare(b.von));
  const yEntries=(u.entries||[]).filter(e=>e.von?.startsWith(String(year))||e.bis?.startsWith(String(year)));
  const urlT = eDays(yEntries,"urlaub",u), rstT = eDays(yEntries,"resturlaub",u);
  const rem = (u.urlaubstage||30) - (urlT+rstT);
  const TL = {urlaub:"Urlaub",resturlaub:"Resturlaub"};
  const fde = s => s ? new Date(s).toLocaleDateString("de-DE") : "";
  const remColor = rem < 0 ? "#dc2626" : "#5a8a1f";
  const rows = uEntries.map(e =>
    "<tr><td>"+(TL[e.type]||e.type)+"</td>"
    +"<td>"+fde(e.von)+"</td><td>"+fde(e.bis)+"</td>"
    +"<td style='text-align:center;font-weight:bold'>"+fmtT(countWD(e.von,e.bis))+"</td>"
    +"<td>"+(e.created_at?new Date(e.created_at).toLocaleDateString("de-DE"):"")+"</td>"
    +"<td><span class='"+(e.status==="confirmed"?"ok":"pend")+"'>"+(e.status==="confirmed"?"Bestätigt":"Ausstehend")+"</span></td></tr>"
  ).join("");
  const css = "@page{size:A4 portrait;margin:16mm 14mm;}@media print{a[href]:after{content:none!important;}}"
    +"*{box-sizing:border-box;margin:0;padding:0;}"
    +"body{font-family:Arial,sans-serif;font-size:11px;color:#222;}"
    +".hdr{display:flex;align-items:center;gap:16px;margin-bottom:14px;border-bottom:2px solid #5a8a1f;padding-bottom:10px;}"
    +".meta{font-size:10px;background:#f5f8ec;padding:8px 12px;border-radius:4px;border-left:3px solid #5a8a1f;margin-bottom:14px;}"
    +".sum{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;}"
    +".sb{background:#f5f8ec;border:1px solid #d5e8a0;border-radius:6px;padding:10px;text-align:center;}"
    +".sv{font-size:20px;font-weight:bold;color:#5a8a1f;}.sl{font-size:9px;color:#666;margin-top:2px;}"
    +"table{width:100%;border-collapse:collapse;margin-bottom:24px;}"
    +"th{background:#5a8a1f;color:#fff;padding:7px 8px;text-align:left;font-size:10px;}"
    +"td{padding:5px 8px;border-bottom:1px solid #e8f0e8;font-size:10px;}"
    +"tr:nth-child(even) td{background:#f9fdf5;}"
    +".ok{background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;}"
    +".pend{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;}"
    +".sig{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:48px;}"
    +".sigb{border-top:1.5px solid #333;padding-top:8px;}"
    +".sigl{font-size:9px;color:#666;}.sign{font-size:9px;color:#888;margin-top:4px;font-style:italic;}"
    +".foot{margin-top:20px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #e8f0e8;padding-top:8px;}";
  const LOGO_B64 = "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";
  const html = "<!DOCTYPE html><html lang='de'><head><meta charset='UTF-8'/>"
    +"<title>Urlaubsübersicht "+u.vorname+" "+u.nachname+"</title>"
    +"<style>"+css+"</style></head><body>"
    +"<div class='hdr'><img src='data:image/png;base64,"+LOGO_B64+"' style='height:52px;width:auto;'/>"
    +"<div><div style='font-size:14px;font-weight:bold;color:#2d3a2e;margin-bottom:2px;'>Urlaubsübersicht "+year+"</div>"
    +"<div style='font-size:9px;color:#666;'>Therapie- &amp; Pflegezentrum Westlausitz</div></div></div>"
    +"<div class='meta'>Mitarbeiter: <strong>"+u.vorname+" "+u.nachname+"</strong>"
    +" &nbsp;|&nbsp; Position: "+posLabel(u.position,u.geschlecht)
    +" &nbsp;|&nbsp; Erstellt: "+new Date().toLocaleDateString("de-DE")+"</div>"
    +"<div class='sum'>"
    +"<div class='sb'><div class='sv'>"+(u.urlaubstage||30)+"</div><div class='sl'>Urlaubstage gesamt</div></div>"
    +"<div class='sb'><div class='sv'>"+(urlT+rstT)+"</div><div class='sl'>Genommen</div></div>"
    +"<div class='sb'><div class='sv' style='color:"+remColor+"'>"+rem+"</div><div class='sl'>Verbleibend</div></div>"
    +"</div>"
    +"<table><thead><tr><th>Typ</th><th>Von</th><th>Bis</th><th>Tage</th><th>Beantragt</th><th>Status</th></tr></thead>"
    +"<tbody>"+rows+"</tbody></table>"
    +"<div class='sig'>"
    +"<div class='sigb'><div style='height:46px'></div>"
    +"<div class='sigl'>Ort, Datum _______________ &nbsp; Unterschrift Mitarbeiter</div>"
    +"<div class='sign'>Ich bestätige die Richtigkeit meiner Urlaubsbeantragung.</div></div>"
    +"<div class='sigb'><div style='height:46px'></div>"
    +"<div class='sigl'>Unterschrift Praxisleitung</div>"
    +"<div class='sign'>Genehmigt durch die Praxisleitung.</div></div></div>"
    +"<div class='foot'>Therapie- & Pflegezentrum Westlausitz · "+new Date().toLocaleDateString("de-DE")+"</div>"
    +"<style>.np{position:fixed;top:10px;right:14px;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);}@media print{.np{display:none!important;}}</style><button class=np onclick=window.close()>Schliessen</button>"+"<scr"+"ipt>window.onload=function(){window.print();}</scr"+"ipt></body></html>";
  w.document.write(html);
  w.document.close();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashView({users,isAdmin,viewer,year,onEdit,onResetPwForUser,refreshKey=0}){
  const istEchterAdmin=viewer?.role==="admin";
  const[resetRequests,setResetRequests]=useState([]);
  const[loadingReq,setLoadingReq]=useState(false);

  useEffect(()=>{
    if(!istEchterAdmin)return;
    setLoadingReq(true);
    getPasswordResetRequests().then(d=>setResetRequests(d||[])).catch(()=>{}).finally(()=>setLoadingReq(false));
  },[istEchterAdmin,refreshKey]);

  async function handleDismiss(id){
    await dismissResetRequest(id);
    setResetRequests(p=>p.filter(r=>r.id!==id));
  }
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  return(
    <div>
      <h2 style={S.pgT}>Dashboard {year}</h2>

      {/* ── Passwort-Reset-Anfragen (nur Admin) ── */}
      {istEchterAdmin&&resetRequests.length>0&&(
        <div style={{background:"#fff7ed",borderRadius:12,border:"2px solid #f0932b",padding:16,marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:14,color:"#92400e",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🔔</span>
            Passwort-Reset-Anfragen ({resetRequests.length})
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {resetRequests.map(r=>(
              <div key={r.id} style={{background:"#fff",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:"#92400e"}}>📧 {r.email}</div>
                  <div style={{fontSize:11,color:"#b45309"}}>{new Date(r.requested_at).toLocaleString("de-DE")}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{
                    const user=users.find(u=>u.email===r.email);
                    if(user)onResetPwForUser({user,requestId:r.id});
                  }} style={{background:"#f0932b",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    🔑 Passwort zurücksetzen
                  </button>
                  <button onClick={()=>handleDismiss(r.id)}
                    style={{background:"#f8faf0",color:"#5a6b4a",border:"1px solid #d5e8a0",borderRadius:8,padding:"6px 10px",fontSize:12,cursor:"pointer"}}>
                    ✓ Erledigt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {istEchterAdmin&&resetRequests.length===0&&!loadingReq&&(
        <div style={{fontSize:12,color:"#8aaa5f",marginBottom:12}}>✅ Keine offenen Passwort-Reset-Anfragen</div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
        {users.map(u=>{
          const yearStr=String(year);
          const entries=(u.entries||[]).filter(e=>e.von?.startsWith(yearStr)||e.bis?.startsWith(yearStr));
          const urlU=eDays(entries,"urlaub",u),rstU=eDays(entries,"resturlaub",u),ueU=eDays(entries,"ueberstunden",u);
          const total=urlU+rstU,rem=(u.urlaubstage||30)-total,ueRem=(u.ueberstunden||0)-ueU;
          const pend=entries.filter(e=>e.status==="pending").length;
          return(
            <div key={u.id} style={{...S.card,borderTop:`4px solid ${u.color||"#3d7a4f"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{...S.av,width:40,height:40,fontSize:16,background:u.color||"#2563EB"}}>{u.vorname?.[0]||"?"}</div>
                  <div><div style={{fontWeight:700,fontSize:15,color:"#2d3a2e"}}>{u.vorname} {u.nachname}</div><div style={{fontSize:11,color:"#5a6b4a",fontWeight:500}}>{posLabel(u.position,u.geschlecht)}</div></div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>printUserPDF(u,year)} style={{...S.icnBtn,background:"#475569",color:"#fff",border:"none"}} title="Urlaub als PDF drucken">🖨</button>
                  {isAdmin&&<button style={S.icnBtn} onClick={()=>onEdit(u)}>✏️</button>}
                </div>
              </div>
              {istPauschal(u)?(
                <div style={{background:"#fff7ed",border:"1px solid #fcd9b0",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#92400e"}}>Pauschalkraft</div>
                  <div style={{fontSize:12,color:"#b45309"}}>{fmtT(total)} freie Tage in {year} eingetragen · kein festes Kontingent</div>
                </div>
              ):(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                <StatBox label="Urlaub" val={total} total={u.urlaubstage||30} color={u.color||"#2563EB"}/>
                <StatBox label="Überstunden" val={fmtT(ueU)} total={u.ueberstunden||0} color={lighten(u.color||"#2563EB",0.3)}/>
              </div>
              <div style={{fontSize:11,color:"#5a6b4a",marginBottom:10,lineHeight:1.5}}>
                🏖 <strong>{fmtT(total)} / {u.urlaubstage||30}</strong> Urlaubstage
                {rstU>0&&<> · davon {fmtT(rstU)} Resturlaub</>}
                {ueU>0&&<> &nbsp;|&nbsp; ⏱ zusätzlich <strong>{fmtT(ueU)} T</strong> aus Überstunden
                  {stdProTag(u)>0&&<> ({fmtStd(ueU*stdProTag(u))} Std.)</>}</>}
              </div>
              </>)}
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:entries.length>0?10:0}}>
                {!istPauschal(u)&&rstU>0&&<Chip text={`↩ Resturlaub: ${fmtT(rstU)}T`} bg={ca(u.color||"#2563EB",0.12)} col={lighten(u.color||"#2563EB",0.2)}/>}
                {!istPauschal(u)&&<Chip text={rem>=0?`✅ Noch: ${fmtT(rem)}T`:`⚠ Überzogen: ${fmtT(Math.abs(rem))}T`} bg={rem<0?"rgba(248,113,113,0.15)":"rgba(100,116,139,0.12)"} col={rem<0?"#f87171":"#94a3b8"}/>}
                {!istPauschal(u)&&(u.ueberstunden||0)>0&&<Chip text={ueRem>=0?`⏱ ÜS-Rest: ${fmtT(ueRem)}T`:`⏱ ÜS+: ${fmtT(Math.abs(ueRem))}T`} bg="rgba(139,92,246,0.12)" col="#a78bfa"/>}
                {pend>0&&<Chip text={`⏳ ${pend} ausstehend`} bg="rgba(251,191,36,0.12)" col="#fbbf24"/>}
              </div>
              {entries.length>0&&(
                <div style={{maxHeight:160,overflowY:"auto"}}>
                  {[...entries].sort((a,b)=>a.von.localeCompare(b.von)).map(e=>(
                    <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #0f172a"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:u.color||"#2563EB",flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:12,color:"#2d3a2e",fontWeight:500}}>{fmtDE(e.von)} – {fmtDE(e.bis)}</div>
                          <div style={{fontSize:10,color:"#5a6b4a"}}>{TL[e.type]||e.type} · {fmtT(countWD(e.von,e.bis))} T</div>
                        </div>
                      </div>
                      <StBadge status={e.status}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function StatBox({label,val,total,color}){const p=total>0?Math.min(100,Math.round(val/total*100)):0;return(<div style={{background:"#f8faf0",borderRadius:8,padding:"9px 11px",border:"1px solid #edf5ee"}}><div style={{fontSize:10,color:"#5a6b4a",marginBottom:3,fontWeight:600}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:"#2d3a2e"}}>{fmtT(val)}<span style={{color:"#8aaa5f",fontWeight:400,fontSize:12}}> / {total}</span></div><div style={{marginTop:5,height:4,background:"#d4e6d8",borderRadius:2}}><div style={{height:"100%",width:p+"%",background:color,borderRadius:2}}/></div></div>);}
function Chip({text,bg,col}){return<span style={{fontSize:11,background:bg,color:col,borderRadius:20,padding:"3px 9px",whiteSpace:"nowrap",fontWeight:600}}>{text}</span>;}
// ─── Countdown und Fortschritt der Jahresplanung ─────────────────────────────
function FristBanner({planJahr,eigene,offeneLeute=[],istLeitung,onPlanen,tick,darfBereichFiltern}){
  const rest=fristRest(planJahr);
  const erfuellt=eigene?eigene.anteil>=MINDEST_ANTEIL:true;
  const abgelaufen=!rest;
  const [bereich,setBereich]=useState("alle");
  const gefilterteLeute=offeneLeute.filter(u=>{
    if(!darfBereichFiltern||bereich==="alle")return true;
    if(bereich==="leitung")return posInfo(u.position).scope==="alle";
    return posInfo(u.position).bereich===bereich;
  });
  // Nach Fristablauf und bei erfüllter Planung nichts anzeigen, wenn auch im Team alles passt
  if(abgelaufen&&erfuellt&&offeneLeute.length===0)return null;
  const dringend=rest&&rest.tage<=30;
  // Farbe der eigenen Planung — unabhängig vom Stand im Team
  const farbe=erfuellt?"#5a8a1f":(abgelaufen||dringend?"#dc2626":"#f0932b");
  const hg   =erfuellt?"#f7fce8":(abgelaufen||dringend?"#fef2f2":"#fff7ed");
  const prozent=eigene?Math.min(100,Math.round(eigene.anteil*100)):100;
  return(
    <div style={{background:hg,border:"1.5px solid "+farbe,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:eigene?10:0}}>
        <span style={{fontSize:20}}>{erfuellt?"✅":abgelaufen?"⛔":"🗓"}</span>
        <div style={{fontWeight:800,fontSize:15,color:farbe}}>
          Urlaubsplanung {planJahr}
        </div>
        <div style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:farbe,fontVariantNumeric:"tabular-nums"}}>
          {abgelaufen
            ? "Frist am 30.11. abgelaufen"
            : rest.tage>0
              ? `noch ${rest.tage} ${rest.tage===1?"Tag":"Tage"} · ${rest.stunden} Std.`
              : `noch ${rest.stunden} Std. ${rest.minuten} Min.`}
        </div>
      </div>

      {eigene&&(
        <>
          <div style={{fontSize:13,color:"#5a6b4a",marginBottom:8}}>
            Bis zum <strong>30.11.{planJahr-1}</strong> müssen mindestens {Math.round(MINDEST_ANTEIL*100)} % des
            Jahresurlaubs verplant sein. Du hast <strong>{fmtT(eigene.verplant)}</strong> von {fmtT(eigene.anspruch)} Tagen
            eingetragen ({prozent} %){eigene.anspruch>0&&eigene.anteil<MINDEST_ANTEIL
              ? ` — es fehlen noch ${fmtT(Math.max(0,Math.ceil((eigene.anspruch*MINDEST_ANTEIL-eigene.verplant)*2)/2))} Tage.`
              : "."}
            <div style={{fontSize:12,color:"#5a6b4a",marginTop:3}}>
              Aufteilung: {fmtT(eigene.genutztUrlaub)} Jahresurlaub
              {eigene.genutztRest>0&&<> · {fmtT(eigene.genutztRest)} Resturlaub aus dem Vorjahr</>}
              {eigene.genutztUeber>0&&<> · zusätzlich {fmtT(eigene.genutztUeber)} Tage über Überstunden (zählen nicht zum Anspruch)</>}
            </div>
          </div>
          {/* Balken mit Verlauf: rot → orange → gelb → grün, gefüllt bis zum erreichten Anteil */}
          <div style={{height:11,borderRadius:6,marginBottom:10,position:"relative",overflow:"hidden",
            background:"linear-gradient(90deg,#dc2626 0%,#f0932b 40%,#facc15 65%,#7ab529 88%,#4d7c0f 100%)"}}>
            <div style={{position:"absolute",left:prozent+"%",right:0,top:0,bottom:0,
              background:"#e6ebdc",transition:"left .35s ease"}}/>
            <div style={{position:"absolute",left:"calc("+Math.round(MINDEST_ANTEIL*100)+"% - 1px)",top:0,bottom:0,
              width:2,background:"#2d3a2e",opacity:0.55}} title="Mindestens 90 % müssen verplant sein"/>
          </div>
          {!erfuellt&&(
            <button onClick={onPlanen} style={{...S.savBtn,background:farbe,padding:"8px 18px",fontSize:13}}>
              Jetzt Urlaub für {planJahr} planen
            </button>
          )}
        </>
      )}

      {istLeitung&&offeneLeute.length>0&&(
        <div style={{marginTop:eigene?12:8,paddingTop:10,borderTop:"1px solid rgba(0,0,0,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:700,color:"#92400e"}}>
              Noch offen im Team ({gefilterteLeute.length}{bereich!=="alle"?" von "+offeneLeute.length:""}):
            </div>
            {darfBereichFiltern&&(
              <select value={bereich} onChange={e=>setBereich(e.target.value)}
                style={{marginLeft:"auto",background:bereich==="alle"?"#fff":"#fef3c7",
                  border:"1px solid #fcd9b0",borderRadius:12,padding:"3px 9px",
                  fontSize:11,fontWeight:700,color:"#92400e",outline:"none"}}>
                {[["alle","Alle Bereiche"],["leitung","Leitung"],["physio","Physiotherapie"],
                  ["ergo","Ergotherapie"],["logo","Logopädie"],["podo","Podologie"],
                  ["trainer","Trainer"],["rezeption","Rezeption"]].map(([k,l])=>(
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            )}
          </div>
          {gefilterteLeute.length===0?(
            <div style={{fontSize:11,color:"#4a6b0f"}}>✅ In diesem Bereich haben alle ausreichend geplant.</div>
          ):(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {gefilterteLeute.map(u=>(
                <span key={u.id} style={{fontSize:11,background:"#fff",border:"1px solid #fcd9b0",borderRadius:10,padding:"3px 9px",color:"#92400e",fontWeight:600}}>
                  {u.vorname} {u.nachname}
                  <span style={{opacity:0.7,fontWeight:400}}> · {BEREICH_NAME[posInfo(u.position).bereich]||"Leitung"}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hinweis auf Neuerungen ──────────────────────────────────────────────────
function NeuerungenModal({eintraege,onGelesen,onSpaeter}){
  const [busy,setBusy]=useState(false);
  if(!eintraege||eintraege.length===0)return null;
  return(
    <div style={S.overlay}>
      <div style={{...S.modal,maxWidth:560}}>
        <div style={S.mHd}>
          <span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>
            ✨ Das ist neu
          </span>
        </div>
        <div style={{padding:"16px 20px",maxHeight:"55vh",overflowY:"auto"}}>
          {eintraege.map(e=>(
            <div key={e.version} style={{marginBottom:18}}>
              <div style={{fontWeight:700,fontSize:14,color:"#4a6b0f"}}>{e.titel}</div>
              <div style={{fontSize:11,color:"#8aaa5f",marginBottom:8}}>{e.datum}</div>
              <ul style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:6}}>
                {e.punkte.map((p,i)=>(
                  <li key={i} style={{fontSize:13,color:"#2d3a2e",lineHeight:1.45}}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{...S.mFt,flexWrap:"wrap"}}>
          <button style={{...S.savBtn,opacity:busy?0.6:1}} disabled={busy}
            onClick={async()=>{setBusy(true);try{await onGelesen();}finally{setBusy(false);}}}>
            Verstanden
          </button>
          <button style={S.canBtn} onClick={onSpaeter}>Später lesen</button>
        </div>
        <div style={{padding:"0 20px 14px",fontSize:11,color:"#8aaa5f"}}>
          „Später lesen“ zeigt den Hinweis bei der nächsten Anmeldung erneut.
        </div>
      </div>
    </div>
  );
}

function StBadge({status}){const m={confirmed:["✓ Bestätigt","#15803d","#dcfce7"],pending:["⏳ Ausstehend","#92400e","#fef3c7"],rejected:["✗ Abgelehnt","#991b1b","#fee2e2"]};const[t,c,b]=m[status]||["?","#6b8f74","#f0f4f0"];return<span style={{fontSize:10,background:b,color:c,borderRadius:20,padding:"3px 9px",fontWeight:700,whiteSpace:"nowrap",border:`1px solid ${b}`}}>{t}</span>;}

// ─── Mitarbeiter ──────────────────────────────────────────────────────────────
function MitView({users,onAdd,onEdit,onDelete,viewer,canDelete=false}){
  const schmal=useSchmal();
  const zahlen=u=>{
    const e=u.entries||[];
    return{urlT:eDays(e,"urlaub",u)+eDays(e,"resturlaub",u),ueT:eDays(e,"ueberstunden",u),
           pend:e.filter(x=>x.status==="pending").length};
  };
  // Handy: Karten statt Tabelle
  if(schmal)return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:10,flexWrap:"wrap"}}>
        <h2 style={S.pgT}>Mitarbeiter ({users.length})</h2>
        {canDelete&&<button style={S.addBtn} onClick={onAdd}>+ Anlegen</button>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {users.map(u=>{
          const{urlT,ueT,pend}=zahlen(u);
          return(
            <div key={u.id} style={{background:"#fff",borderRadius:12,border:"1px solid #d5e8a0",padding:12,boxShadow:"0 2px 8px rgba(61,122,79,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
                <div style={{...S.av,width:34,height:34,fontSize:14,background:u.color||"#2563EB",flexShrink:0}}>{u.vorname?.[0]||"?"}</div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#2d3a2e"}}>{u.vorname} {u.nachname}</div>
                  <div style={{fontSize:12,color:"#5a6b4a"}}>{posLabel(u.position,u.geschlecht)}</div>
                </div>
                <span style={{fontSize:10,background:u.role==="admin"?"#fef3c7":"#e0f2fe",color:u.role==="admin"?"#92400e":"#0369a1",padding:"3px 8px",borderRadius:10,fontWeight:700,whiteSpace:"nowrap"}}>{rolleLabel(u.role)}</span>
              </div>
              <div style={{fontSize:11,color:"#8aaa5f",wordBreak:"break-all",marginBottom:8}}>{u.email}</div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#2d3a2e",marginBottom:10}}>
                {istPauschal(u)?(
                  <span style={{color:"#92400e",fontWeight:600}}>Pauschalkraft · {fmtT(urlT)} freie Tage eingetragen</span>
                ):(<>
                  <span>🏖 Urlaub: <strong>{fmtT(urlT)} / {u.urlaubstage||30}</strong></span>
                  <span>⏱ Überstd.: <strong>{fmtT(ueT)} / {u.ueberstunden||0}</strong></span>
                  <span>🕐 {fmtStd(u.wochenstunden||0)} Std. / {u.arbeitstage_woche||5} Tage</span>
                </>)}
              </div>
              {pend>0&&<div style={{marginBottom:10}}><Chip text={`${pend} offen`} bg="#fef3c7" col="#92400e"/></div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button style={{...S.icnBtn,padding:"7px 14px"}} onClick={()=>onEdit(u)}>✏️ Bearbeiten</button>
                {canDelete&&u.id!==viewer?.id&&<button style={{...S.icnBtn,color:"#f87171",padding:"7px 14px"}} onClick={()=>onDelete(u.id)}>🗑 Löschen</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={S.pgT}>Mitarbeiter ({users.length})</h2>
        {canDelete&&<button style={S.addBtn} onClick={onAdd}>+ Mitarbeiter anlegen</button>}
      </div>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #d5e8a0",overflowX:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 2px 8px rgba(61,122,79,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}>
          <thead><tr style={{background:"#f8faf0"}}>{["Name","Position","Berechtigung","Urlaub","Überstunden","Offen",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u=>{
              const entries=u.entries||[];
              const urlT=eDays(entries,"urlaub",u)+eDays(entries,"resturlaub",u),ueT=eDays(entries,"ueberstunden",u),pend=entries.filter(e=>e.status==="pending").length;
              return(
                <tr key={u.id} style={{borderBottom:"1px solid #edf5ee"}}>
                  <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...S.av,width:30,height:30,fontSize:13,background:u.color||"#2563EB"}}>{u.vorname?.[0]||"?"}</div>{u.vorname} {u.nachname}</div></td>
                  <td style={{...S.td,fontSize:12,color:"#5a6b4a"}}>{posLabel(u.position,u.geschlecht)}<div style={{fontSize:11,color:"#8aaa5f"}}>{u.email}</div></td>
                  <td style={S.td}><span style={{fontSize:11,background:u.role==="admin"?"#fef3c7":"#e0f2fe",color:u.role==="admin"?"#92400e":"#0369a1",padding:"2px 8px",borderRadius:10,fontWeight:600}}>{rolleLabel(u.role)}</span></td>
                  <td style={S.td}>{istPauschal(u)?<span style={{fontSize:11,color:"#92400e",background:"#fff7ed",borderRadius:10,padding:"2px 8px",fontWeight:600}}>Pauschal</span>:<>{fmtT(urlT)} / {u.urlaubstage||30} T</>}</td>
                  <td style={S.td}>{istPauschal(u)?"—":<>{fmtT(ueT)} / {u.ueberstunden||0} T</>}</td>
                  <td style={S.td}>{pend>0&&<Chip text={`${pend} offen`} bg="#fef3c7" col="#92400e"/>}</td>
                  <td style={S.td}><div style={{display:"flex",gap:6}}><button style={S.icnBtn} onClick={()=>onEdit(u)}>✏️</button>{canDelete&&u.id!==viewer?.id&&<button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>onDelete(u.id)}>🗑</button>}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Einträge Admin ───────────────────────────────────────────────────────────
function EintAdmin({entries,profiles,year,onStatus,onDelete,onAdd,onEdit,viewer,darfBereichFiltern,ueAntraege=[],onUeEntscheiden}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const yearStr=String(year);
  const [bereich,setBereich]=useState("alle");
  const schmal=useSchmal();
  // Gehört die Person zum gewählten Fachbereich?
  const passt=uid=>{
    if(!darfBereichFiltern||bereich==="alle")return true;
    const pos=profiles.find(p=>p.id===uid)?.position;
    if(bereich==="leitung")return posInfo(pos).scope==="alle";
    return posInfo(pos).bereich===bereich;
  };
  const rich=entries
    .filter(e=>(e.von?.startsWith(yearStr)||e.bis?.startsWith(yearStr))&&passt(e.user_id))
    .map(e=>{
      const prof=profiles.find(p=>p.id===e.user_id)||e.profiles||{};
      return{...e,pName:`${prof.vorname||""} ${prof.nachname||""}`.trim(),pColor:prof.color||"#5a8a1f"};
    }).sort((a,b)=>a.von.localeCompare(b.von));
  const pend=rich.filter(e=>e.status==="pending");
  const rest=rich.filter(e=>e.status!=="pending");
  // Kollisionen eines Eintrags mit anderen Personen ermitteln
  function kollisionen(e,alle){
    return alle.filter(o=>o.id!==e.id&&o.user_id!==e.user_id&&o.status==="confirmed"&&e.von<=o.bis&&e.bis>=o.von);
  }
  // Handy: Karten statt Tabelle — nichts wird abgeschnitten
  function EKarten({rows,showAct,allEntries=[],profiles=[]}){
    if(!rows.length)return null;
    return(
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {rows.map(e=>{
          const kol=kollisionen(e,allEntries);
          return(
            <div key={e.id} style={{background:"#fff",borderRadius:10,border:"1px solid #d5e8a0",padding:12,boxShadow:"0 1px 4px rgba(61,122,79,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexWrap:"wrap"}}>
                <div style={{...S.legDot,background:e.pColor}}/>
                <strong style={{fontSize:14,color:"#2d3a2e"}}>{e.pName||"Unbekannt"}</strong>
                <span style={{fontSize:11,background:ca(e.pColor,0.2),color:e.pColor,borderRadius:10,padding:"2px 8px"}}>{TL[e.type]||e.type}</span>
                <div style={{marginLeft:"auto"}}><StBadge status={e.status}/></div>
              </div>
              <div style={{fontSize:13,color:"#2d3a2e",fontFamily:"monospace",marginBottom:4}}>
                {fmtDE(e.von)} – {fmtDE(e.bis)}
                <span style={{fontFamily:"inherit",fontWeight:700,color:"#8aaa5f",marginLeft:8}}>{fmtT(countWD(e.von,e.bis))} Tage</span>
              </div>
              <div style={{fontSize:11,color:"#8aaa5f",marginBottom:6}}>
                Beantragt: {e.created_at?new Date(e.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}
              </div>
              {kol.length===0
                ?<div style={{fontSize:11,color:"#15803d",fontWeight:600,marginBottom:8}}>✅ Keine Kollision</div>
                :<div style={{background:"#fff7ed",border:"1px solid #f0932b",borderRadius:6,padding:"5px 8px",marginBottom:8}}>
                   <div style={{fontSize:11,fontWeight:700,color:"#92400e"}}>⚠ Kollision:</div>
                   {kol.map((o,i)=>{
                     const op=profiles.find(p=>p.id===o.user_id);
                     return <div key={i} style={{fontSize:11,color:"#b45309"}}>• <strong>{op?.vorname||"?"}</strong> {fmtDE(o.von)}–{fmtDE(o.bis)}</div>;
                   })}
                 </div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {showAct&&e.status==="pending"&&(
                  darfEntscheiden(viewer,profiles.find(p=>p.id===e.user_id))?(<>
                    <button style={{...S.icnBtn,background:"#dcfce7",color:"#15803d",fontSize:14,padding:"6px 14px"}} onClick={()=>onStatus(e.id,"confirmed")}>✓ Bestätigen</button>
                    <button style={{...S.icnBtn,background:"rgba(248,113,113,0.15)",color:"#f87171",fontSize:14,padding:"6px 14px"}} onClick={()=>onStatus(e.id,"rejected")}>✗ Ablehnen</button>
                  </>):<span style={{fontSize:11,color:"#8aaa5f",alignSelf:"center"}}>wartet auf Leitung</span>
                )}
                <button style={{...S.icnBtn,padding:"6px 12px"}} onClick={()=>onEdit(e.user_id,e)}>✏️ Bearbeiten</button>
                <button style={{...S.icnBtn,color:"#f87171",padding:"6px 12px"}} onClick={()=>{
                  const note=window.prompt("Möchtest du dem Mitarbeiter eine Nachricht hinterlassen? (optional)");
                  if(note!==null)onDelete(e.id,note);
                }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  function ETable({rows,showAct,allEntries=[],profiles=[],TLmap}){
    if(!rows.length)return null;
    if(schmal)return <EKarten rows={rows} showAct={showAct} allEntries={allEntries} profiles={profiles}/>;
    return(
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #d5e8a0",overflowX:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 1px 4px rgba(61,122,79,0.06)",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:820}}>
          <thead><tr style={{background:"#f8faf0"}}>{["Mitarbeiter","Typ","Von","Bis","Tage","Beantragt am","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(e=>(
              <tr key={e.id} style={{borderBottom:"1px solid #edf5ee"}}>
                <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{...S.legDot,background:e.pColor}}/>{e.pName||"Unbekannt"}</div></td>
                <td style={S.td}><span style={{fontSize:11,background:ca(e.pColor,0.2),color:e.pColor,borderRadius:10,padding:"2px 8px"}}>{TL[e.type]||e.type}</span></td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.von)}</td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.bis)}</td>
                <td style={{...S.td,fontWeight:600,color:"#8aaa5f"}}>{fmtT(countWD(e.von,e.bis))}</td>
                <td style={{...S.td,fontSize:11,color:"#8aaa5f"}}>
                  {e.created_at?new Date(e.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}
                </td>
                <td style={S.td}>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <StBadge status={e.status}/>
                      {(()=>{
                        // Prüfe Kollision mit anderen bestätigten Einträgen
                        const conflicts=allEntries.filter(o=>
                          o.id!==e.id&&
                          o.user_id!==e.user_id&&
                          o.status==="confirmed"&&
                          e.von<=o.bis&&e.bis>=o.von
                        );
                        if(conflicts.length===0)return(
                          <span style={{fontSize:10,color:"#15803d",fontWeight:600}}>✅ Frei</span>
                        );
                        return(
                          <div style={{background:"#fff7ed",border:"1px solid #f0932b",borderRadius:6,padding:"4px 7px",marginTop:2}}>
                            <div style={{fontSize:10,fontWeight:700,color:"#92400e",marginBottom:2}}>⚠ Kollision:</div>
                            {conflicts.map((o,i)=>{
                              const op=profiles.find(p=>p.id===o.user_id);
                              return(
                                <div key={i} style={{fontSize:10,color:"#b45309",display:"flex",alignItems:"center",gap:3}}>
                                  <div style={{width:6,height:6,borderRadius:"50%",background:op?.color||"#f0932b",flexShrink:0}}/>
                                  <span><strong>{op?.vorname||"?"}</strong> {fmtDE(o.von)}–{fmtDE(o.bis)}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                <td style={S.td}>
                  <div style={{display:"flex",gap:4}}>
                    {showAct&&e.status==="pending"&&<>
                      {darfEntscheiden(viewer,profiles.find(p=>p.id===e.user_id))?(<>
                      <button style={{...S.icnBtn,background:"#dcfce7",color:"#15803d",fontSize:14}} onClick={()=>onStatus(e.id,"confirmed")} title="Bestätigen">✓</button>
                      <button style={{...S.icnBtn,background:"rgba(248,113,113,0.15)",color:"#f87171",fontSize:14}} onClick={()=>onStatus(e.id,"rejected")} title="Ablehnen">✗</button>
                      </>):(<span style={{fontSize:11,color:"#8aaa5f"}} title="Über den eigenen Antrag entscheidet die Praxis- oder Geschäftsleitung.">wartet auf Leitung</span>)}
                    </>}
                    <button style={S.icnBtn} onClick={()=>onEdit(e.user_id,e)}>✏️</button>
                    <button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>{
                      const note=window.prompt("Möchtest du dem Mitarbeiter eine Nachricht hinterlassen? (optional)");
                      if(note!==null)onDelete(e.id,note);
                    }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <h2 style={S.pgT}>Einträge {year}</h2>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {profiles.filter(u=>passt(u.id)).map(u=><button key={u.id} style={{...S.addBtn,background:u.color||"#2563EB",fontSize:11,padding:"6px 10px"}} onClick={()=>onAdd(u.id)}>+ {u.vorname}</button>)}
        </div>
      </div>
      {/* Fachbereichs-Filter wie im Kalender */}
      {darfBereichFiltern&&(schmal?(
        <select value={bereich} onChange={e=>setBereich(e.target.value)}
          style={{marginBottom:14,background:bereich==="alle"?"#f8faf0":"#e8f3d6",
            border:"1.5px solid "+(bereich==="alle"?"#c8d890":"#7ab529"),borderRadius:14,
            padding:"6px 12px",fontSize:13,fontWeight:700,color:"#4a6b0f",outline:"none",maxWidth:"100%"}}>
          {[["alle","👥 Alle"],["leitung","🔑 Leitung"],["physio","Physiotherapie"],["ergo","Ergotherapie"],["logo","Logopädie"],["podo","Podologie"],["trainer","Trainer"],["rezeption","Rezeption"]].map(([k,lbl])=>(
            <option key={k} value={k}>{k==="alle"?"Alle Bereiche":lbl.replace(/^[^ ]+ /,"")}</option>
          ))}
        </select>
      ):(
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
          {[["alle","👥 Alle"],["leitung","🔑 Leitung"],["physio","Physiotherapie"],["ergo","Ergotherapie"],["logo","Logopädie"],["podo","Podologie"],["trainer","Trainer"],["rezeption","Rezeption"]].map(([k,lbl])=>(
            <button key={k} onClick={()=>setBereich(k)} style={{
              background:bereich===k?"#e8f3d6":"none",cursor:"pointer",
              border:"1px solid "+(bereich===k?"#7ab529":"#cbd5e1"),
              borderRadius:14,padding:"4px 10px",transition:"all .15s",
              opacity:bereich===k?1:0.55,fontSize:11,fontWeight:600,
              color:bereich===k?"#4a6b0f":"#94a3b8",whiteSpace:"nowrap",
            }}>{lbl}</button>
          ))}
        </div>
      ))}
      {/* Offene Überstundenanträge */}
      {(()=>{
        const offen=(ueAntraege||[]).filter(a=>a.status==="pending"&&passt(a.user_id));
        if(offen.length===0)return null;
        return(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>⏱ Überstundenanträge ({offen.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {offen.map(a=>{
                const u=profiles.find(p=>p.id===a.user_id);
                const std=(u?.wochenstunden||0)/(u?.arbeitstage_woche||5);
                const tage=std>0?Math.round((a.stunden/std)*100)/100:null;
                return(
                  <div key={a.id} style={{background:"#fff",border:"1.5px solid #f0932b",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                      <div style={{...S.legDot,background:u?.color||"#f0932b"}}/>
                      <strong style={{fontSize:14,color:"#2d3a2e"}}>{u?.vorname} {u?.nachname}</strong>
                      <span style={{fontSize:14,fontWeight:800,color:a.stunden<0?"#b45309":"#15803d"}}>
                        {a.stunden>0?"+":""}{fmtStd(a.stunden)} Std.
                      </span>
                      {tage!==null&&<span style={{fontSize:12,color:"#5a6b4a"}}>≙ {fmtT(tage)} Tage · Konto {fmtT(u?.ueberstunden||0)} → {fmtT(Math.round(((u?.ueberstunden||0)+tage)*100)/100)}</span>}
                    </div>
                    {a.grund&&<div style={{fontSize:12,color:"#5a6b4a",marginBottom:6}}>„{a.grund}"</div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button style={{...S.icnBtn,background:"#dcfce7",color:"#15803d",padding:"6px 14px",fontWeight:700}}
                        onClick={()=>onUeEntscheiden(a.id,"confirmed",null)}>✓ Genehmigen</button>
                      <button style={{...S.icnBtn,background:"rgba(248,113,113,0.15)",color:"#f87171",padding:"6px 14px",fontWeight:700}}
                        onClick={()=>{const h=window.prompt("Grund für die Ablehnung (optional)");if(h!==null)onUeEntscheiden(a.id,"rejected",h);}}>✗ Ablehnen</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {/* Kontostand je Mitarbeiter im gewählten Jahr */}
      {(()=>{
        const relevant=profiles.filter(p=>passt(p.id)&&!p.pauschal);
        if(relevant.length===0)return null;
        return(
          <div style={{background:"#fff",border:"1px solid #d5e8a0",borderRadius:10,padding:"10px 12px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#2d3a2e",marginBottom:6}}>📊 Stand {year}</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {relevant.map(p=>{
                const eig=entries.filter(e=>e.user_id===p.id&&e.status!=="rejected"
                  &&(e.von?.startsWith(String(year))||e.bis?.startsWith(String(year))));
                const ur=eDays(eig,"urlaub",p),rs=eDays(eig,"resturlaub",p),ue=eDays(eig,"ueberstunden",p);
                const anspruch=Number(p.urlaubstage)||0;
                const offen=Math.round((anspruch-(ur+rs))*2)/2;
                const std=(Number(p.wochenstunden)||0)/(Number(p.arbeitstage_woche)||1);
                return(
                  <div key={p.id} style={{fontSize:12,color:"#5a6b4a",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{...S.legDot,background:p.color}}/>
                    <strong style={{color:"#2d3a2e",minWidth:110}}>{p.vorname} {p.nachname}</strong>
                    <span>🏖 <strong>{fmtT(ur+rs)}/{anspruch}</strong> Urlaubstage</span>
                    {rs>0&&<span style={{color:"#8aaa5f"}}>(davon {fmtT(rs)} Resturlaub)</span>}
                    <span style={{color:offen<0?"#dc2626":"#4a6b0f"}}>
                      {offen>=0?`noch ${fmtT(offen)} offen`:`${fmtT(Math.abs(offen))} zu viel`}
                    </span>
                    {ue>0&&<span style={{color:"#a78bfa"}}>⏱ zusätzlich {fmtT(ue)} T aus Überstunden
                      {std>0?` (${fmtStd(ue*std)} Std.)`:""} · Konto {fmtT(p.ueberstunden||0)} T</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {pend.length>0&&<><div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>⏳ Ausstehend ({pend.length})</div><ETable rows={pend} showAct allEntries={rich} profiles={profiles}/></>}
      {rest.length>0&&<><div style={{fontSize:13,fontWeight:700,color:"#6a9e2f",marginBottom:8}}>📋 Alle ({rest.length})</div><ETable rows={rest} allEntries={rich} profiles={profiles}/></>}
      {rich.length===0&&<div style={{color:"#475569",fontSize:14,padding:24,textAlign:"center"}}>Noch keine Einträge.</div>}
    </div>
  );
}

// ─── Mein Urlaub ─────────────────────────────────────────────────────────────
function MeinUrlaub({user,year,onAdd,onEdit,onDelete,onRequestChange,onRequestDelete,ueAntraege=[],onUeAntrag,onUeZurueck}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const yearStr=String(year);
  const allEntries=user?.entries||[];
  // Alle Einträge für Summenberechnung, nur Jahr für Tabelle
  const entries=allEntries.filter(e=>e.von?.startsWith(yearStr)||e.bis?.startsWith(yearStr));
  const urlU=eDays(entries,"urlaub",user),rstU=eDays(entries,"resturlaub",user),ueU=eDays(entries,"ueberstunden",user);
  const[ueFormular,setUeFormular]=useState(false);
  const[ueStunden,setUeStunden]=useState("");
  const[ueGrund,setUeGrund]=useState("");
  const[ueBusy,setUeBusy]=useState(false);
  const[ueFehler,setUeFehler]=useState("");
  const meineUeAntraege=(ueAntraege||[]).filter(a=>a.user_id===user?.id);
  const stdTag=stdProTag(user);
  async function ueAbsenden(){
    const wert=parseFloat(String(ueStunden).replace(",","."));
    if(!wert||isNaN(wert)){setUeFehler("Bitte eine Stundenzahl eingeben, z. B. 4 oder -2.");return;}
    if(Math.abs(wert)>200){setUeFehler("Bitte einen realistischen Wert eingeben.");return;}
    if(!stdTag){setUeFehler("Deine Arbeitszeit ist noch nicht hinterlegt. Bitte an die Leitung wenden.");return;}
    setUeFehler("");setUeBusy(true);
    try{
      await onUeAntrag(wert,ueGrund);
      setUeStunden("");setUeGrund("");setUeFormular(false);
    }finally{setUeBusy(false);}
  }
  const rem=(user?.urlaubstage||30)-(urlU+rstU);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={S.pgT}>Mein Urlaub</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{
            const w=window.open("about:blank","_urlaubsdruck_"+Date.now(),"width=900,height=700");
            const sorted=[...allEntries].filter(e=>e.type!=="ueberstunden").sort((a,b)=>a.von.localeCompare(b.von));
            const urlT=eDays(allEntries,"urlaub",user),rstT=eDays(allEntries,"resturlaub",user);
            const rem=(user?.urlaubstage||30)-(urlT+rstT);
            const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
            const fde=s=>s?new Date(s).toLocaleDateString("de-DE"):"";
            const pdfYear=year||new Date().getFullYear();
            w.document.write(`<!DOCTYPE html><html lang="de"><head>
<meta charset="UTF-8"/>
<title>Urlaubsübersicht ${user?.vorname} ${user?.nachname} ${pdfYear}</title>
<style>
@page{size:A4 portrait;margin:16mm 14mm;}@media print{a[href]:after{content:none!important;}}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,sans-serif;font-size:11px;color:#222;}
.header{display:flex;align-items:center;gap:16px;margin-bottom:14px;border-bottom:2px solid #5a8a1f;padding-bottom:10px;}
.header-text{flex:1;}
.header-text h1{font-size:14px;color:#2d3a2e;margin-bottom:2px;}
.header-text .sub{font-size:9px;color:#666;}
.meta{font-size:10px;color:#555;margin-bottom:14px;background:#f5f8ec;padding:8px 12px;border-radius:4px;border-left:3px solid #5a8a1f;}
.sum{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;}
.sum-box{background:#f5f8ec;border:1px solid #d5e8a0;border-radius:6px;padding:10px;text-align:center;}
.sv{font-size:20px;font-weight:bold;color:#5a8a1f;}
.sl{font-size:9px;color:#666;margin-top:2px;}
table{width:100%;border-collapse:collapse;margin-bottom:24px;}
th{background:#5a8a1f;color:#fff;padding:7px 8px;text-align:left;font-size:10px;}
td{padding:5px 8px;border-bottom:1px solid #e8f0e8;font-size:10px;}
tr:nth-child(even) td{background:#f9fdf5;}
.ok{background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;}
.pend{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:bold;}
.sig-area{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:48px;}
.sig-box{border-top:1.5px solid #333;padding-top:8px;}
.sig-label{font-size:9px;color:#666;margin-bottom:4px;}
.sig-note{font-size:9px;color:#888;margin-top:4px;font-style:italic;}
.foot{margin-top:20px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #e8f0e8;padding-top:8px;}
</style>
</head><body>
<div class="header">
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACesAAAJHCAYAAAAKBp/sAAAABGdBTUEAALGPC/xhBQAACklpQ0NQc1JHQiBJRUM2MTk2Ni0yLjEAAEiJnVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/stRzjPAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAJcEhZcwAAXcAAAF3AARYR6soAAPDHSURBVHic7N13mDNV+f/x901oKx1BRMWKqNgQRQ2KwiKKigTbYhe7InbsvXflZ+9dxMVC7AVXsMWGYqGogCBiAZSmBJBwfn9M+PqAT0kmMzmT3ffrunKJPHPO+bDP7CQ5c885kVJCkiRJkiRJkiRJkiRJkiTVZ73cASRJkiRJkiRJkiRJkiRJWu4s1pMkSZIkSZIkSZIkSZIkqWYW60mSJEmSJEmSJEmSJEmSVDOL9SRJkiRJkiRJkiRJkiRJqpnFepIkSZIkSZIkSZIkSZIk1cxiPUmSJEmSJEmSJEmSJEmSamaxniRJkiRJkiRJkiRJkiRJNbNYT5IkSZIkSZIkSZIkSZKkmlmsJ0mSJEmSJEmSJEmSJElSzSzWkyRJkiRJkiRJkiRJkiSpZhbrSZIkSZIkSZIkSZIkSZJUM4v1JEmSJEmSJEmSJEmSJEmqmcV6kiRJkiRJkiRJkiRJkiTVzGI9SZIkSZIkSZIkSZIkSZJqZrGeJEmSJEmSJEmSJEmSJEk1s1hPkiRJkiRJkiRJkiRJkqSaWawnSZIkSZIkSZIkSZIkSVLNLNaTJEmSJEmSJEmSJEmSJKlmFutJkiRJkiRJkiRJkiRJklQzi/UkSZIkSZIkSZIkSZIkSaqZxXqSJEmSJEmSJEmSJEmSJNXMYj1JkiRJkiRJkiRJkiRJkmpmsZ4kSZIkSZIkSZIkSZIkSTWzWE+SJEmSJEmSJEmSJEmSpJpZrCdJkiRJkiRJkiRJkiRJUs0s1pMkSZIkSZIkSZIkSZIkqWYW60mSJEmSJEmSJEmSJEmSVDOL9SRJkiRJkiRJkiRJkiRJqpnFepIkSZIkSZIkSZIkSZIk1cxiPUmSJEmSJEmSJEmSJEmSamaxniRJkiRJkiRJkiRJkiRJNbNYT5IkSZIkSZIkSZIkSZKkmlmsJ0mSJEmSJEmSJEmSJElSzSzWkyRJkiRJkiRJkiRJkiSpZhbrSZIkSZIkSZIkSZIkSZJUM4v1JEmSJEmSJEmSJEmSJEmqmcV6kiRJkiRJkiRJkiRJkiTVzGI9SZIkSZIkSZIkSZIkSZJqZrGeJEmSJEmSJEmSJEmSJEk1s1hPkiRJkiRJkiRJkiRJkqSaWawnSZIkSZIkSZIkSZIkSVLNLNaTJEmSJEmSJEmSJEmSJKlmFutJkiRJkiRJkiRJkiRJklQzi/UkSZIkSZIkSZIkSZIkSaqZxXqSJEmSJEmSJEmSJEmSJNXMYj1JkiRJkiRJkiRJkiRJkmpmsZ4kSZIkSZIkSZIkSZIkSTWzWE+SJEmSJEmSJEmSJEmSpJpZrCdJkiRJkiRJkiRJkiRJUs0s1pMkSZIkSZIkSZIkSZIkqWYW60mSJEmSJEmSJEmSJEmSVDOL9SRJkiRJkiRJkiRJkiRJqpnFepIkSZIkSZIkSZIkSZIk1cxiPUmSJEmSJEmSJEmSJEmSamaxniRJkiRJkiRJkiRJkiRJNbNYT5IkSZIkSZIkSZIkSZKkmlmsJ0mSJEmSJEmSJEmSJElSzSzWkyRJkiRJkiRJkiRJkiSpZhbrSZIkSZIkSZIkSZIkSZJUM4v1JEmSJEmSJEmSJEmSJEmqmcV6kiRJkiRJkiRJkiRJkiTVzGI9SZIkSZIkSZIkSZIkSZJqZrGeJEmSJEmSJEmSJEmSJEk1s1hPkiRJkiRJkiRJkiRJkqSaWawnSZIkSZIkSZIkSZIkSVLNLNaTJEmSJEmSJEmSJEmSJKlmFutJkiRJkiRJkiRJkiRJklSz9XMHkCRp2rq91sbAZsCGw//dFNgK2BrYALjG8N9tCGw0/HcbAZsM/x3AFUAAFwP/oSiAv2z4/y8ALhr+8/nAhRTvuf8G/gH8o9MeXFTvf6UkSZIkSZIkSZIkSWqSSCnlziBJUqW6vda1gOsAmwM3BnYAtgS2Ba47/P9bA4mi+O4aTKeA/XKKQr5/AP8Ezhv+83nAH4Ezgb8B5wB/7rQH/55CJkmSJEmSJEmSJEmSNAUW60mSZla317oRRfHd9YBdge2H/7wTsB3QypduIv8BTgf+TFG890fgd8DfgVM77cEp+aJJkiRJkiRJkiRJkqQyLNaTJDVet9daH7gRcAvglsBdKFbOuwnF6nkryUXA74E/AccDvwVOAU7otAeDjLkkSZIkSZIkSZIkSdJaWKwnSWqcbq+1LXAb4I7ArYHbUWxdu0nOXA2WgJMottH9PkUB3y+BMzvtgW/0kiRJkiRJkiRJkiQ1gMV6kqTsVinOuz1wZ+CuwLZZQ82+8ylW3Psx8HOg12kPfp81kSRJkiRJkiRJkiRJK5jFepKkLLq91q7AnhSr5+1Bsa2t6tOnKNz7BvDVTntwQuY8kiRJkiRJkiRJkiStKBbrSZKmottrbUmxat4+wF4UW9sqjwR8F/g68JVOe3By5jySJEmSJEmSJEmSJC17FutJkmrT7bW2oFg9rwPsDVw/ayCtzuUURXufBr7caQ8uzpxHkiRJkiRJkiRJkqRlyWI9SVKlur3WBsA9gAdSrKJngd7s+CNwOPDpTntwUu4wkiRJkiRJkiRJkiQtJxbrSZIq0e219gbuDdwHuEXmOJrMf4Cj+O9qe1fkjSNJkiRJkiRJkiRJ0uyzWE+SVFq317ox8CDgQGDXzHFUj18AnwCO6LQHf88dRpIkSZIkSZIkSZKkWWWxniRpLN1ea31gX+ARwP7AXN5EmpJzKLbI/XinPfhl7jCSJEmSJEmSJEmSJM0ai/UkSSPp9lo7Ag8FHgzcOnMc5fUl4MOd9uBLuYNIkiRJkiRJkiRJkjQrLNaTJK1Vt9faHXgCxVa3rqKnVR0PfIhitb1/Zc4iSZIkSZIkSZIkSVKjWawnSVqtbq91f4oivXvnzqLG+yPwQeBjnfbgr7nDSJIkSZIkSZIkSZLURBbrSZL+T7fX2oBiBb2nAXfMHEez5x/Ap4D3d9qDk3KHkSRJkiRJkiRJkiSpSSzWkyTR7bU2Ah5LsZLe7TLH0ey7FPgkRdHez3OHkSRJkiRJkiRJkiSpCSzWk6QVrNtrtYDHA88Ebp43jZapLwDv7bQHR+cOIkmSJEmSJEmSJElSThbrSdIK1e21HgM8G7hV7ixaEY4B3t1pDz6XO4gkSZIkSZIkSZIkSTlYrCdJK0y313o0RZHebXJn0Yp0HHBYpz34VO4gkiRJkiRJkiRJkiRNk8V6krRCdHutA4AXAbtljiIB/Ap4F/DJTntwae4wkiRJkiRJkiRJkiTVzWI9SVrmur3WrYFXAQdkjiKtzknAO4EPd9qDy3KHkSRJkiRJkiRJkiSpLhbrSdIy1e21tgIOBZ4LbJA5jrQuvwYOAz7WaQ/8cCJJkiRJkiRJkiRJWnYs1pOkZajbaz0SeCVwo9xZpDEdD7yt0x58MncQSZIkSZIkSZIkSZKqZLGeJC0j3V5rV+ANwD65s0gT+h7wzE578MvcQSRJkiRJkiRJkiRJqoLFepK0DHR7rfWAlwMvBSJzHKkqVwCvBl7p1riSJEmSJEmSJEmSpFlnsZ4kzbhur3Uv4PXA7XJnkWryM+AZnfaglzuIJEmSJEmSJEmSJEllWawnSTOq22ttQVGk95TcWaQpuBx4AfCeTnvQzx1GkiRJkiRJkiRJkqRxWawnSTOo22vdD3gbsGPuLNKUnQS8tdMefDh3EEmSJEmSJEmSJEmSxmGxniTNkG6vNQe8FVfTk74PPK7THvwhdxBJkiRJkiRJkiRJkkZhsZ4kzYhur7U78GHg5rmzSA1xAfDMTnvwsdxBJEmSJEmSJEmSJElal/VyB5AkrVu313oB8EMs1JNWtQXw0W6v9aLcQSRJkiRJkiRJkiRJWpf1cweQJK1Zt9faHngfsH/uLFKD3RN4Xe4QkiRJkiRJkiRJkiStjcV6ktRQ3V7rfsB7gevmziI11J+BnwOvyJxDkiRJkiRJkiRJkqR1slhPkhqo22u9Bnhx7hxSw5wBnAj8GPgRcFynPTgvbyRJkiRJkiRJkiRJkkZjsZ4kNUi319oWOBy4R+4sUoMcBSwCX++0B+fnjSJJkiRJkiRJkiRJUjkW60lSQ3R7rd2BzwDXz51FaoA/AZ8DPtlpD47PnEWSJEmSJEmSJEmSpIlZrCdJDdDttR4NfBSI3FmkzL4JfBrodtqDC+sapNtrbQbcELgBsD2wHbANsCmwEcVnpPWAy4FLgYuB84BzgL9RbMl7aqc9OLeujJIkSZIkSZIkSZKk5SVSSrkzSNKK1u213gwcmjuHlFkXOKzTHhxTaae91kYUBXm3AG4J3Ai4MUWh3nbAJiW7vgw4l6Jo78rXScBvgNPcrleSJEmSJEmSJEmSdHUW60lSJt1ea45iBbH7584iZXQK8IJOe/D5Kjrr9lrrA7cCdgfuCNwe2AnYsIr+R3QG8CvgeOD7wC867cE/pzi+JEmSJEmSJEmSJKmBLNaTpAy6vdaNgS8At82dRcrorcDLOu3BxZN00u21tgT2BO4N3IViBb0m+QtF0d7RwHc77cGpmfNIkiRJkiRJkiRJkjKwWE+Spqzba90Z+Cqwde4sUiZ/BJ7SaQ++WbaD4Qp69wYeANwTuE5F2ep2CUXh3pHAlzrtwd8z55EkSZIkSZIkSZIkTYnFepI0Rd1eaz/gKKCVOYqUy5EUhXr/KNO422vtBDwCOJBie9tZ9k/gS8BnOu3Bt3KHkSRJkiRJkiRJkiTVy2I9SZqSbq/1KODjuXNIGT2r0x4cVqZht9faA3g8RZHeRlWGaoifAh8GPtlpD/q5w0iSJEmSJEmSJEmSqmexniRNQbfXeg7wltw5puSK4f9eClw8fP0b+M8qrw2GrysoVhnckKIAayPgGsDc8M+1PJwFPLLTHnx33IbdXmtf4KnAfpWnaqbfAe8CPmzRniRJkiRJkiRJkiQtLxbrSVLNur3Wq4CX5s5RkT5wHnA+8CeKIqxzgbOBvwB/oyjMA7gEuJD/Fuxd2mkPLgfo9lobAImiWG9DYD2Kor1NgM2Hry2AjYH1gW2BHYDrA9cGth7+u+0oivvUXEcDB3Xag7PGadTttfYCngfsW0uq5jsZeAfwwSt/byRJkiRJkiRJkiRJs81iPUmqUbfXOgx4Ru4cJSTgTIpivF8BpwGnUBQQnQP8q9MeXJIvHnR7rTngBsB1KYr2dgVuOvz/t6Qo9FNe7+20BweP06Dba90aeAmwUE+kmfNr4NWd9uBzuYNIkiRJkiRJkiRJkiZjsZ4k1aTba30AeELuHCP6O3AC8DOK4qA/AL/vtAcXZE1VUrfX2gm4EXAz4HbALYDbYgHfNL2k0x68dtSDu73WNYCXA8+mWE1RV9UFXthpD07KHUSSJEmSJEmSJEmSVI7FepJUgxko1DuZYsW8HwPHAyd02oNzsiaqWbfXujlF8d4dKQr3dgOulTXU8vW0TnvwrlEP7vZa9wMOA25cW6LloQ+8qtMevCF3EEmSJEmSJEmSJEnS+CzWk6SKdXut9wJPzp3jas4HfgQcC3wH+F2nPfhX1kSZdXut61BsnXvn4etOwKZZQy0Pj+y0B58a5cBur7Ux8GbgkHojLTvfB57eaQ+Ozx1EkiRJkiRJkiRJkjQ6i/UkqULdXuv/AU/PnWPodODo4evHnfbgjLxxmq3ba90YuPvwdTeKbXQ1ngd22oMvjHJgt9dqA+8Bdqk10fL1H+A5nfbgnbmDSJIkSZIkSZIkSZJGY7GeJFWk22u9CXhu5hinAF8DvgL0VvrqeWV1e61rAHsA+wL3AG6VN9FMeECnPfjiKAd2e61nAW8Fot5IK8JngCf6uy5JkiRJkiRJkiRJzWexniRVoNtrvR54Qabhz6Io0PsycHSnPehnyrFsdXutvYEDgP2AG2YN00wjFep1e631gQ8Bj64/0opyMvBQt8WVJEmSJEmSJEmSpGazWE+SJtTttV4CvHrKw14OfBU4Avhmpz04b8rjr1F/cX5LYEtgC2AbYGtgq+Frs+FrE2BjYKPha31gPWADIAGXDbu7HOgDFwOXAOcPX2cDfwL+Cpw1t7B0Qc3/WQB0e63Ngb2AB1MU7m0xjXEb7hGd9uDT6zqo22vtABwJ3Kn+SCvSpcBBnfbgiNxBJEmSJEmSJEmSJEmrZ7GeJE2g22sdArxzikOeBnwKWOy0BydMcdz/01+cvyZwPWA74CbADYDrUxTmbQ9cc/jPG0wp0l+A3wLfBw6fW1g6bRqDDovPHgA8BLjzNMZsoGd12oPD1nVQt9faFTgK2KHuQBrt70SSJEmSJEmSJEmSNH0W60lSSd1e6wHA56c03A+BjwGf7bQHF01jwP7i/BbArSgK8W45/OfrUhRcbTeNDCVcAhw8t7D00WkO2u219gIeSVG4NzfNsTN6a6c9OHRdB3V7rXtSrKi3ef2RNPSKTnvwytwhJEmSJEmSJEmSJElXZbGeJJXQ7bV2pyigq1MCvgB8qNMefKPOgfqL83PA7YFbA7cd/nOTi/LW5vi5haXb5Ri422vdhKJo71HAjXJkmJKvdNqD+63roG6vtQB8dgp59L9GKqaUJEmSJEmSJEmSJE2PxXqSNKZur3UD4Hhgy5qGuAT4KEWR3i/qGKC/OH8tYA/gdsDuFKvmbVvHWBnsM7ewdHTOAN1eaw54GHAwsGvOLDX4FXCnTntw6doO6vZajwQ+MZ1IWoP3d9qDJ+cOIUmSJEmSJEmSJEkqWKwnSWPo9lqbAr8AblpD95cBHwDe0WkP/lBlx8PivDsA88CdgN2AjaocowHOBh6eu1Dv6rq91oHAU4C7585SgfOBnTvtwV/XdlC313o48KmpJNK6fKzTHjwmdwhJkiRJkiRJkiRJksV6kjSWbq91NLB3xd3+B/gI8JZOe3BKVZ32F+dvC9yTYgW9vYBNq+q7gT4IvHRuYenvuYOsSbfX2h94OtWfP9O0Z6c9OHZtBwz/O7tTyqPRvLfTHhycO4QkSZIkSZIkSZIkrXQW60nSiLq91geAJ1Tc7YeBwzrtwW+r6Ky/OH9X4H4UK+jdoYo+G+4rwOvnFpZ+lDvIqLq91n0oivbulTvLmJ7RaQ/esbYDur3WnYAfAOtPJ5LG8JJOe/Da3CEkSZIkSZIkSZIkaSWzWE+SRtDttZ4BHFZhl98AXtNpD344aUerFOjtB+w8aX8z4ijgnXMLS0u5g5TV7bU6wAuAO+fOMoKjOu3B/dd2QLfXugnwU2Dr6URSCY/ptAcfyx1CkiRJkiRJkiRJklYqi/UkaR26vVYbqGrltpOBl3fag8VJOukvzt8ceDDwQOC2VQSbAZcBHwfeO7ew9MvcYarS7bUOAl4I7JQ5ypqcBezUaQ8uXtMB3V5rDvgtcOOppVJZd+u0B9/PHUKSJEmSJEmSJEmSViKL9SRpLbq91mbAqcC2E3bVB94AvKHTHlxWqoPF+Y2ABwEPA+4zYZ5ZcgHwPooivTNyh6lDt9faCHgu8Gxgq8xxrm7vTnuw1hUMu73WV1lZ5+QsOw+4Zac9+GvuIJIkSZIkSZIkSZK00lisJ0lr0e21vgHca8JuvgC8sNMe/L5M4/7i/M2ARwGPBHaYMMssuQB4F/COuYWls3OHmYZur7UD8CLgybmzDH2o0x48YW0HdHutlwOvmE4cVeSXwB077cHluYNIkiRJkiRJkiRJ0kpisZ4krUG313oZ8MoJuvgb8LxOe/DJMo37i/P3Ah5PsZreSvIv4D3AYXMLSyty9a9ur3VHinNv34wx/grsuI7tb+8C/GB6kVShd3Xag6flDiFJkiRJkiRJkiRJK4nFepK0Gt1ea0/guxN0cQTw7DJbTfYX5x8GHAzcZYLxZ9X7gTfMLSydnjtIE3R7rccArwW2zzD8Qqc9OHJNf9jtteaAk4AbTC+SKrZfpz34au4QkiRJkiRJkiRJkrRSWKwnSVfT7bW2AH4HbFei+YUURXofHrdhf3H+0cAzgV1KjDvrjgVePLew9MPcQZqm22ttS1Gwt9btaCv27U57cM+1HdDttT4MPHZKeVSPvwM7ddqDC3MHkSRJkiRJkiRJkqSVYP3cASSpgT5OuUK97wFP7LQHvxunUX9x/vEURXq3LDHmrDsDeMHcwtIRuYM0Vac9OAd4YrfX+jzwVuo/TxLwjLUd0O219sNCveVgO+ADwENyB5EkSZIkSZIkSZKklcCV9SRpFd1e64kUW7GO63Wd9uDF4zToL84fBBzKyizSA3gn8KK5haV/5Q4yK7q91obAq4Dn1zjMkZ32YGEtGTYF/ghsU2MGTZfb4UqSJEmSJEmSJEnSFFisJ0lD3V7rhsCpwHpjNDsbeHKnPfjiqA36i/OPAp4D3GasgMvHscChcwtLP88dZFZ1e609gXdRT6Fnu9Me/HgtY3+A6W7Jq/qdBezYaQ8uyR1EkiRJkiRJkiRJkpazcQpSJGm5+xTjXRe/B+w2aqFef3F+3/7i/A8pttldiYV6/6FYSW9PC/Um02kPjgHuBHyo4q5/sI5Cvdthod5ydF3gBblDSJIkSZIkSZIkSdJy58p6kgR0e62nUqxUNqp3ddqDp41yYH9x/tbAy4AHlcm2THwfOGRuYenXuYMsN91e60CKrZu3qKC7hU57cORaxjoWuFsF46h5LgV26rQHf8odRJIkSZIkSZIkSZKWK4v1JK143V7rRsBJwEYjHD4ADu60Bx9Y14H9xfltgFcAT50o4Ox77tzC0ltyh1jOur3WzYCPALtP0M0pwC067cHlaxijAxw1Qf9qvs922oOH5A4hSZIkSZIkSZIkScuV2+BKUlHkNEqh3h+BO41YqHcwcCIru1DvOGA3C/Xq12kPfgfsQbHFclnvW0uh3nrAmyboW7PhwG6vdfvcISRJkiRJkiRJkiRpuVo/dwBJyqnbax0E7DnCoUcDD+20B+eu7aD+4vw88DrgThOHm23vnFtYenruECtJpz24Ajio22v9A3j2mM3/xdoL/R4J7FQ2m2bKq4H75A4hSZIkSZIkSZIkScuR2+BKWrG6vdY1gZOBbdZx6Ls77cEhazugvzi/NfAa4CkVxZtV/wIeM7ew9LncQVaybq91KPDmMZp8uNMePH4NfQXFKpE3ryKbZsIdO+3Bz3KHkCRJkiRJkiRJkqTlxm1wJa1kL2XdhXovHKFQ77HACVio9yNgFwv18uu0B28B9gfOHrHJEWv5swdgod5K85zcASRJkiRJkiRJkiRpOXJlPUkrUrfXuglwErDBGg65BDio0x58dk199BfndwTeBNy/+oQz511zC0tPyx1CV9Xtta4HvA+471oOuxi4fqc9+Mca+vgR0K4hnprrcuCmnfbg9NxBJEmSJEmSJEmSJGk5cWU9SSvVm1lzod6fgLuso1DvKRSr6VmoV2x7a6FeA3Xagz932oP9gFes5bBTgfNX9wfdXmsPLNRbidbHlUIlSZIkSZIkSZIkqXIW60lacbq91q6suchuKWC3Tnvwi9X9YX9x/kb9xfmvA+8BNqwr44w4HbjD3MLSxzLn0Dp02oNXAget4Y+P77QHgzX82cH1JNIMeFS315rLHUKSJEmSJEmSJEmSlhOL9SStRK9dw79/V6c92Hv/9uDs1f1hf3H+scDxwL51BZshSxSFesflDqLRdNqDjwMPAP5ztT86dnXHd3ut7YEDao6l5ro2rhwqSZIkSZIkSZIkSZWyWE/SitLtte7E6ovtntppD1a7levFi3tt1V+c/zTwYWDzOvPNiA/NLSztPbew9I/cQTSeTnvwReDuFEWnAD8HDl/D4Q8ENp5CLDXXw3MHkCRJkiRJkiRJkqTlxGI9SSvNIVf7/38P2LvTHrxndQf3F+f3CeLXwMPqjzYTXja3sPSE3CFUXqc96AFtYC+Kc7+/hkMXppdKDXWPbq+1Q+4QkiRJkiRJkiRJkrRcREopdwZJmopur7Up8Edgm+G/+lbA4/dvD85c3fH9xflXAC+fTrqZ8Ni5haWP5g6h+nV7rZsCJ2NRv+DpnfbgnblDSJIkSZIkSZIkSdJysH7uAJI0RTegKNS7DHh5pz14w+oOuvjIvbaPFJ8A7jHNcA12KbD/3MLSt3IH0dQcgIV6KjwAsFhPkiRJkiRJkiRJkirgjXhJK8kZwMMDbr+mQr3+4vw+keIXWKh3pb8Bu1mot+LcN3cANcZdur3WjXOHkCRJkiRJkiRJkqTlwG1wJWmovzj/AuD1uXM0yO+BfeYWlv6UO4imp9trXY/i734udxY1xhM67cGHcoeQJEmSJEmSJEmSpFnnNriSVrz+4vz6wIeAR+fO0iC/BvaeW1g6N3cQTd3uWKinq9qD4hopSZIkSZIkSZIkSZqA2+BKWtH6i/PXBb6PhXqrOg64m4V6K9YeuQOocXbv9lo+4CFJkiRJkiRJkiRJE7JYT9KK1V+cvzNFYdqdc2dpkJ9RFOpdkDuIsvH3QVe3I3Cb3CEkSZIkSZIkSZIkadZZrCdpReovzj8E6AHb5c7SID8D7j63sHRx7iDKo9tr3QC4Ze4caqQ75Q4gSZIkSZIkSZIkSbPOYj1JK05/cf65wGdy52iYn1OsqNfPHURZ3QqYyx1CjbRL7gCSJEmSJEmSJEmSNOvWzx1Akqapvzj/JuC5uXM0zPEUK+pdkjuIsnOrU63JzrkDSJIkSZIkSZIkSdKsc2U9SStGf3H+/Viod3WnAPNufauhm+UOoMbasdtrbZE7hCRJkiRJkiRJkiTNMov1JK0I/cX5TwNPzJ2jYf5BUah3Xu4gaoydcgdQY20H3DB3CEmSJEmSJEmSJEmaZRbrSVr2+ovzRwIPy52jYS4Gdp9bWDozdxA1Q7fX2hLYIXcONVYAO+YOIUmSJEmSJEmSJEmzzGI9ScvasFDvQblzNNC+cwtLv88dQo2yHbB97hBqtBvlDiBJkiRJkiRJkiRJs8xiPUnLVn9x/pNYqLc6C3MLS9/PHUKNswPQyh1CjXaD3AEkSZIkSZIkSZIkaZZZrCdpWeovzr8DeETuHA106NzC0pG5Q6iRXFVP63K93AEkSZIkSZIkSZIkaZZZrCdp2ekvzr8IeFruHA30/rmFpbfmDqHGumbuAGq87XIHkCRJkiRJkiRJkqRZZrGepGWlvzj/EOC1uXM00PfmFpaenDuEGm3r3AHUeNvkDiBJkiRJkiRJkiRJs8xiPUnLRn9x/g7AZ3LnaKC/AvfNHUKNt0XuAGo8CzolSZIkSZIkSZIkaQIW60laFvqL81sB38qdo6HuPbew9K/cIdR4m+QOoMabyx1AkiRJkiRJkiRJkmaZxXqSlosvAVvlDtFAB80tLP0qdwjNBAuxtC4pdwBJkiRJkiRJkiRJmmUW60maef3F+bcAd82do4E+MLew9PHcITQzNsgdQJIkSZIkSZIkSZKk5cxiPUkzrb84f2/gOblzNNBv5xaWnpQ7hGaKnwkkSZIkSZIkSZIkSaqRN+Ylzaz+4vy2wJG5czRQAu6XO4RmziB3AEmSJEmSJEmSJEmSljOL9STNss8Bm+QO0UCPnVtYOj13CM2cy3IHUONF7gCSJEmSJEmSJEmSNMss1pM0k/qL888D7pY7RwN9YW5h6WO5Q2gm9XMHUOOl3AEkSZIkSZIkSZIkaZZZrCdp5vQX528GvDF3jgb6B/Do3CE0s/6VO4Aa79+5A0iSJEmSJEmSJEnSLLNYT9IsOjJ3gIZ6zNzCkgVXKuuC3AHUeP/MHUCSJEmSJEmSJEmSZpnFepJmSn9x/sXArXPnaKAj5haWvpw7hGbaebkDqPHOyR1AkiRJkiRJkiRJkmaZxXqSZkZ/cf7GwGty52igC4En5g6hmWchltblb7kDSJIkSZIkSZIkSdIsWz93AEkaw6dzB2iox80tLF2UO4Rm3pm5A6jxTs8dQJIkSRpXRGwC7A7cCdgFuCFwfWAzYOPhYVcAFwB/ofjc+1vgJ8D3U0rnTjWw1DARsT2wF3B74ObAjYFtgK256mIAl1L8Hp1L8bDXn4A/AqcAJwInppQum15ySZIkSZKayWI9STOhvzj/WODOuXM00NLcwtLncofQsvBnoA/M5Q6ixjojd4DViYjTgRvkzjFjHpNS+tgoB0bEnsB3x+x/q5TS+WO2kSQBEZHGOT6lFHVlkWZZRGwELAxf9wQ2XEeT9YCthq9bAvcd/vsrIuJ7wOHAp1NKF9eTeGWLiFcAL8+dYx0Sxc4G/6b47vwvihXqzwXOpvhOfcrw9fuU0qWZclYiIjYFHj187TZis42Aaw1fO6/mzwcR8fSU0nuGYxwAfHGMWN2U0gFjHC9JkiRJUiNZrCep8fqL81sAb8udo6EelzuAlo2zgb9SPCEvrU4ji/UkSZKkKw0LjJ4FHEJRMDSp9YA9h683RsRhwFtTSv+uoG/NlgC2GL7W5bKIOB74KfBD4OsppQtqzFaZiFgPeDLwKuCaFXffoli9UpIkSZKkFW29dR8iSdm9hdEmQ1eaN84tLJ2eO4SWh057cDFuhas1u5xihQhJkiSpkSLiIOAPFEVGVRTqXd1WwCuBP0TEA2voX8vHhsAdKYpGPwOcExHfiIgnRMRmeaOt2XC72+8C76b6Qr0r/bamfiVJUoWi8MiIuEbuLJIkLUcW60lqtP7i/C7A43PnaKBzgJfmDqFl56TcAdRYZ+HKepIkSWqgiLhWRHwZ+Chw7SkMuT3wuYj4cETMTWE8zb4NgHsBHwD+EhGHRcR1Mme6ioi4NfBz4G41DtMHTquxf0mSVIGIuBVwDPAJiocQJElSxSzWk9R078sdoKGePrew9J/cIbTsnJA7gBrr5E570M8dQpIkSVpVRNyGosBovwzDPxY4OiK2zTC2ZtemwDOAUyPidU1YrSYibgosAXUXEJ6YUrqi5jEkSVJJEbFZRLwZ+CX1FvBLkrTiWawnqbH6i/MPAO6UO0cDHTe3sHRE7hBaln6VO4Aa69e5A0iSJEmrioh54IfADhlj7A4sWbCnEjYGXgicEBF3zRUiIjYFvgxsM4Xh3AJXkqSGiogHAycDhwLrZ44jSdKyZ7GepCZ7Z+4ADfW03AG0bJ0E/DN3CDWShZySJElqjGGh3lcoVinL7VbANyNis9xBNJNuCBwTEc/KNP6bgZtNaSyL9SRJapiIuFlEfBtYpP5VdiVJ0pDFepIaqb84/3T8YrA6X55bWOrlDqHlqdMenIsrqOl/XQ78LHcISZIkCSAidgaOAuYyR1nV7YCPRETkDqKZ1ALeFhHvnOY5FBG3Bp40rfGwWE+SpMaIiGtExGsp7gfcI3ceSZJWGov1JDVOf3F+Y+BVuXM01KG5A2jZ+3HuAGqcEzvtwe9zh5AkSZIiYkugCzRxFbsHAQfnDqGZdghw2BTHexEwzQJTi/UkSWqAiNgfOJHis8CGmeNIkrQiWawnqYleBGyRO0QDfWRuYcmCGdXt2NwB1Djfyx1AkiRJGjoM2DF3iLV4fUTskDuEZtrTp7ElbkRsDjyw7nFWcUFK6c9THE+SJK1GRHyG4uGXG+TOIknSSrZ+7gCStKr+4vyWwPNy52igK4AX5w6hFaEHnANsmzuIGmMpdwBJkiQpIvYFHj1BF5cDXwO+ChwHnAlcRvEw83WAXYB7AQ8ArlFyjM2AVwMHTZBTenNEHJdSqvPBqXsAG0zQ/ifAt4CfA78DLgT6FCv1bQFsSjGvcCPgxsBgkrCSJKky7dwBJEmSxXqSmufFwEa5QzTQu+cWlv6WO4SWv057cEG31zqWYgsn6Xyav9ribci7WvRXgLuM2eZ+wA9qyDKqizOOLUmSNLaICOD1E3TxfuBVKaW/rOHP/0mxReenIuIZFCv+PxNolRjrERHx6pTSqaWSalQvAt475THnKIrQNgW2Aq4FXA+4IXA7YFdg4wrGaVGci7dKKV1YQX+rc7eS7X4DPCml1FvLMeet8s/fLTmOJEmSJEnLlsV6khqjvzi/LfC03Dka6HLglblDaEX5JhbrqbDUaQ/+mTvE2tR482okEXF5iWb/SimdX3UWSdKysFXuAFJDPYBi5btx/RM4MKV09KgNUkr/BA6NiM8DR1EUZI2jBTwBeMGY7TSefobP1GsdLyI2BfYHDmHyVWt2AF4DPH3CftbkliXa9IB9Ukr/rjqMJEmSJEkrSc5VSCTp6g7FVfVW571zC0v/yB1CK8rXgUtyh1AjdHMHkCRpJUkpnT/OK3deaYqeWKLNucCe4xTqrWq4cthdgLNLNH/EcDVArSAppX+llA5PKe0O7AecPmGXB0dEmaK6UdxizOP/AzzCQj1JkiRJkiZnsZ6kRugvzm8OHJw7RwMNgFfnDqGVpdMenAWUuqGlZeUCii1eJUmSpGwiYntgnzGbXQE8KKX0m0nGTimdAjwYSGM2vS7lVi7TMpFS+ipwG4rVGctqAa+tJND/2m7M4xdTSqfVkkSSJEmSpBXGYj1JTfEMYNPcIRrog3MLS+fkDqEV6eO5Ayi7LzR9C1xJkiStCPsA465S956U0rFVDJ5S+h7w4RJN717F+JpdKaWLKLZwft8E3XSqXl0vIrYG1h+z2ReqzCBJkiRJ0kpmsZ6k7PqL8xsBz86do4ES8PrcIbRifRn4S+4QyuqjuQNIkiRJjF/0djnVf5d+HeOvrnerijNoBqWUEsVOEkdO0M0zKopzpc1LtDmu4gySJEmSJK1YFutJaoKDgC0zZ2iiz8wtLP0pdwitTJ324FLg07lzKJtfd9qD7+cOIUmSJDF+0dt3U0qVPniUUvoj8OMxm92kygyaXcOCvccCvyvZxUMiYpMKI2055vEXppTOqHB8SZIkSZJWNIv1JDXBobkDNNSbcgfQivcRxl89QsuDq+pJkiSpKW485vE/qCUFjPswyza1pNBMSin9i6Jgr8x37M2A/apNNJa/ZhxbkiRJkqRlx2I9SVn1F+fvDeyYO0cDHTO3sPSr3CG0snXag5OBL+XOoam7EPhY7hCSJEnS0DXHPP7MWlLAKWMeX+VKaFoGUko/Ag4v2Xz/KrOM6V8Zx5YkSZIkadmxWE9Sbs/LHaCh3pw7gDT0htwBNHXv77QH5+cOIUmSJEXENYAYs1m/jizAP8Y8/rJaUmjWvaZku70rTTEei/UkSZIkSaqQxXqSsukvzt8c2DN3jgb649zC0tdyh5AAOu3Bj4Fv5c6hqbkEeHvuEJIkSRJASuniEs22qzxIYdyV8uoqGtQMSymdDBxToul2EXHTiuNIkiRJkqQMLNaTlNMhuQM01PtzB5Cu5lW5A2hqPtBpD/6aO4QkSZK0ivPHPP4OdYQArjXm8afXEULLwmdLtrt9pSkkSZIkSVIWFutJyqK/OL8Z8MjcORrocuAjuUNIq+q0Bz8Ejs6dQ7W7BHhT7hCSJEnS1Zw+5vH3jYgNa8ixy5jH/66GDFoeyn6/vnmlKSRJkiRJUhYW60nK5cHA5rlDNFB3bmHpnNwhpNV4ce4Aqt07Ou3BWblDSJIkSVfzqzGP3wo4sMoAERHA3cZs9pMqM2j5SCmdApxboulNqs4iSZIkSZKmz2I9Sbk8IXeAhnpn7gDS6nTag58CR+TOodqcC7w2dwhJkiRpNXol2rwsItavMMOewPXHOP4y4NgKx9fyc0KJNuNuxSxJkiRJkhqoykkrSRpJf3H+1sCdc+dooFPmFpaczFeTPRu4P7BR7iCq3HM67cGFuUNo5YqIDYDdgTZwC2Bn4DrAZsPXlf4NnAP8GTiNYqWdnwM/SSldOs3M0xIR2wF7ALeiWE3lxsB1gS2BOeDKbf76w9c/KbYLPAX4A/BT4KcppcummTuXiNgCeAAwD9yB4md15Tl0KfA3inPnBIrij2NSSn/JEBX4v7y3B24N7DB8XR+4NkXu9YEtVmlyBXARcDnF3/Vfhq8zKf7OjwN+k1L6z5T+E7KLiJtS/H3fEbgZcCNgG/77uwHFteNvFD+r3wG/AX4E/DKlNJhq4BXCa5cq9tUSbXYEngO8saIMzx7z+G+nlC6qaGwtT2VWNb9m5SlUGd/71i4iWsDtKL7z3ZJiW+ftge246ufdf1F83v0LcCJwMvADoLeSPuOuynNLk/D8mVxE7AjcheIathPFd84tgE347+5R/wEuppizOh34PcU17FjghJRSmm7qlWvW5oU0ueFnjDtQXOtuRzE3dD1gW666cNX5wNkUf/8nAz8GvpdS+uuUcm5IcS25C7ArxfVke2DrVQ67FLiQ4rvCGcCvKea+v59SOm8aOSVNT/j5QNK09RfnDwOekTtHAz17bmHp7blDSGvT7bWeARyWO4cq9YNOe7BH7hCzKiKOAe4+ZrO9UkrHVJ+mehGxJ/DdMZttlVI6f4S+NwT2Bx4G3IOrFuWNqw98B1gEvpBS+vcEfWUVEetRbLN3ILA3cNMKur2UYgLqi8ARKaW/V9DnxCLiAIpMo+imlA5YS1/XAV4GHMT4ReW/AI4EPplSqnU78IjYHrgXxTl/B4qJuah4mMuA44FvA0ellH5ecf8jG/MackFKacsR+90GeCzF3/ctSkS70oXA1ymuHV9pwg2oiBhrkialVPX5U8pKunYpj4j4GcV1cxyXAndIKf12wrH3pbhWjOP+KaWjJhl3JYmIVwAvH7PZs1JKh1WfZjoi4jDGnxv7VUppl7X0eQzjfzep0ytTSq9Y0x+O+VkQ1vF5cNp871u3iNgYOGD4ug+Tfee7CDga+AjwtZTSFSOM/wpGv7b8v5TSM0unq9ByP7ci4mPAo3ONP0UjzY1UbbmfP6uKiF2AX454+BkppRuO0XcbeDjFvNUOY4e7qnOBbwGfAr5V5wNjDfn9ulFK6fRRDpzVeaGIOAj46Bj9r/Uz3DSM+ftypYmvY2OOe2xKac8x+r4jxdzQAyke2iwjURQlfwL4VEqp8gUNImIvipz7898C33FdTvHwwieBz6SU+hXFk5SR2+BKmqr+4vz6wENy52igS4CP5w4hrUunPfh/FKv2aPl4Yu4AWlkiYtOIeAHF04FHUqzYOclNGyieBt+PYmLlLxHxtmFR1MyIiB0i4g0UK6R9F3gy1UyqQzFJeXeKYuu/RMQ3I2K/4ST+zIuIp1E89f8kyq3+uivweuCMiPjCcFK+ynybR8RTIuL7FE/GfpRi0v9mVF+oB8XKCHcEXgz8LCJOjoinRsQmNYw1VRGxSUS8hmKlgjcyWaEeFJOkBwKfB/4UEa+MiC0n7HNF8dqlKXp/iTYbAZ+NiE3LDhoR1wQ+MGazU4GvlB1TWotGFGivdL73rVtEbB8Rb6RYEf0zFJ+3Jv3OtxnFd8cvA6dGxLMiYm7CPhvFc0uT8PyZXESsHxGPjojfUqzE/lQmL9SDoojoYcDXgLMi4hV+76xW0+eFVK2I2Gs4x/YTir/zsoV6UHy+vhPwbop5oZcOHzaYWETcLyKOA5aAR1C+UA+KnTf2BD5McR154XL7HCStRMvqg5SkmXBPiu0NdFWfmVtY+mfuENKIDsodQJV5Zac9OCl3CK0MUTiIYhuV11Ns81mHzYFnAadFxKsj4ho1jVOJiLjB8MnnPwLPp9j+t07rUXwe+zLw64jYv+bxahMRrYj4CPAOioLNSbUobgB+IyIm3vI9Iq4fEe8E/gq8B7greW6y3wx4F/DniHjJrE7mDZ9EPomiCLGOwsPtKJ7CP334c6pkcna58tqlDD5DsW3RuHYGPj3cGmksUWyh9TXGv0n78pTS5eOOJ43A8yoj3/vWbfiQypsptpd7HvVt3XxD4G3AKRFxYE1jTI3nlibh+VONiNiPYlvUj1Fs1V2X7ShW/PR7ZwWaPi+kakXE9SLiKIrit7vWMMQWwKuA305SsBkRN4mIo4EvURSCVm0r4HXASRHRpFW1JY3JYj1J0/aI3AEa6h25A0ij6rQHv6WY/NFsO77THrwidwitDBGxA8WWnB+lviK9q9sYeAnwq+G2CI0SERtFxCuBkym2KBm7iKACtwS6EfHtiKjqifupiIigWEnxMTV0/9mU0qVlG0fEVhHxDoqnug8BmlIwuiXwaorJvPtnzjKyYaHviym2PatiVYN12YLi5/SbKLbx1Sq8dimX4Rb3bynZfH/g7eM0iGKF3mMoViodxw+Bw8dso5WpzIqPF1WeQuvke99ootjK8CTgUIrvYtNwHeCIiDgqIiZZVScLzy1NwvOnGsPv70dQFB/uNMWhV/3eeacpjrtsNHleSNWLiIcBJwKdKQx3E+B7EfGkcRtGxOOBX1NsQ163GwBLEfHSKYwlqQYW60mamv7i/CZM54PUrPnB3MLS8blDSOPotAdvAo7NnUOlXQ48NHcIrQwRcQ/gl0xnkmJ1dgR+EBGPzTT+/4iI2wO/oljFqwlPUd+DoqjxqbmDjOGNFNvI1OGTZRtGxAMobpY8DdigskTVugHwhYh4X0RsmDvM2gxXwvoI8BqmP3+xI/CdiHhtmRW5liOvXWqAt1OsVlrG04aFv+sUEXcFfgHsMuYYfeDxKaU0ZjutTGUeYPlX5Sm0Vr73rVtEzEXE+4EvUv+KXmvSAX4REbtlGn9snluahOdPNSJiV+B4iq26c9kR+H5EPCVjhlnVyHkhVSuK7anfDXwa2GyKQ68PvC8iXjDKwRGxYUR8APgg031odz3gVRHxrmEBq6QZYrGepGnaj+asLNIkb8sdQCrpwcCFuUOolCd22oOTc4fQ8hcRTwS+SX3bH41qA+DDo06w1Gk4ef0jiq1Jm2QOeFdEHBHN3zr4gcBza+r+j8APxm0UERtExHuAzwPXqjxVPZ4EfL2pf9/DArlPAAdljLEe8CLgyxExzUnhxvHapSZIKV0MTPJe/pq1Fe8PV6h5A8VDSWUKqZ6ZUvIztkZ1oxJtTq86hNbM9751i4hrU6xC+sScOYZ2AI4dbmXZaJ5bmoTnTzUi4r4U3/2vnzsLxZzVe5owZzUrmjgvpOoNryVfAg7OGOP16yqmXSXnE6YTabWeSrGFr6QZYrGepGl6cO4ADXTa3MLSF3OHkMrotAfnkPfJQ5XzgU578NHcIbT8DScZ30+zvnO8PiKyTJxERCsi3gu8C2jyamYHUmz1sG3uIKsTETcDPlbjEJ8cd0Wk4aTcV4FZfBJ+Hji8oU/fvo/6npIf170pVtlr5O9Fnbx2qWlSSp8AvjZBFx8c3py9iuHKKj8Bnk+5zy7vTyl9YIJcWkEiYhPKFVn8seos+l++940mInak2Pp73O3C6zRHsYL0Q3IHWR3PLU3C86c6EbE/xWqgc7mzXM3rm7QrRFM1cV5I1YuIOeArFPMxuf2/iGiv7g9WyXmv6UZarZcMC1klzYgm3TiTtIz1F+c3BfbNnaOB3po7gDSJTnvwDeDVuXNoZD/utAdPyh1Cy19EPAN4fe4ca/DuiJjqDaXhVqNHAk+e5rgTuD3ww4i4Xu4gqxqutPZpYNMahxlrq5OI2JhiUm6feuJMRQc4JHeIVUXE84DH585xNbsBSxGxRe4g0+K1Sw32ROCCkm3XA46MiN0BImLr4cqoPwNuW7LPL1Nsfy6NajegzBbrv686iK7K977RRMQNKVbUu/E0xx3RBsAnVleYnZPnlibh+VOdiJgHPkdxrWii90TEzrlDNFUT54VUvYhYj+Lvea/cWYau/GxxlQLf4fn4GZqTE4p579w73EgakcV6kqZlHtgkd4iGuQBwdSvNvE578DKKQgU12z+AB+UOoRVhATgsd4i12AD4ZERsNI3BImJ9iong+09jvArdFDgmIpq0peuzKSb96/KjlNIpY7b5CM2alCvrTRFRZju+yg1vnjS12PdWwOeHN8uWNa9darKU0llMthXSHMX21i+kKH56CuXnSL8DLKSU/jNBHq089yvZ7ieVptBV+N43mojYkmKF0+tOY7ySNgAWgdvlDgKeWyvU+cClVXTk+VOdiLgp8HmaW6gHsBHwgYauft8ETZwXUvVeTfOueTtSnH+rejPFA7BNsh3w0twhJI3GYj1J03Kf3AEa6B1zC0v93CGkijwY+HnuEFqjy4F7d9qDs3IH0YrwrtwBRrAT8MwpjfUByt+Qze0mwFeG27zmtiP1r+T6iXEOjognAQ+tKcu0bQy8PHeIiNgG+BTNnqvYm5WxOrbXLjVaSulw4P0TdLE18DpgklUHvgDcJ6V0yQR9aIUZFl2U2aLztJTS2VXn0VX43rcOw5VuPgvcos5xKnINYP/cIYY8t1aW/wAHpJSqmvf3/KnGRhSrE26ZOcco7sLymWuoUuPmhVS9iNgHeGHuHGvw3Ct3W4iIhwDPypxnTZ4UEdvnDiFp3dbPHUDSijHLW4PV4RKKpy6kZaHTHlzS7bX2pXjS/ya58+h/3L/THvwsdwitGOM+oXwZsAT0gOOAPwLnAVdObG8N7ECxNd1dgXsBm1eQ87kR8a6U0r8r6Gu1IuI5wGMq6u4CitV7fgb8FjgdOIf/Pq0/B2xFcQ2+OcXk7t2ZfCJ6N4qbA4+YsJ9J3XLE466gWO316xTn1N8pPndtCtyM4udyf2CXq7W7jOLG40gi4vpUV7D1G4r3z18DpwFnUayGetHVjtsU2H742oniv6FNdduPPTIiXp1SOrWi/sp4B8V/3zgGwA+AbwDHA6cA/6Q4F64BXJtiRbzdgXsD168g5yER8Z2U0lEV9NU4Xrs0Q55B8Xe9a4ax3wY8L6U0yDC2ZtuBwHVKtPtu1UH0X773jewFwD0r6us3wNEUn4N/R/G5/crvgFsCN6AoCtyDYl5524rGnSrPrUa6ALhw+L/nA3+j+Dn+FTgT+BNFMf8nKB5qGtfjUkrHVhHU86dS1x6+xnUu8G2K+YWTKM6Pc4AEbAhsQVFEtgtwD2BPqnn47CURcURK6YoK+louGjUvpFpsDnwYGGdlycsprm0/oFhM4nSKeeVLKX4Xr0PxO7o7RRH/zSbItwXw+Ij4AvDBMdueBnyT4pz8PcX7zcXDP9ucYu57V4p573sxWQ3PxhSrx79sgj4kTUGklHJnkLTM9Rfnb01x8zGXiym+dJ9H8SXqiuFrQPEh/covpBsOX+sN//caFEsG1zEZ9Ma5haUX1NCvlFW319qBYqLVJ3ea46BOe/Dx3CGWq4g4hmLychx7pZSOqT5N9SJiT+q7MfgzihVxPpdSumCMTBtRrEbyIoqCpUk8IaX0oQn7WK2IuCtwLJNN0l4OdCl+TseMu8VeRGxAcTPt8RTbMkyyjcoTU0rjTkStVUQcAHyxwi4PB16cUjp9hLHvCLyY/6628bmU0oNHHSgijmSyrcVPovh7/WxK6W8T9ENE7DTM8kSKm5qTeHVKqbLJvJqvIedTFPe9L6X01xHzBDBPUeAz6eoU5wC3SCn9Y8J+riIixpqkSSlVuj2S1y7NmuEW3j+nKO6fhouBg1NKfr6uUES8gvFXeH1WSumw6tPUZ/g59rcUNwzHde+U0jfW0f+mjHZj79bA98YY+4fAfmMcf6VL1rbyZInPgt2U0gElcqyV732jiYjbUDxcNcnN48sobm6/P6X0mzHGblHs2vJUihvYdfh/KaVnVtmh59YaM12DYu59alJK5496bETcgKKYoszc5itSSq8s0W51OTx/1iEidgF+WWWfQwPgKOC9FD+3kR/OGG77ezDFbg5bTJijk1L60jgNRvz9+jVFYdCobkhR7DmqC0ctMpzVeaGIOAj46Bi5fpVS2mWM4ytX8vdlq3GunxWOO4pTgcMo5tXOGSPPvYA3UjwUXsZJFA/Y3nWEYwfAZyg+Y4y8K1VEbAs8n+JzT5micYAzgBtb8Cs1m8V6kmrXX5x/MsUXmzr9nWKC/nsUTyjMURTnXbkyyV/nFpbG+jIK0F+c35biSYtrUXwp2ZXiSYxtgBtRPI0zrgFwm7mFpRNLtJUar9tr7UzxuzjJllKqxsGd9qDu6++KZrFeKb+lWInm65N0Mpw0fj7wCqBVspvvp5TuNkmO1YmIzShWipikcOpw4OUppVMqyrQz8CbgviW7+Ddwq1EmPMfIdADVTMpeADwypfTlEhn2prhh+IxR20fEbsBPxx1r6Bzg2cDhVU+YDW9iPgp4LeWL5v+UUpq04G/VTHtST7Heu4GXpZT+WbaD4c2v9zH60/mr85GU0uMmaP8/chbree3SrBpea77F+Kv7juu3wENSSifUPM6Ks4KK9V5BuW3nLwSulVK6dJ1HjpZjF8a7aXpsSmnPKsa+Wo4DyFys53vfyJnWo3gw8w4TdPM54DkppT9NmGUP4J2Uv8m+JpUW63luzaaI2IqiQLnMVs+fBB6dKrjp6vkzcqZdqL4I6EvAC1JKJ03SyfBceifw8Am6GeuhwlFFxOmMd25NXLC1liwHMJvzQgdhsV6d467NBRRFlu9PKV1eMtMGwNspiuHqcjTwtJTSyWU7GF53P0uxW0QZd04p/aTs+JLq5za4kqbhzhX3dylwAsUX1jOAXwHfm1tYOrficZhbWDqH4qbq/+gvzt8QuC7Fqj53BHamWDp7XVvznUWxrL60LHXagxO7vda9KLYI2Cp3nhXsqRbqqWEGFIV1byg7mbKq4RPhr4mIn1A8KT5Xopu7RMQ2KaWqP0O8mvKT6mcAj00pLVWYh5TSicB+EfFgii1othyzi00oCqTKTszX5R8UBbAjr8yxqpTSd4arhIxz87vs6sg/B/YfdRW4cQ2f9v9oRBxFMWncKdHN9SPi5pNMJtbsb8CjUkrfnrSjlNIPIuIOFDecnlaym8dExP9LKeVcRbxKXrs0k1JKx0TEU4BaVsul+AzzRuBVVRVLaeWJiL2Al5Zs/jHPvdpM+t73uJTSdyrM09T3vkdRvlDvXxQ/p8UqgqSUvj98eOZlwEuq6LMmnlszZrj6aZdyhXrHAI+volBvyPNn+v4JPDmldGQVnaWUzgMeERFLFA+JlXmoZP+I2DyldGEVmZaxHPNCyuPHwEJK6cxJOhnOKR8yfBjhKZUk+68rgOcBb5v0PSGldGJE3IliW+e9SnRxD4qHLSQ11CTLJ0vSqG5dQR9nUHxZfhGwL8WWB4+dW1h6+dzC0hfqKNRbl7mFpdPnFpZ+OLew9NG5haWnzC0s3Z1iZY77Udz0W6LYIufqfgpcNMWo0tR12oPjKL4MWJiaxxM77cF7coeQVvFPYO+U0muqKNRb1bBo5/4UkyHjWg/Ys8o8EXEryhf+fBvYtepil1UNJ553A8qs8HufiNi34kiTGAD3Lzshe6WU0r9G3Q5ouCXS/UsM80vgHnUV6q1qeFPg/oz3lPeq7lFhnCqdRPFU8MSFeldKKV2SUno6xeRsmWtIUKxkOPO8dmnWpZQ+DLy5hq5/CtwxpfRii6VU1rCw6CjKzcUn4F2VBhJQ2XtfpcUwq2rKe19EzFEUDpVxBrB7VYV6V0op/Sel9FKKz7z9KvuugufW7ImIAD4B7FGi+cnAA1JKl1WUxfNn+n4F3L6qQr1VpZQ+QlHwXMaGQOW7QSwzU58XUjZfBu4+aaHe1TyDYlGYqvQpHtJ9a1XF2ymli4EHUHymGteeVWSQVB+L9STVqr84vw3F9rHjugL4NcVTRwdSPDVw/7mFpdfPLSwdM7ewdO7cwlKlW4dVYW5h6c9zC0tfmVtYev7cwtLeFKvuPZRiyfPvUmz58Nq5haVKCxWkJuq0B78AdgeOzxxlJbkCeHCnPfhg7iDSKs4F9kwpHVvXACmlb1L+BtLuVWahWHmnzPesw4F7T7Kt56iG2+DsCRxXovnrhzcymuBNKaXvT3nMx1IUaI3jnxSTxxfUkGe1hpOCT6bcpOPtK45ThV9T3OgtMzm5Timl91HcQCnz/WK/iKji4aTcvHZppkXEnSlWuq/K34EnAe2U0i8q7FcrTETcC/gm696FYU26KaU/VBhJ/+V732geDVyvRLuzKB5WqfIm+FWklI4C9qN5BXueW7PnzcBCiXbnAPcZPjBVFc+f6fopRQHQ6XUNkFI6gmJxhzLmq8yyDOWYF9L0fQd4UFVF0VcaFmg+vaLurgAenFL6akX9/Z/hVsSPL9F0l2qTSKqa2+BKqtu1ga3HOP7HFEVt3wN+Obew9PdaUk3J3MLSWcARw5e04nTag9O7vdZdKX4H9sudZ5n7B3D/TnvgBIWa5DKgU+cNmlW8nuJG0g3HbHe7qgJExK7AfUo0PYpia89BVVnWJaV0TkTsA/SAm43RdBeK/8bKJ5/G9HeKv/NpO7BEm2fXVWS2NimlyyLiUIoCgXHsWEeeCZxMcaP3/DoHSSl9OiKuBbytRPNnA4+pONLUeO3SLBuev6+jWH2/Kj+guNn9rwr71AoTEZtRbHv7HMo/MD8AXlhZKP0f3/tGM9we7tASTc8H5ocFPbVKKS1FxP7A12nA/S7PrdkTEU+nuFaPqw/cL6X0xwqzeP5M1zkUq2BN48G6V1A8IHbtMdvtVn2UZSPXvJCm6yzgwKoL9a6UUjomIo5j8gdXX1hHod6VUkpHR8QPgbuM0WybiNgupTTT99ml5cyV9STV7fojHDMAvkTx9FpnbmHpRXMLS9+Y9UI9SYVOe/DvTntwP+DtubMsY8cBu1mopwZ6UUrpR9MYaLg1XZknlXeuMMbzSrT5DfDwaU6qX2mV7VIvGbNpVU+dTuIdKaWLpjlgROzMeDchAH5OsZ1SLt8Gxl2NZ9ybB3X6F8WqhOdMY7CU0tuBz5RoemBEbFF1niny2qWZExE7RMQnKa6zVRbqQbHqrjdGVUpEbDEslj8ZeC6Tzb9/IKV0cjXJdDW+941mX+AmY7ZJwMNSSr+fcOzRB0zpaIqHJ5rAc2uGRMQDKDdfmYBHppR+UnEkz5/pevy0ilhSSn3KzVntVHWWZWTq80LK4skppX/UPMZHJ2z/U+CtVQRZhzLzizeuPIWkymR/0kjSsneHtfzZnyhuIH4JWJpbWKrlqfX+4vzmFKvs3ADYHrgWcE1gE2AjimthAJcDlwL/Bs6jeLLqr8DpwGlzC0tT27pMWo467cGzu73W74H3MP4WglqzTwOP67QHl+YOIl3Nr4DDpjzm4RSrYm08RptrRcSmk66eExHXBh44ZrPLKG5kXTzJ2JNIKZ0UES+n2GpnVPtExPVTSn+qK9c6XAF8PMO4+5Ro84rhlrRZpJRSRHyJ8VaK2KauPCU8IUORwpOBvRivaHEOeBjw3loS1chrl2ZNRGwAPAt4OXCNmoZZD1iMiF1TSmfWNIaWkeHKrPPAARQrym9SQbdnAi+qoB9dje99Y3liiTYfSCl9veR4paWU3hkR9wbuPe2xr+S5NVsiYnfgU5Qrqn5uSunzFefx/JmuY1NKX5rymJ8E3sJ459y1ImKj4QOq+q9c80KarmNSSl+ZwjhfAd41QfvnT6lgetydMwCuW3kKSZWxWE9S3U5dzb87BjgaWKLY6nbcJ69Wq784vzHFSn63AG5FUaB3k+H/bgtsWrLri4Fz+ovzZ1AU7p0BnEjx1NoZdRUZSstRpz14X7fXOhH4AOOvTqSrSsCzO+3BYbmDSGvw0mk/2Z1SuiAivgXsP2bT61O8t0/ikYz//eptKaXfTjhuFd4JPA243ojHB3AQ8Kq6Aq3DD1NKZ2UYd68xj/8DxXZcufXGPH7LOkKU8I2U0hHTHjSldOFwRaRPjdn0wcxgsR5euzRDIuIOwMeAW05huG2AL0TEHimlSuYsNHsiYmP++xDIlsPXthQF3Tel+E57u+E/V+0xdW8Bv4L53jdKw4itgfuO2exc4AXjjlWhp1B8r6urmHtdPLdmRETsRLGAwFyJ5u9NKdWxgpLnz3RNfeyU0rkR8WOKVZzHcU3gLzVEmmW55oU0Xa+ZxiAppTMi4kxghxLNf5JSOqbiSKs1zHkesNUYza5VVx5Jk7NYT1LdDqconnsA8DuKifXvAxcCg7mFpdIrjfQX5zekmKS/K8UWNbsCO1Ksllela1CsyncD4G6r/PvLgdP6i/O/An4JfA/4lcV70tp12oPvdXutO1GsuHVQ3jQz67fAUzrtwQ9yB5HW4FSKpxJz+C7jF+ttz+TFeg8d8/gLGO/J89qklPoR8S7gDWM0ezj5Jta/M+0BI2I9rvo5cBQfTyldUUeeMY29Ml1ERM4VAYEBebdG+gzwEuDmY7S5e0RcK6V0dk2Z6uK1S40XEesDL6b4vZzmXOYdgHcDj5vimBrd2yOizNaFs+B1KaWpf95ZQXzvG839Gf+a+9acRabDm9jvI9+WuJ5bM2C4Guo3KAqgxvV1iqK0Onj+TM+pKaWlTGP3GL9Ybxss1rs6Pyctf6dRLPgyLb+gXLHepFvojuskxruGbFZXEEmTs1hPUq2GxXgv6S/Ov2puYemySfvrL85fE9gTuBdFkd4tJu1zAusDOw1fDx7+u1P7i/Pfp9je93tzC0t/zhVOarJOe3AB8Jhur/Vt4O34hM843g68oNMeTHxNlWr0qYyFPr8o0WbbSQaMiO0pVlUZx8catlrKR4HXMfp2LDtFxA1TSqfXF2mNckzKJooHQ25N8bDIrYavm7PmB0U+O51o6/S3Em22AM6vOMc4PptS+kOuwVNKV0TEW4APjdFsPWBf4BP1pKqe1y7NguF5+llgj0wRHhsRP00pvT/T+Fp5jqIoTFUNfO8bywFjHn8RzVhl+C3AU6n+Ye618tyaDRFxDeCrwI1KND8eWKhjBwHPn6n7dIYxr/SbEm02rzzF7LNYb/n7zJTnlsvMQV0BfK7qIOtwBuMV65VZQVbSlIz6oUmSJjJJoV5/cX6j/uJ8p784/0ngBIoPP08gb6HemtyEYqWwTwO/7S/OH9VfnH9Yf3HeL1TSanTag8MpJqM+mTvLDPgxsEenPXi2hXqaAV/KOHaZLWA2Xvcha3WvEm0+OOGYlRquBnbsmM32rSPLOvQprodTlQqnp5S+nFJ6Q0rpESmlXYBNKD6TPhB4JcXn1JOBE1JKp0w75xpckDtACU1YIeJw4N9jttmnjiA18tqlRouIu1CsYp+rUO9K74yIO2fOoJXhp8AjMq9uu9z53jeCiNgImB9zjCNTStk/d6aU/gp0MwztudVwEdECFilWzh3Xn4H9Ukp17ajj+TNdX880LhSrYo1rw8pTzLYs80Kaum9NebwzS7T5ZUrpH5UnWbtxx/P6ITWYxXqSGqu/OH+r/uL8GygK9I4CHgFslzXUeLYAOhSFeyf2F+ff2V+cv0vmTFLjdNqDv3Tag0cB+wHH5c7TQBcAz+m0B223vdWMuBj4Va7BU0r/pJi4G8ekTxnee8zjT0spnTDhmHUYdyKszA2FSZ2YUro8w7irlVIapJROTil9IaX0ipTSg1NKt6BYga8RSv68ck7mHZ9S+nXG8YFiKyfGLzzeq44sNfLapcaKiAcBRzP5HMDZwKOBhQn62AD4fERce8Is0tr8ALhnSmncQnGNx/e+0bSBa4zZ5vAxj69TjgdCPbea793AfUu0uwi4X0rprIrzrMrzZ3r+Dfw8w7hXKrPyvQtBXFWj5oVUiwHwkymPeW6JNuMWKFfh7DGPH/fznKQpslhPUuP0F+fn+4vzR1AsLf98itXqZt11gUOAH/QX55f6i/MP6S/OR+5QUpN02oOvAncCngX8PXOcJkjAh4HbdtqDt+UOI43hl3VsCzOmv455/KRbJI1bjP/tCceryzFjHn/HOkKsQ7ZC0HE0aUWc4coo48o5mdekG71HjXn8dSPiunUEqYnXLjVSRDyFYuWbSVa+TcB7gJ1SSp9IKR0JvH6C/q4DfDYiNpigD2lNPgzs3YRVyVYA3/tGM872alAUM+W4Yb0m36J4iGyaPLcaLCJeBDypRNMrKLa+Pb7aRP/D82d6fp650GvcQhv9r5mYF9JEfpdSunTKY5b53FBmW+tJXZRhTEk1sVhPUmP0F+fv31+c/xbwHeBAoJU5Ul32Aj4D/LS/OP/o/uK812JpqNMeDDrtwWHALYHXMf6y3svFZ4F2pz14fKc9OCN3GGlMP8sdgPEnLkoXJkXEthRF+eNo6iqiv6G4GTGq60TENnWFWYMcE2GzbtKVI6fty7kDrOJ7JdrsVnmKGnjtmvq1SyMaFuq9B5jk4bbfAXuklJ56teKnlwLfmKDfuwFvKds4Il4cEV+JiJdExD0jYssJsmh5OBt4SErp8Smly3KHWe587xvrva89Zp7vNWmVo+Hv0/enNZ7nVrM/V0XEI4HXlmx+cEppks8O6+T5M/Xzp8w2tJVJKV0C1LWd8krhvNDyl2O3hTKfY06uPIWkFcUCEUnZ9Rfn79NfnP8u8AVgn9x5pugOwMeAn/UX5x+ZOYvUKJ324B+d9uDFwC7Aq4Az8yaams8Cd+m0Bw/ptAellnrv9lrXrziTNK7TcwegWE1nHJNs+blLiTZZJ4fXZLjt2rgFwrvUEGVtTpnyeDMpIjaNiAMi4kPAibnzjOHvKaXGTHamlP4G/H7MZresI0sNdinRxmuXahURD6Yo1JvEu4FdU0o/vPofDFf+fRjwhwn6f3pEPKJk2/tTbL/3auCbwHkRcXJEfDwiDo6I3Vy5b8W4BHgrcIuU0mdzh1lBdinRZqW+991mzL7/55rbAMdMcaxdSrRZqefWVEXEPShWLy3jTSml91eZZw12KdHG86e8Jvzsxt2NYrNaUswu54WWvxzzWGWKaP9UeYp162cYU1JNLNaTlE1/cf72/cX5LwFfBfbMHCenXYFP9Bfnf9BfnN87dxipSTrtwZ877cHLKSaKnwb8InOkOvyd4qbk7YdFej8atWG314pV/vme3V7rGODX3V6r2+21tq48qTSas3IHAKa5hdi4N7Kg2QXIp495fJn//kmMu8XxihAR14mIB0XEmyPiBxQr034ReBywfd50Yymzkl3dxn2i+xa1pKie1y41SkS0gU9M0MV5wP4ppUNSSmvcwiildB5wAJOtaPKBiNhlnAYRsSmrvxl9M+BRFEWGPwUuioheRBwWEQ+NiElWGFTznAO8AbhxSunQlNI/cwdaYXzvG0FEbA6M+xDgCWMePw3HT3Esz60GiojbAJ8HyhTCfw54QbWJ1sjzZ7qa8LMbt9hmue5AVZbzQsvfX3IHGNE5Gcac9vbAkmq0fu4Aklae/uL8NYGXAU/PnaVh7gIc3V+c/xjwkrmFpSYUO0iN0GkPzgfeBbyr22vdG3gksB+z/WThdyhW0vtipz04t2Qfc91e6/YUP4/H8d8HMfYHnkWx1Zc0bX/OHWDKdizR5vRldO99hymPt6I/H0XExsDOwK2G/7szxYMf426b1FS/zR1gNcZ9ovsmtaSontcuNcZw+7MjgY1LdvFr4ICU0h9HOTildGJEPIpidf8y5oAvRMQdxii2uiuj3WjdCLjz8PWHlNJnSmZUc1wIfB1YBL7idrdZ+d43mpuW6Hs5fIabhOdWw0TE9YCvAZuXaN4DHpVSGnfF/rI8f6br71Meb3UstpnMip4XWiFmoSDzgpTSf3KHkDTbLNaTNFX9xfkDgbcA18udpcEOAvbrL86/dG5h6X25w0hN02kPvg58vdtrXZdiG6n7UazOuWnOXCM6juJGzec77cHxk3TU7bV2obhePBzYZjWHbDtJ/9IEmjDxOU3XyR0gs2n/95895fGmbriayY2v9roRxY3TG7G8V8hv4o3ecbfLbNzNyjXw2qUm+TDli46/DiyklMZaKS+l9MWIeA3wkpLj3gg4PCLuO9xed13uXWKMb5doo/zOBn4JHE2xDecvRzxHVL+Vfu0f9b9/3FX1IM82cGuVUvpTRFxKUQRdN8+tBomILSg+H5T5bPFHoJNSmuY2g436+WUw7f/+HCthqVrLfl5I/p5KWhks1pM0Ff3F+c2BtwOPzZ1lRmwDvLe/OH9f4OlzC0sjrRAgrSSd9uAs4APAB7q91vWBewJ3B+4I7JQz2yquvFHzLeC7nfbgl5N2ONze9jHAwRQFHGvil1rlMq2nz5tiuaxoVtY0C5MuTCldMcXxajNcRWonilXYdqS4nt90+M/XzBgtt9/nDrAa4xYgb1dLiup57VIjRMQCxarQZRwOPGaClcpeDtyO4gGgMu4FvAp48QjHdkr0f3SJNqrH5cC/h/98HsV3rXMpVv04GzgNOBk4wa1tG833vtGM+3M6O6V0+bhhpuSvwA2nMI7nVkNExIYUK+feqkTz84B7p5SmPZ/m+TNd/173IWqwZTMvpLWahfsaF+QOIGn2WawnqXb9xfm9gXcDN8udZQbtB9y1vzh/yNzC0qdzh5GaqtMe/An4EPChbq+1IcWWgLcH2sAtKVa+2KLmGAP+e5PmuOHr55324G9VdN7ttTYG9qHYQvweIzRZaQVTao7zcweYspW+WvC1pjjWTE7IRsSmwB4UWyDeAbgNcO2soZqriU/I/2XM49ePiM1SShfVkqY6XrtGFBHHUDwQ0iRbpZTOzx1iUsPr42Elm3+RYou60iuWpZSuiIhHAD+l3LaPAC+KiJ+nlL64pgMi4rbADcbs9zLgOyUzrRQvAt5b8xgXu23tsuJ7X7XHXanJN9T/xnSK9Ty3GiCKfWE/AsyXaP4f4ICU0u+qTTUSz5/punjK46laMzkvpLHNwu+p914kTcxiPUm16i/OvwR4de4cM25L4FP9xfk7Ac+YW1jyQ6C0Fp324DLgx8PXuwG6vdYNKFYruiFF4fCNh/98bYrtYjccY4hzKSZ8zwBOB06lKNI7Dfh9pz24dPL/iv8aFuntTbGa3v7ABiM2HWsrMEmlbZI7QGabTXGsmXlqNSI2Ah4EHEhRaL1x3kQz4fKUUhOL9cqsvLAV0PRiPa9daoJDgO1LtPs58NAqthZNKZ0fEQcAPwE2LdnNxyPipJTSyWv48weU6PPYlNKFJfOsFP3lULSqqfK9bzRbjdlvk+cezpvSOJ5bzfA64OEl2z42pfS9KsOMwfNHGt3MzAtpIj4sI2lFsFhPUi36i/ObAR8H7p87yzLyNGC3/uL8I+YWlk7NHUaaJZ324AyK4rr/M1yBbwf+W7C3NcUNuo0oPiOtR7Hd0aVAn2K1sHMptsM7s9Me1Do50O21rgscMHyNspLe1fWrzCNpjcre2F8uNsodoEki4trAcygKrFfydrZlNHU7ovNLtFmv6hA18NqlrCJiDji0RNOLgAenlCp7QCaldGJEPIpi27wyNgO+GBF3vPqqmhGxHvCoEn12S2aRtGa+941m3MKZS8YNMkXTutnvuZVZRDwZeEHJ5i9LKX2qyjxj8vyRpKu6PHcASZoGi/UkVa6/OH8zii1pbpE7yzJ0Z+An/cX5A+cWltwSR5rAcAW+U4evxuj2WremKNB7KJNdR/9eSSBJaxQRo650uZxdI3eAJoiIzSi243saroxQ1vm5A1So0TfcvHYBXrua4EDKFTU/L6V0esVZSCl9MSJeA7ykZBc3p1hh74EppVVXw9+T8bdgTBRzKpIq4nsfsDLf+2p/iNFzC8h8bkXE/RjurFHCx1NK2XYF8vwBVua1SdJapJSavGqvJFXGYj1Jleovzu8BfIli61bV45rA0f3F+YfPLSwdnjuMpMl1e60tgH0pivTuxfjbzqzOWRX0IWntLMoafWvuZSsiHgC8E7hO7ixqjLTuQ7Ly2uW1qwkeW6LNr4EPVB1kFS8Hbgfct2T7+wMvpNiG70qPL9HPMSmlv5TMIGn1fO9bme9901jt2HMr47kVEXcEPku5v+sl4InVJhqb58/KvDZJkiRZrCepOv3F+QdQfDn22jIdn+4vzm8xt7D03txBJI2v22ttDtwV2A24D3DHCru/BPhzhf1Jkq4mIjYE3gockjuLGqepW/pKjRAR16L4HDyul6eUrqg6z5VSSldExCOAnwI3LdnNqyPi5ymlb0XE9YEHlejjsyXHlqQcplEQV5bbay5jEXET4KvAXInmJwEPTClNa6tkSZIk6SosqJFUif7i/OOBD+bOsQK9p784v9ncwtKbcgeRNJpur7Uz0AEeSbFdVtQwzN+BP9XQr6SruiR3AOUREVsAX6Fcscm0/Jxixetjhy+VU2ZbptqKiSritUu57cv4n4H/SHFNq1VK6fyIOAD4CeW2tF4POCIidgWezvirxfSBI0qMK2ntfO8b3bhbz21eS4pqTGPFLs+tDCJiW+DrwDYlmp8N3CeldH6locrx/JEkSVqhLNaTNLH+4vzTgHfkzrGCvXFYsPfS3EEkXVW317oGsDNwM+C6wO7A/tRToLeqkzvtQdO34JNmXkrpkoi6f50bb8WtIBYRmwDfotoVUSc1AH4J9IAfAt9LKf0VICK2zJhrHE3dAqpMsd4/K09RIa9dwAq8djVMu0SbT9a5qt6qUkonRsSjgC+U7GIrisLCG5do+7mU0gUlx5W0Br73AaO/910+Zr9bjBtkiraqewDPLWDKn6si4hpAl3Kr4PaB/VJKp1caqiTPH8DP5dK0NHXORZJWLIv1JE2kvzh/CBbqNcFL+ovzG88tLD03dxApl+G2so+iKIo7l2Ib2NOB3wMXdNqD2m7udXutDYBrAtcHtqeYMLwLcGvgJnWNuxYnZBhTWqkuZrxinucDH6gpSw4rqjA4ijspHyNvod6FwG+u9vpFSmnWb3KUWcFqGrYd8/jLU0rjrkiTg9cu5XSHEm2+UnmKtUgpfTEiXgO8pGQXty7Z7v0l20laN9/7RnP2mP1uN26QKRr3c1xZnltTEhEt4NOUK/y/Anh4Suln1aaamOePpGmYxmqzkqQxWKwnqbT+4vyjgHfmzqH/c2h/cf6iuYWlV+UOImVyKLC6FSb/BpzX7bX+ApwJnEZR6PA3iidqLwHOofhcNAf8lWKibGPgouEx16B4Wvw6wNbD13UoVsu40fCftwM2q+c/bWy/yh1AWkH+xXgT61s2ZLsdlfMc4EFTGOdfwKnD1ymrvE5NKS3Xbc43jojNUkoX5Q5yNdce8/hzaklRPa9dymnch1kuo1g9dNpeBtwWuN+UxjsupfTDKY0lrUS+943mrDGPn4uITRv6sMJ1pjSO59b0HAYcULLtc1NKX6wuSmU8f6Tlrwmr0G6cO4Ak6aos1pNUSn9x/l7Ax3Pn0P94ZX9x/i9zC0sfyh1EyuBOa/j31x6+bjFiP/+ieNp2A+A8ii1gNgE2Z3aeQPtt7gDSCvJn4FpjHD+tG0aqWETsCLy64m7P5L+r453EsCgvpfT3CseYpQnZa1MUyjfJdcc8/oxaUlTPa5eyGG4lPu62hKenlMbdlnFiKaUUEY8AfgrcbApDvn0KY0grme99o/lLiTY7AsdXnGMiEbEN4xVATcJzawoi4rnAISWbvyel9LYq81TI80da/pqw37Xb4EpSw1isJ2ls/cX5XYFu7hxaow/2F+fPmltY+nruINKUVfW5ZtVt+OYq6nOazgZ+lzuEtIL8Gdh1jONvXlcQ1e5dTF749meKz9FLwI9SSn+bONW6zVKx3g2AP+QOcTXjFuicXkeIGnjtGt1+NG/+7ILcASYwbqEeFA/QZJFSujAiDqAo2KtzFe1Tgc/W2L8k3/tGdXqJNjejYcV6wM5THMtzq2YR8RDgTSWbfxV4eoVxqub5I2kaxikKliRNQdMmGyU1XH9xfjuKL7gb5c6itfpCf3H+9nMLSyfmDiJNQ7fX2pTprHYxC37RaQ/+nTuEtIKMu/LENG8aqSIRcWfgXhN08X3gtcC3UkqpmlQjK1NcsmXVIUa0M3B0prHX5JZjHn9yLSmq57VrRA3d1m+WlZmL3LDyFGNIKZ08XGGvzocW35Bj9UBphfG9bzSnARcz3qp0t6J5BcfjfoabhOdWjSLibsAnSjb/JXBgSmlQYaSqef5Iy18TdusZd9cASVLN1ssdQNLM+SLF9lRqto2Br/QX5zdd55HS8rAXfuG80k9zB5BWmN+PefxmEeGT8LPneSXb9YHHAHdPKX0zQ6EewHYZxixrmjdV1yki1gN2GbPZb2qIUgevXZolW+cOkFL6EvDKmro/jfJFCJJG53vfCIZFTb8ds9nudWSZ0F2mOJbnVk0iYmfgS5QrdDkT2C+l1PQHWj1/pOWvCVvQel9XkhrGYj1JI+svzr8baOfOoZHdCPhC7hDSlByYO0CD/CR3AGmF+VWJNntWHUL1iYitgfuVaPovYD6l9LFMRXpXulHGscd159wBrmZnxt+y8xd1BKmB1y7lUmalwutHxDgrPNXllcCXa+j3eSmly2roV9JV+d43ul+OeXw7Ipq2i9MeUxzLc6sGEXEd4BvAFiWaX0hRqDfuqnU5eP5Iy18TivVumjuAJOmqLNaTNJL+4nwHODh3Do1tn/7i/Atzh5Dq1O21tqBcEcVydDHws9whpBXmuBJt9q08hep0X8pt2/jwlNKPqw5Two65A4zh1sPiyKbYa8zj/5ZSOr2OIDXw2qVcLgLGLWAO4I41ZBnLsPD6EcDvKuz2Bymlz1fYn6Q1871vdN8f8/g54O51BCkjIm4BXH+KQ3puVSwiNge+CuxQovkAWEgp/braVLXx/JGWv/UjYqNcg0dEMP6uAZKkmlmsJ2md+ovz2wAfzZ1Dpb2uvzi/a+4QUo3uCWyeO0RDHNdpD87JHUJaSVJKFwB/HLPZvSOizOoAymPvEm0+P9wysQmmuQXYpILifb0pHjjm8ePe2M7Ga5dySSldCpxVomkjbkqnlC4EDqAoOpzUf4AnV9CPpBH43jeWb5do8+DKU5T3sGkO5rlVrYjYEDiS8oUlT0kpfbO6RPXy/JFm0qUl2lyz8hSjuwneP5GkxrFYT9IoPsT42z+pWQ7vL857zddy1ckdoEF+kDuAtEItjXn8hsBD6ggyiYjYOiLOi4gTIuLIiHhVRDwkIm4bERvnzpfRbUu0eUvlKUoYbhuZfTWqMT00dwD4v2237jZms2/UkaVGXruUyykl2jwsIhrxnTaldDLFCnuT+lBK6YQK+pE0Ot/7RpBSOhs4fsxmD27CluXD94qHZxjac6ua8QN4P+Uf4HljSumDFUaaFs8fabZcXKLNtSpPMbo7ZxxbkrQGZbbykbSC9BfnD8JCmOXgZsCbgENzB5Gq1O215oB7587RIBbrSXl8DXjcmG2eHREfTCldUUegkh4PbDl87Xy1P7siIk4HTgBOGr5OAH43XGVoObv6z2JdzgV+UkeQEvYHNijRLucqDftGxLYppdwrxT6RYqW/ccxasZ7XLuXyM2DPMdvsAOwHNGLV0pTSlyLilcDLJ+jmIRHx1pTSqVXlkrROvveN7ijGW9lsa+AxwLvHaFOHBwE3yjCu51Y1XgkcVLLtkcALK8oxbZ4/0my5oESbGzB+IXxV7pNpXEnSWjTiiVRJzdRfnL828J7cOVSZ5/QX5++QO4RUsX0oJoQFFwK93CGkFepoiq3sxrETDdoqKiI2BZ63lkPWA24M3G943EeBn7LMt++LiE0oVi0Yx4kppVRHnhKeWbLduEVqVdoQeEbG8a9ckfCQMZv9KKX0lzry1Mhrl3Ip+4DJiypNMblfTdh+K+DLbmMnTZXvfaP7ZIl4h+ZcPSsiWsCLMw3vuTX5+I8DXlqy+Y+ARzXoe9i4PH+k2fLvEm1uXnmKEUTEZrggiyQ1ksV6ktbmPcBc7hCq1CxuAyCtzb65AzTITzrtwXm5Q0gr0fAp8HG3rQF4cxO2ihp6DnDNEu2+UHWQhilTQFHmCevKRcTDgDuVbF5mNb4qHRwROYvxn8X4vw+H1xGkTl67lNGxwGUl2t0pIh5QdZgyIuIWFDeZJ3UL4PMRMW5huKQSlsl737OZwntfSuk0igKocdyQtRfr1O1g4DY5BvbcmkxE3Jti+9syTgU6KaVLJs2Ri+ePpmzcwlD9rzIP6rUrTzGaxwFNuU5IklZhsZ6k1eovzu8D3D93DlVul/7i/JNyh5AqdI/cARrk27kDSCvcJ0q02QF4fdVBxhURNwKeX6Lpr1NKp1Sdp2HKrDB37cpTjCkirge8Y4IuNqkqS0lbkel3Y/j7MO6KLJcCR9QQZxq8dmnqUkoXAN8q2fztw1VPsxleY79GdVuG7w18JCJyrmoqrSSz/t73ghJNy773vbdEmxdGxNQL5iJiJ+C10x73ajy3yo29K8UWtq0Szf8J3CeldO4kGRrC80fTUmZVOF3VOSXa3GO4AuXUDFfVK/O7KUmaAov1JK3J23MHUG1e21+c3zJ3CGlS3V7r9sBNc+dokKNzB5BWuM9TbrLu6RGR7QGJ4VZRH6PcasofqjZNI5WZxL5lRGxUeZIRDVdW+ALlVjX4v24qijOJJ0TEVIvyhytbfYrxfx+OSCn9o4ZI0+C1S7l8qmS76wNvqDLIOCLi+sAxFKtHVenhwLsr7lPS6vneN7ojgDPHbLMx8MWI2KrkmGOLiM2Bo4DNpjXmGnhujT/2DSkK4MsU4veB+6WUfj9Jhgbx/FFTlSmkXdZSSpcBfxqz2SbAI2uIszavB7ab8piSpBFZrCfpf/QX558I3DJ3DtXmmsDLc4eQKrBP7gAN8nvg+NwhpJUspXQp5W+yfzoidq8yzxheDdytRLs+8MmKszTRBYy/VeM1gP1ryLJOw0K9rwC7TdhVVatFTSKAzw5v4E3LYUCZ38XDqo0xPV67lNHngT+XbHtIROxXZZhRRMTtKLaEvElNQzwlIrIVIkorhe99o0spXQ68pUTTGwPfiIjaP1MOx/g2xbbiWXlujScitga+QblCksuBB6WUxt2qubE8f9RgUyu+njEnlWjzvIgoU9g6toh4IPDUaYwlSSrHYj1JV9FfnJ+j+IKl5e1p/cX5G+YOIU1o79wBGuRbnfYg5Q4hiXdQbiW2OeDrEXHXivOsVUQ8BXhhyeYfSCmdX2GcRkopJaDMtjwvi4j1q86zNhGxHcWNyr0q6G7zCvqowtbA0cMtJ2s1LJB5SommX04pHV9xnGnz2qWpGxaA/L8JuvhUREytMCMiHgv8ELhuzUM9PyLe4Ja4Uu187xvdBxl/dT2AOwLfiYjtJxh7rSLi2hSff+9Y1xgleG6NNu7GwJeAm5Uc+3Eppa+VbNtknj+ahvPHPH7rOkIsAz8u0eaGwKsqzvE/ImIei2ElqfEs1pN0dU8DrpU7hGrXAl6WO4RUVrfXuhZwl9w5GqSbO4AkSCmdR/mt+TanKEp6WIWR1iginkn5p/YvAd5YXZrG+02JNrei2G5kKiJib+CXlFsVbnU2raifKtwEOCYiblpH5xHRioh3A88v0TwxhYn2unntUkbvpvzqelsA34yIHSvM8z8i4toR8Xngw5Tb3q2M5wPvGW4rJ6kGvveNLqXUB55XsvntgeMiYo9JMqzOsM/jmHxF6Up5bo007noURSRl5/Wek1L6RMm2jeb5oym5eMzjb1xLitl3TMl2h0bEg6sMsqqIeBDFjgvT+u4iSSrJYj1J/2e4qt6zc+fQ1Dza1fU0w/bAL5xX+jvlJwckVe+twOkl225EsX3NR+vaMioiNo2IjwJvp9hmtIx3ppT+WmGspjumZLtDI+KlVQa5umERyUeAo4EqVy3ZrMK+qnAT4CdVb3sZEdcFvgkcXLKLj6eUfl5hpJy8dmnqhgUgL5igix2AH9ax7VtEbBgRzwF+Bzyg6v5H8GTgiIjYMMPY0krhe9/oPgv8oGTb7YFjI+LdEbHNpEEiYpvhgxbHAteZtL+aeG6t3VuBB5Vs+6aU0ttKtp0Vnj+q23ljHl95wfUy8WPgopJtPx0RD6kyTERsEhHvBI7E+yaSNBMs1pO0qkcD2+UOoalZj2IlRWkWuQXuf32j0x5cnjuEpMKw8ODJE3ZzEPCHiHhyVTfpI2K9iHgocOKw/7L+DLy6ikwz5GsUK6iV8aqI+HxEVLpydURsP9y29RTgMVX2PdTEbW62Ar4cER8ZbnlWWkSsHxGPA35N+c8U/2SyIqNG8dqljA6nKJot61rA9yLi1RFxjUnDDG9APwc4DXgLebcFfxDFCjnXzJhBWrZ87xtdSikBTwD6JbsIiocjTo+It0TE2FufRsTNI+ItFEVMB1O+SKh2nltrzfBM4Jklx/0Yy+jz95p4/mgK/jnm8Y+KiOvVkmSGpZQuAb5YsvkGwGci4v9N+h1m+Lv5cOAE4JBJ+pIkTZfFepJW9czcATR1j+svzm+ZO4RUwp65AzTIF3IHkHRVKaVvUn47mCttC7yX4obWSyPiJmU6iYitI+Jg4LcUBRE7TJjrqSmlsk8Oz6SU0p+YbAXTBwCnRMRrI+KGZTuJiM0i4kHD7Rj/RLFN4iYT5Fqb69bUbxUeQ/HzfPO4218Of4ZPoNja+ENMVpR4SErp7xO0bxyvXcphWADyOOCCCbppAS+huDY8Z9yVm4Y3uPYYrkRxJkWRXhXXwS8B50/Yxx7ATyNi58njSLo63/tGl1I6mfLb4V5pE+A5wMkRcXxEvC0iHhoRt4+I60bElsPXdYf/7qERcVhE/Ao4adi2rs+/lfLcWm2OB1GsGlfGl4HHDz83LHueP6rZ2WMevynwdQv2VmvSLbmfDvwuIp4ybtFeRFwnIp4FnAx8CrjBCM0uAC4dP6YkqQ7r5w4gqRn6i/MHAGM/1aiZtwXwKOAduYNIo+r2WrcEbpE7R0OczWQrkUiqz6HAnYA7TNjP9sCrKFZoOwH4IfATihV//kzxRPQVw2OvQbEV1I7AbShu8O9OdQ9pvTul9KWK+po17wD2mqD9ZsCLgBdFxC+B7wG/BH5PsQXNRcC/h8duSTEZfk2K7V9vA+xGcT61Jsgwjiq31K3DJhS/Y4dGxHHAt4CfU/w8z6GYfF6PohjvRsCtKf7+5il+Tyb18ZTSZyrop4m8dmnqUkpnRcSjgKOYbKWk7SkK7V4XET8AvkuxguYfKM65K29MbUlxo3k3inP97lS/leLhFN+1dwOWmGwrqhtTFOw9LqX02SrCSboK3/vG6Be4N3CfCvq67fC1nHluDUXErYFPlszxK4qV2PaJiOtS/DyuTfF9aZvha9OrvZrkdiml40u08/xRXU4v0eZWwAkR8UHg6xQFYv+mqDPYiuI8u/nw9f9SSmdUE7XxloDjgV0m6ON6wHuAN0fE1ym+w/wG+DvFfNF/KOaUtgZ2Am4P3GX4Gve709OAd1JsmS1JysxiPUlXOjh3AGXzpP7i/DvnFpZWxJOJWhbcAve/vtxpD3waTmqglNIlEdEBfkp1q5Tdcvh6YkX9jaNHcbNgpepSFNfdroK+bldRP3W6Ye4AY7j98DUtvwCeMsXxpsprl3JJKX0pIl5OcTN5UhtSFOfOV9BXGR8BnphSGgA/joj9gK8wWcHeJsAREXE34DnDbbckVcD3vtGllFJEPILiZzXWCscrkefWVdwE2Lhk29tS/AxXFM8f1eikku02p1jh9DnrOO77wIoo1hu+L76S8tvhrmoT4EHDVx0+kVL65HA1cUlSA7gNriT6i/M7A/vkzqFsdibfTQypjHvmDtAgR+YOIGnNUkp/obhmnZs7y4ROAToruTBguN3SE4FB7iwl/Ad4BuNl3zrjFjffyTTuKE4F9ksp9XMHqZPXLmX0GuBjuUNM6E0U2/T93zU3pbQELFBcjyd1MPCLiFjuq1FJU+V73+hSSudRrK7X5J/Vn4Gjx2wzyXbsa+S5pUl4/qgmvwfqXLjh5jX23TgppaNo/s43v2QZP3QoSbPKYj1JAAfmDqDsHpo7gDSKbq+1NbBn7hwNcSbw7dwhJK1dSulEiqL4c3JnKelUYJ+U0qzmr0xK6efAG3LnGNOZwB4ppXcw/pPtuQpBDgT+lGnstTkT2Del9NfcQabBa5dyGBZGP55iC9lZ8x/gCSml5w//O64ipfQV4IFAFcW+Va2uI2kVvveNLqV0CsXPqokFRGcBew3/dxy1Fa54bmkSnj+qWkrpQortpetysxr7bqonA//KHWIN/kzx0OHFuYNIkq7KYj1JUN+yypodnf7i/Ba5Q0gjuBfFkvCCz3Tagytyh5C0biml3wB3Bv6QO8uYTgD2TCmdnjtIg7yMYivDWfA1YNeU0k+G//+UMdvfreI8I0kp/QPYD7gwx/hrcDKw+/DG9IrhtUs5DFekexTwodxZxvBnisLotWZOKX2Z4vo2ScHef4AHpJTqvMEqrVi+941u+LPaA5jamCM4jeLncArlt1ytheeWJuH5oxp8tsa+V1yx3vAcfyTQtLn6s4C9hqt0SpIaxmI9aYXrL863KbZB1cq2DbBv7hDSCPbLHaBBPpk7gKTRpZROA+7I7BR6HQW0U0p/zh2kSVJKV1Cs/Pbd3FnW4gLgMSml+6aUVl3t5Odj9rN3hZnGMrwZdU+aUbD3VVbw74LXLuWQUhqklJ4APJfm3fC6ukXgtqsURq/VcEvcPSm/GtVBKaUmbxcuzTzf+0aXUjqZ4mfVhOvS97jqwxXjFutVsfLpWnluaRKeP6rYu6lvtcYVtQ3ulYbb4T6K5nx/+SP/LWCXJDWQxXqSDsgdQI1x/9wBpLXp9lpzWFR6pZ902oPf5g4haTwppfOB/YGnMYWbQSX1gUMpVu25KHeYJhpuHbIfzbxJ8iXglimlj63mz348Zl+7RsT2k0cqZ1j4cmeKbZNyuBR4HnC/4e/uiuW1S7mklN5CsZXhmbmzrMZfgQellA5MKf1znIYppZ8CuzP+9e15KaVZ3CJYmjm+941uuLXlvSg+N12aIcLlwMuBvVNKf5+gn0sqyrNWnluahOePqjL8uzm0pu63jIhr1dR3o6WUPg3cFzg/c5QfUhTLWqgnSQ1msZ6k++QOoMbYp784v1XuENJa7AtsnTtEQ7w/dwBJ5aTCuyhWNu7mznM1SxSrA701pZRyh2myYcFeB3g1zXhq+jiKrU06KaWz1nDMsRTbJ44qgAdNnGwCKaWTKFaPOHrKQ38fuH1K6c3+LhS8dimXlNL3gFsB76EZ19tLgNcCN0spfb5sJymlPwB3org2j+IdKaU3lx1P0vh87xvdcEXUN1P8rL44xaF/AtwppfSqlNLlE/Z1QRWBRuG5pUl4/qgqKaVPAO+oqfsVuboeQErpG8Au5NmR4QrgjRTzQ5MUsEuSpsBiPWkF6y/O34Zi0luCoghqj9whpLVYyB2gIc4DPpc7hKTJpJROTykdANyN6RciXd0vgHunlPYeFg9oBCmlK1JKL6MoJjsuU4zfAA8BdkspHbO2A1NKFzJ6UciVHlEyV2WGK1bdEzgEqHtlhpOAhZTS3VJKJ9Q81kzy2qUcUvr/7d15uBvpWef9b/l4k+3utntNZ+04O5CExAngsAs3WxgOm0XTbG8C4x5e9gDphswQtmG6YYAMEJj2ABOWQJDZHHhZ0o4CgeAkxAGyQAKJs5Ck06vd3bbl7fh5/3iqWnXqaCmdI6mko+/nuupSSSqVbts6ZUn1O/cdHg4hfCfwfOBPKyrjDPC/gN0hhP86ik4xIYQHiMe3QSdJ/xB42VqfT9Lq+H9feSGE4yGEryEer3+f2PVuHN4NfA2xa9A7e2xz2ZD7PLO2kobna0tr4etHI/J9xHDXqD19DPucGSGEjwBfBHwjk5sW8E/EcfC3hRCG+UVNSVJFDOtJ8+3zqi5AU8fXhKbS4aMLVxBHDgp+b3HvkmMkpHUihPC3IYQbiSe0DhIDuZNwHjgEfF4IYU/6m79ahRDCMeCFwFczmdDeWaAJ7CN2Lfj9IboWvHbI5/qMJEmeN+RjRi7tHvFq4i8avRYYdZeGtwLfAHxaCOHQiPe9LnnsUhVCCP8cQvhK4DnAbwCnJ/C07yEG5R4bQvi+EMLdo9x5COF8COF7ga8HHu6yyd8B3xRCWBrl80oanv/3lRdC+McQwk3A44HvJ/7CyFqPYw8Sj/2fHUJ4Tgjhjwe8B968iv1XwteW1sLXj9Yi/ax9G3Gc+UdHuOtnjXBfMyn9u/1dYpfBlwD/PKaneg/x+4w9IYS3jek5JEljYFhPmm92UVPR51RdgNTDVwE7qi5iSvzvqguQNHrpCa1bgOuIX5LeCYz6N9LvAV5H7JZ2bQihEUL42xE/x1xKv4T9kxDCC4jjTn6O2KVtVD4O/Daxg8iVIYSvDyG8cRWjhX6f4U/efN+Q249NCOGjIYRvIn7Z/Uus7aTqB4kdBD49hLA3hPC6EMI0jNicKR67VIUQwrtDCN8GPIZ4Yup1wCdHtPslYoD3lcBzQgjPDiH8QghhrOMRQwhNYgjxzbmb3wcshhDOjvO5JQ3H//vKCyHcE0J4VQjhC4CdxG6iPwT8GjHA9yHie9NzuYedIh7TjwKvSbd/AXBNCOHbQgh/X/Lph+2sd++Q24+cry2tha8frUUI4Q3Ez9nfC7x/BLuc6856eSGEiyGE14QQPh3YQ+yq/eE17vYk8f/IOvEzi99nSNIMSob/bl/SetBu1jcD/wY8qepaNFXOAk+vNVr/UXUhUt7howt3ETsIzbs3Le5dqlddhDqSJNkBbBzyYadCCOMaBzRSSZJsZPig7EOrCBCN1Cr+Xc5O64nwJEmuAj4TeC7wZOAG4vu3K4ndIi7PbX6R2GXo3nT5GPFE/3uBf5q2cTRJkmwCtg/xkEshjnKdGUmSPA74LODZxK5wjwceC1zB8n+780CbeLLy48Bx4pe37wL+PoTwiRHWNOzPx1JY5bjHJEm+AHjTMI8JISRD7H+B+AtIn0c8ift04s/GTmBTutlp4t/px4gj0/4R+JsQwoeHqWtSkiTZOcz2IYST46lkbdbzsUvTK0mSpwKfDTwDeCrwFOBaYmBjB7CQ2/xB4AHi6+1DxI4U/wT8Qwjh1OSqXi5JkgS4hXii9EtDHKG17iVJshXYOuTD2iGEc4M3U1H6/+cwQaaL4/i5WMV7wQshhEl01FwV/+9bmyRJklF+jkyS5EPEf4OyHjfK99yjtB5eW6v4eV9PHqmyQ+56eP30sor/z2A6vrO6nOGa6ZwJIZwfVz3dJEnyFOJ38S+g8776cuLfd1b7ReB+Yojzo8RfiHsfsYPcu8v8nz0P3wv1kiTJk4lhu2cTv8t4KnA18XNL9n3GBeLf8X8Qz+f+E/AW4meWVR1XkiS5Aij7vcuaf15W83Naxfccq/gOvJLXYpIkm4FtQzzkXAihPa56JK2NYT1pTrWb9ecB76y6Dk2lr6s1Wn9YdRFS5vDRhacRP+jbERi+anHv0uGqi5AkqYxxh/UGPPdIT/hq9Pw30qTN0mtulmqVVJ4/25OTJEmb8iHgJWDrrPxSXTe+trQWvn4kSZImz5Pe0vx6TtUFaGo9r+oCpIJvwfcsAB8wqCdJUjmebJp+/htp0mbpNTdLtUoqz5/tyUiSZDvDdev8xCwH9cDXltbG148kSdLkeeJbml+G9dTLp1VdgJQ5fHQhAb6p6jqmxM9WXYAkSZIkSdKUe+qQ28/FyHFJkiRJ08OwnjS/nll1AZpaT2s36yMZPyaNwJcCN1RdxBS4H/itqouQJEmSJEmacsP+kvq/j6UKSZIkSephY9UFSJq8drO+ieF/w1Dz44nAY4GPV12IBHxH1QVMiZ9f3Lt0tuoiJEmSJEnS+pckyRcArwPeC7wbeE+6vDeE8Eh1lZXyOUNu/66xVCFJkiRJPRjWk+bT49JF6mYHMcxpWE+VOnx04XHAV1RdxxR4BPjFqouQJEmSJElz5bp0qedvTJLkI8QA33tzl/8SQjg/8QoLkiTZBHz1kA97zzhqkSRJkqReDOtJ8+l6YHvVRWiqPanqAiTgFsCRzPDqxb1Lp6suQpIkSZIkzY1Lfe57Urrkf8HylcBPjLWicr4auGaI7QPwD2OqRZIkSZK62lB1AZIqYRBLg9xQdQGab4ePLmwGDlRdxxR4BPiZqouQJEmSJElz5e4ht3/RWKoYQpIkG4BXDPmwd4cQHhpHPZIkSZLUi2E9aT49tuoCNPWeUHUBmns3EUetzLufX9y7dKLqIiRJkiRJ0lz56JDbf36SJDvHUcgQ/jPwnCEf88ZxFCJJkiRJ/RjWk+bTlVUXoKlnSEpVe1nVBUyBE8DPVV2EJEmSJEmaLyGEc8DHhnjIVuAlYypnoCRJng78z1U89I9HXYskSZIkDWJYT5pPhvU0yDVVF6D5dfjowhcAz626jinwY4t7lx6pughJkiRJkjSXjg65/SuSJJn4d4rpc/4JsGPIh34c+PuRFyRJkiRJAxjWk+bTFVUXoKl3VdUFaK7dVnUBU+BDwC9VXYQkSZIkSZpbbxly+6uA30+SZPM4iukmSZLHAHcBz1rFw+8MISyNuCRJkiRJGsiwnjSfhv0tQ82fWtUFaD4dPrrwXOBLqq5jCnzf4t6lUHURkiRJkiRpbh1exWO+EPizJEmuHnUxRUmSvAh4O6ubznAK+NXRViRJkiRJ5RjWk+bT1qoL0NQzJKSq/FjVBUyBNy/uXXp91UVIkiRJkqT5FUL4MPB3q3jojcB7kyR5aZIkG0dbFSRJcn2SJL9CrO0Jq9zNz4YQ7h9hWZIkSZJUmmE9aT5NbBSBJJV1+OjCpwBfVXUdU+A7qy5AkiRJkiQJePUqH3ct8OvAvyVJ8sNJktywliKSJNmUJMkXJUnyGuA48B1AssrdfQD4mbXUI0mSJElrMfLfapI0EwzqSppGP1l1AVPgfy/uXXpP1UVIkiRJkiQBTeA2VjdqFuDJwE8DP50kyfuBtwD/BPw78DHgAaCd234jcBVwTfrYZwJ7gM8GdqyyhrxLwEtCCGdHsC9JkiRJWhXDetJ8Wqq6AEnKO3x04TnA11RdR8XuA15WdRGSJEmSJEkAIYRLSZL8EPCGEezuGelSpR8JIaxmtK8kSZIkjYzdtaT5dK7qAjT1VjtGQlqtV1VdwBR46eLepfbgzSRJkiRJkiYjhHAX8CtV1zECr8Hxt5IkSZKmgGE9aT4ZBtEgoeoCND8OH134XOALq66jYn+4uHfpz6ouQpIkSZIkqYvvB2a5I90fAt8eQvA7T0mSJEmVM6wnzadTVRegqXe66gI0V15VdQEVOwH856qLkCRJkiRJ6iaEcB74CuDtVdeyCq8Bvj6EsFR1IZIkSZIEhvWkefVw1QVo6j1QdQGaD4ePLnwD8Pyq66jYSxb3Lp2oughJkiRJkqReQggPATcCf1l1LSUtAd8fQniJQT1JkiRJ08SwnjSfHqy6AE29+6ouQOvf4aMLG4Gfq7qOiv3vxb1Lh6suQpIkSZIkaZAQwsPEDnuvAM5XXE4//wa8KITwqqoLkSRJkqQiw3rSfLq/6gI09e6uugDNhf8OXF91ERV67+Lepe+oughJkiRJkqSyQghLIYSfBvYAR6uup+As8GPAp4cQZnFkryRJkqQ5YFhPmk8frboATb0PVV2A1rfDRxeeCry86joqdA54cdVFSJIkSZIkrUYI4T3AZwNfC/xLxeVcAO4EnhFC+PEQQrvieiRJkiSpJ8N60nwyrKdBPlJ1AVr3fqPqAiq2f3Hvkj9nkiRJkiRpZoXoj4BPA74EeD1wcYIlfJA4kvfxIYT/EkLwe29JkiRJU29j1QVIqsQngYeAK6ouRFPLL7Y0NoePLnwT8LlV11GhVy7uXfrTqouQJEmSJEkahRBCAN4AvCFJkp3AfwK+kvj9z3UjfKqLwNuANwF/EkI4NsJ9S5IkSdJEGNaT5tMngY9hWE/dnQCOV12E1qfDRxcuB36p6joq9JrFvUs/UXURkiRNyN8Bu6ouQpIkSZMTQjgJ/Ha6kCTJ04HnAp8CPAN4HPAY4BpgO7C5sIvTwAPA/cB/AB8C3g/8E/CuEMKZcf8ZJEmSJGmcDOtJc6jWaF1qN+vvBz616lo0lT5Sa7TurboIrVu/BuysuoiKvGlx79JLqi5CkqRJCSFcBE5WXYckSZKqE0L4N+Dfqq5DkiRJkqbFhqoLkFSZ91ZdgKbWv1RdgNanw0cXvgLYX3UdFXk/8OKqi5AkSZIkSZIkSZIkVcewnjS//rHqAjS1/qnqArT+HD66sBN4bdV1VORu4HMW9y61qy5EkiRJkiRJkiRJklQdw3rS/HoPcLHqIjSV3lV1AVqXfhO4vOoiKnAC+KLFvUv3V12IJEmSJEmSJEmSJKlahvWk+fUB4N+rLkJT5yHgWNVFaH05fHThW4CvrLqOClwEvnRx79K/Vl2IJEmSJEmSJEmSJKl6hvWkOVVrtALw1qrr0NR5Z63RsgOYRubw0YXHA79SdR0VuATsW9y79PaqC5EkSZIkSZIkSZIkTQfDetJ8+5uqC9DU8TWhUftjYHvVRUzYEnDj4t4lf54kSZIkSZIkSZIkSY8yrCfNt78GzlddhKZKq+oCtH4cPrrwv4AXVF3HhF0kBvX8WZIkSZIkSZIkSZIkLWNYT5pjtUbrIzgKVx0fxteDRuTw0YVF4HuqrmPCsqDem6ouRJIkSZIkSZIkSZI0fQzrSXpD1QVoaryh1mhdqLoIzb7DRxeeBPx+1XVM2HliUO+vqy5EkiRJkiRJkiRJkjSdDOtJ+tOqC9DUOFx1AVo3Xg9sqbqICXoQ+HyDepIkSZIkSZIkSZKkfgzrSXOu1mi9C3hb1XWoch8B3lh1EZp9h48u/C7wnKrrmKD/AD5nce+SI6QlSZIkSZIkSZIkSX0Z1pME8NqqC1DlXldrtM5VXYRm2+GjCz8IfEPVdUzQvwAvXNy79K9VFyJJkiRJkiRJkiRJmn6G9SQBNIFTVRehSv121QVoth0+uvDlwM9WXccE/S0xqHdP1YVIkiRJkiRJkiRJkmZDEkKougZJU6DdrL8G+Naq61Al3lhrtPZVXYRm1+GjC88C/hnYVHUtE/K6xb1L89RBUJIkSZIkSZIkSZI0AnbWk5T5P1UXoMr8WtUFaHYdPrqwE/hL5ieod7tBPUmSJEmSJEmSJEnSahjWkwRArdF6C/DWquvQxH0c+OOqi9BM+wvgiVUXMSG3LO5d+uGqi5AkSZIkSZIkSZIkzSbDepLybq+6AE3cL9QarXNVF6HZdPjowmHgs6quYwIeAm5c3Lt0sOpCJEmSJEmSJEmSJEmzy7CepEfVGq3DwLuqrkMT8wDwq1UXodl0+OjCbwBfWXUdE/Au4IWLe5eOVF2IJEmSJEmSJEmSJGm2bay6AElT58eBP6y6CE3Ez9carTP5G9rNegL8OvAM4DdqjdavV1KZptrhowu3Ay+puo4J+H3g/1ncu3S26kIkSZIkSZIkSZIkSbPPznqSlqk1Wn8EvLvqOjR2J4Bf7nL7dxJDWC8Cfq3drN8x0ao09Q4fXfhB4Naq65iAly/uXbrJoJ4kSZIkSZIkSZIkaVQM60nq5hVVF6Cx+++1RuvhLrd/Y+H6y9vN+k9PoiBNv8NHF74d+Nmq6xiz+4EvW9y7tN7/nJIkSZIkSZIkSZKkCTOsJ2mFWqP1p8DfVF2HxuY48IvFG9vN+tOB53XZ/ofbzfqPjL0qTbXDRxduBv5P1XWM2V8Dexb3Lv1l1YVIkiRJkiRJkiRJktYfw3qSevnuqgvQ2Hx3rdG60OX25wNbejzmv7eb9Z8aY02aYoePLnwz8Nqq6xizn1rcu/SFi3uXPlp1IZIkSZIkSZIkSZKk9cmwnqSuao3Wu1n/4y7n0Z/UGq0/73Hflwx47Cvazfpr2826/3fMkcNHF74F+K2q6xijjwNfurh36b9VXYgkSZIkSZIkSZIkaX0zcCGpn1cAH6q6CI3MGeA7u93RbtYfA+wvsY+bgbe1m/XHj7IwTafDRxe+DfjNqusYo98Dnr+4d+mvqi5EkiRJkiRJkiRJkrT+GdaT1FM6KvXbqq5DI/NDtUbrEz3u+x5ge8n9vAB4S7tZf8ZoytI0Onx04QDwa1XXMSZt4DsW9y7dvLh36d6qi5EkSZIkSZIkSZIkzYckhFB1DZKmXLtZ/wXg+6quQ2vyplqjVe92R7tZ30nsoLhzyH1+DPiCWqP1wbWVpmlz+OjCy4Cfq7qOMXkz8F2Le5fePWjDdrO+CajVGq2Hx1+WJEmSJEmSJEmSJGm9s7OepDJ+CPjXqovQqp0GvrHP/S9j+KAewOOBVrtZv2EVj9WUOnx04ZWsz6DeWeBli3uXPr9kUO9bgXcBzbFXJkmSJEmSJEmSJEmaC4b1JA1Ua7QuAl8DXKq6Fq3KTbVG6+5ud7Sb9auIYb3VeiJwtN2sf/oa9qEpcfjowi8CP1Z1HWPwRmDP4t6lXxi0YbtZf167WX8T8BrgmcDmMdcmSZIkSZIkSZIkSZoThvUklVJrtN4HfFvVdWhot9carT/rc/8rgO1rfI7HAG9tN+uLa9yPKnT46MLrgO+uuo4RawPfvbh3ad/i3qV/Gbhxs/5y4B3AF+Ru/j9jqk2SJEmSJEmSJEmSNGeSEELVNUiaIe1m/f8A3151HSrlz2uN1ot73dlu1h8HfARYGOFz/rdao/VTI9yfxuzw0YVrgT8APrfqWkbs94HbFvcufXjQhu1m/SnAq4EvKdx1HHh6rdFaGn15kiRJkiRJkiRJkqR5s7HqAiTNnFuA5wCfUXUh6utDwDcO2ObHGW1QD+An2836pwAvrTVaZ0e8b43Y4aMLLyAG9Z5UdS0j9O/AKxb3Lh0qs3G7Wb8J+BVgV5e7f8SgniRJkiRJkiRJkiRpVOysJ2lo7Wb9GuBtwJOrrkVdnQZeWGu0/rXXBu1m/dOAd4+xhn8E/p9ao/WuMT6H1uDw0YWvAg6xfoL7DwO3Az+/uHfp3KCN2836JuAXgf/SY5O/rTVanzfC+iRJkiRJkiRJkiRJc25D1QVImj21Rus+4IuAB6uuRStcAr64X1Av9X/HXMfzgLe3m/WXjvl5tAqHjy78APDHrJ+g3u8Az1vcu/Q/Sgb1ng28ld5BPYDvGVVxkiRJkiRJkiRJkiSBnfUkrUG7Wf904O+A7RWXoo7FWqP1+n4btJv1nwT+64TqAfgN4LtrjdaZCT6nujh8dGEj8JvAzVXXMiJ/BvzM4t6lvy37gHaz/v8CrwI29dns52qN1g+usTZJkiRJkiRJkiRJkpYxrCdpTdrN+ucCb6R/8EWT8Q21Rut1/TZoN+ufB/zNhOrJ+3fgO2qN1hsreG4Bh48uPAf4XeBTq65lBN4E3LG4d+mvyj6g3azvBF7N4KDih4Cn1RqtpdWXJ0mSJEmSJEmSJEnSSob1JK1Zu1m/EfgLYKHqWubYN9Yard/tt0EaVvoX4PqJVNTdT9QarVdW+Pxz6fDRhW8EDgLbqq5ljd4M/MLi3qU/GeZB7Wb9C4l//qeW2Pzzao1W6U59kiRJkiRJkiRJkiSVZVhP0ki0m/UvAg7jSNwqNGqN1qFBG7Wb9b8CvngC9Qzyd8B31Rqtf666kPXu8NGFTcDPA99VdS1r9Ebg1Yt7l/542Ae2m/XbgP9RcvOfrTVaLx/2OSRJkiRJkiRJkiRJKsOwnqSRaTfrzwVeDzyx6lrmRBtYrDVadw3csFn/GeCHxl9SaZeAV9YarZ+qupD16vDRhecDvwY8r+pa1uD1wC8v7l0a+Bovajfru4FfBr6s5EPeUWu0Xjjs80iSJEmSJEmSJEmSVJZhPUkj1W7WH0PssPcZVdeyzn0M+Ioy3enazfq3EUNb0+itwPfVGq23VV3IenL46MKtwO1V17FKp4HfBH5zce/S21ezg3az/lJiR8Eryj4EeGat0froap5PkiRJkiRJkiRJkqQyDOtJGrl2s74R+L/AN1Vdyzr1d8D+WqP1yUEbtpv1LwP+fPwlrdlPAz9Ra7TOVV3ILDt8dOE5wC8Bn1d1LavwNqAJ/M7i3qV7V7ODdrP+OOBVwNcN+dCvrjVaf7Ka55QkSZIkSZIkSZIkqSzDepLGpt2s/zAxhKXR+ZVao/WdZTZsN+ufCbwFWBhvSSPzfuBHao3WH1VdyCw6fHThNuAngY1V1zKEe4G/An57NaNu89rN+kuAO4Brhnzoz9carR9Yy3NLkiRJkiRJkiRJklSGYT1JY9Vu1v8TcCdwfdW1zLizwHfWGq3fKLNxu1n/FGIHvl1jrWo8fp/YZe9fqi5kFhw+uvAFwM8AL6y4lGG0gNcDr13cu3T/WnbUbtafQBx5O2w3PYC31hqtvWt5fkmSJEmSJEmSJEmSyjKsJ2ns0tGUvwx8VcWlzKq3Ad9Ra7T+sczG7Wb9KcCbgceOtarxOkccZ3pHrdE6UXEtU+nw0YUnAD8KfHvVtZT0HuAQ8PrFvUv/NIodtpv17wJ+HLhyFQ+/D3h2rdG6ZxS1SJIkSZIkSZIkSZI0iGE9SRPTbta/G7gd2FZ1LTPkv9carf9aduN2s34t8A7gCeMraaI+AvxkrdH69aoLmSaHjy58D/BjTH/nxHcAbwQOL+5dOjqqnaYjnn8G+Lw17OZFtUZrZDVJkiRJkiRJkiRJkjSIYT1JE9Vu1p8J/E/gxVXXMuX+Bnh5rdF6e9kHpB0M/wZ4ytiqqs7bgNtrjdafVF1IlQ4fXXge8AvA51ddSw8XiQG9PwXesrh36W9GufM0jPpjwHescVffbgBUkiRJkiRJkiRJkjRphvUkVaLdrH8DMXTz9IpLmTb3Aj9aa7TuHOZB7Wb9acBdwJPGUtX0+CviaNw3VV3IpKXd9H4eWKi6loKPAO8EDgN/u7h36fion6DdrG8Evhd4OXDtGnf387VG6wfWXpUkSZIkSZKkMpIk2QfsSa/uS5d+DgHH0vVjIYQj46pNkjxGSZImzbCepMq0m/UdwA8ALwMur7icql0E7gR+qtZofXKYB7ab9ecB/x9w/TgKm1J/APxcrdF6a9WFTMLhowu/Abyk6jpSHwf+CfgH4E3A0cW9SxfG9WTtZv2lwA8CzxrB7v6w1mh93Qj2I0mSJEmSNBWSJGkC+wds9oIQwrEB24xMkiTvoBN66OcE8JQQwokxlwRAkiS7gAcHbHYohNAYsJ+7GBzkmFbHQwgTmcySJMmtxNfBoNdnWUfS5eA4XjNJknwQ2D3q/VbolhDCwX4bpAGluwbs57YQwh2jK2v6JUlyJ3BgwGZT8/dS5pgUQkgmVE5f01TrrB2j+kmS5ADxHGM/N5YNFc7T8bDk3920mtj/6ZJGb2PVBUiaX7VG6xTw4+1m/TeJob2XAtuqrWriLgG/A7yq1mj947APbjfrdeBPgMtGXNe0+zrg69rN+m8Dv1RrtP6h6oLG5fDRhT8CvrrCEj4A/DOdgN7bFvcunRz3k6bdN18GvGBEu3wLo/vQLUmSJEmSNC2OMfg7j310OgCNVRqIKxPUA9hFrO3Q+CpapkzAbmKhxvUoSZI9xJDToKDTamTdrm5PkuQQMRBjNyuNVHoMK/P6PQBMRVhP5XmMkiRNC8N6kipXa7Q+DHx3u1l/NfEN8jcDV1da1PhdBF4L/HKt0XrHanbQbta/HnjdSKuaPd8MfHO7Wf8j4NW1RqtVdUGjdPjown9jckG9QBxp+z7g/cC7iQG99yzuXTo3iQLazfoC8I3AdwCfNcJdfxT4qlqjZTthSZIkSZK03pQJApQNz43CsB3n9jC5sF6Zv4dJ1bKuJEmyG7idyf2y7H5gf5IkR4gdzgxZalTKhrh2J0myzzDWbPAYJUmaNob1JE2NWqP1PuBl7Wb9Z4FvTZdnVlvVyH0caAK/UWu03rPanbSb9VuJHywUfQ3wNe1m/U3ArwO/X2u0LlZc0yh86Rj2GYB7icG8DwD/Tgzn/QvwwcW9S6fG8Jx9tZv1XcSQ3i3Ap414948AX1hrtO4f8X4lSZIkSZIqF0I4liTJCWKXul4mGdYbNggxyXGyg57rWAjh+EQqWUcqHiG4D3hHkiRTM5JUM2+YY9gBygWmVSGPUZKkaWRYT9LUqTVadwO3t5v1nwMWiSGeLwc2V1rY2vwFsQve62uN1snV7qTdrG8khtG+ZUR1rTdfmC6vaDfrvwX8Tq3R+ljFNa3FfwZ+kviB7vIS218E2sAJ4BPAg8B9xM5yHySGRT8M/MekuuX1027Wnwa8hPh6ftwYnuIC8KW1RssvWSVJkiRJ0np2hP4Bk91JkuwKIZyYQC1Dd9ZLkmT3uENyJcfzGroZUpIkdzKecZLDuj1Jkn1AY0Kvc61D6WtomHDz/kkcv7R6HqMkSdPKsJ6kqVVrtC4AfwD8QbtZfyrwFcBXAp8DbKqytpLeDvw58Ee1Ruvda91Zu1l/FvCbwAvXuq858CzgfwA/1G7W/5AY2ntzxTUNbXHv0r8AX3v46MJ1wFOAa4AriCG0zcAG4BRwhhjQu5/YSe6hxb1LZyopuoR2s/4lxIDe1wJbxvhUX1lrtP5+jPuXJEmSJEmaBscY3A1qH2Me8ZokyR76d/jrZT8w7o5DZUKEjikcwhSFYDJZB6sbDU9plVYzInUSxy+tgscoSdI0M6wnaSbUGq0PAK8CXtVu1p8BfDHw+cTfcrqhusqWuQd4B/E3MFu1Rutdo9pxu1n/ZuDVwGWj2uecuJLYne4/t5v1txNHEB+qNVofrbas4SzuXbqH+PqaWe1m/QbiFxcN4AUTeMqvrTVafzmB55EkSZIkSapamY5wexhzWI/Vj7SdxJjeMs9hZ72SkiS5nekKwWR2A800DGP3KpWWdt9cTVjvVgzrTR2PUZKkaWdYT9LMqTVa7wfeD/xSu1nfQQz+7AH2EjuqPQnYPuYyLgAfAt5H/I3LY8Dba43WfaN8knazfhkxpPjSUe53Tn1Guvxou1n/M+BPiKHKByqtah1rN+s7gRuBryF2xtwxoaf+plqj9UcTei5JkiRJkqRKhRCOJUlygv5d7VYbpBvGaoIuMJnaBj3HEYMT5SRJsp8YUBrWQeA4QAihb7gpSZJs/7sZPnCzB7iT+EvDUlkHWF1n0F1JkhwIIRwcdUFaHY9RkqRZkIQQqq5Bkkam3axvII4LfSrwZOCZ6eUTgeuAq4GFIXZ5P/BJ4CPp8kHim/UPAP9Wa7TOj6z4gnazvg/4ZeAZ43oOcTdxVPFfAH9tcG/t2s36VuBFxBG3LyaGZyfpJbVG6zUTfk5JkiRJkqRKpV2EBoUTrhxXIC3tSvVgn00O0T/Md2MIYSyd7UrUBnDboHBGbn93MSD8F0JISpY3U9K/y3cQAyplHAIOhRDW1NUxDd8cYLhg5y1VB6iSJNlNPKfQz8EQwi2TqKcoSZJ9wF0DNiv9szHLkiR5B707cB6h/2vvSAjhxtFXVc4sHZPGXeu8HqOSJDlADAD2M7b/Z8uY9uPhtEiSZA/xuFwmPDwXx2dpvbKznqR1pdZoXQL+PV0e1W7WtwNPAB4DXANcRey+t5l4LEyAi8A54AxwglxQr9ZoPTKhPwLtZr0G/DTwfZN6zjl2PfBt6XJPu1l/A/BnwFtqjdbHK61shqQ/X3XgS4EvIQZmq/CttUbrtyp6bkmSJEmSpCodK7HNPsY3CndQQOEg/cN6+xjfGNoyoQ1H4JZzgHJ/n8eJQZSR/L2mQZpDabjszpI13J4kySE7JmqQNBzTb1T2wfT+XuGZfUmS7AkhlDkOa7w8RmlmpYHGJuWCencY1JNmm2E9SXOh1midJo6sfV/VtfTTbtYXgZ8FnlZ1LXPoOuCb0+VEu1l/F/AG4E3AP9carTNVFjdt2s36c4mjp78A+FzgsZUWBDfXGq3fq7gGSZIkSZKkqpQJHJTtNLQa/YIux0IIRwaM6h3nKNxB+z5hyGawtGNVmdGSx4gdnEYeQElfRy8ghhkG/bvuIgZ3DDNokEFjTI8RA3v9Xv8HgLnuCFY1j1GaZWlQ7y7KvVc7FkK4bcwlSRozw3qSNAXazfqzgFcCX191LQLih6TPTxeAD7ab9b8nfoj7O+CdtUZrrubIt5v1ZwCfCbwQ+GzgOQw3UnqcvqrWaB2uughJkiRJkqSqhBBOJElyjP6huX73rVW/sMuR3GWv7np7kiTZNaYOQ4P+3HbVK2c/g7v9HGdMIZhMuu8bB4wtzdyaJMlBO1eplzTg1a/r54kQwvEkSY7QPwi2P0mS23ytVcpjlGZSehxqUr4rZGVjtyWNjmE9SapQu1l/HPC9wHcC2youR709JV2+GVgC3tdu1t8HvBl4J/DRWqP10QrrG6l2s3458FRiMO/5wLOJ4bztVdbVxVngK2uN1l1VFyJJkiRJkjQFjtA/GDCW7nXpCMl+AYljuct+oZhxdRga9Oe2q145ZV4/t0wwdNIA3kH/114WxDo4kYo0iwYFvA7Cox3T+nUHtUta9TxGaVbdSflfqGgY7pTWB8N6klSBtJPetxI/vA36TR9NlwXgU9Pla9PbTrab9XcD7wX+DfhwevnRWqP1SBVFltFu1jcANwDXA59GHL/8DOBTGO9YlFG4D3hxrdH6h6oLkSRJkiRJmhKDQme7kiTZM4aRr4MCElnnukPA7X22G3nnvxJBQjAkUdagf+dDIYSJdSlMu53dQf/XFMS6/TdWL/0CxLD8uFpmFK5hvep4jNLMSZLkdgYfhzKNMbyHk1QRw3qSNCHtZv2pxNbELwa+DNhQbUUaoZ3A56ZL5jzwH+1m/YPAJ4jhsuPAx9PlbuChWqN1ZlxFtZv17cBm4DHANcBjiSG864FnAo8Dnsj0dcwb5CPAvlqj9YGqC5EkSZIkSZoiZUII+xh9J7l+IbtjWQeYNLjQb1TvODr/DeyqZ4eawUqGHg9Nopa8EMIdSZLcSv/axtJRUrMvfV2XDRtn6/3CeruTJNk3yUCYIo9RmkXpa6PfMSXvjhDCxF/DksbHsJ4kjVG7WX888OXEdtefj8fdebKZzvjcbk4SO/I9QAzynQAeAu4HThPDfueJY3cvpo/ZAJwBLgA1YsiuBgRgK3AdMTi4KV1/bHr/dWk968E7gS+rNVr3Vl2IJEmSJEnSNAkhnBgQhmPAfUNLkmQX/YMGxdBKv1G94+j8N+jPa6imnDLTYarq9jOo29m4Okpq9g3qZnUoH+ZNR+Eep/9UmgN4XKmCxyjNlDRgOqjrYuZQCOG2cdYjafIMjUjSiLSb9W3ED2m7iaNFv5jYae3yCsvS9NqZLjdUWsVs+Qvgq2uN1rmqC5EkSZIkSZpS/cJwDLhvNfbRPyRRDK0MCiPsL7HNMAZ21hvhc61n/cJJQOycOIlCuijzb7in5HaaLwcG3N/tNXOQ/gGb/UmS7K7w52FeeYzSzEiSZDfQLLn5ceCWMZYjqSKG9SRpDdrN+hOA/wJ8CvAs4EnEDmeSRutgrdHyA4kkSZIkSVJ/hxg8pnHXCEe/9gv/negyDvIIccJEr4DfyMYBlhyLaAesERnx62oYZf4Ny3Td0hxJkuQAg18XB7vcdojB3bAOAHbBmjIeozRFmpQImBLfL91Y0etW0phtqLoASZpxvwv8CPBVwDMwqCeNw/cb1JMkSZIkSRosHaM36KTuyAJxA/a1IqCQnnDuF1zYk47WHYVBf85DngAvrczfU5ngwcil/4aDOmYZhFHRUCNwM2l3tkHhqwMjPI6pHI9RmglJktxJ+S7Ht9ilU1q/DOtJ0tqcr7oAaR17BPiKWqP1qqoLkSRJkiRJmiGDgiQjGYWbjnHrt69eI/0GjfobVZhw0J/TkYPllQkLjDIEOpQQwlNCCEmfxS5nelR67BoY5l3lfRCDV4PCgBotj1GaekmS3Mrg8duZ20IIg441kmaYYT1JWpubgT+tughpHXov8Jm1Ruv/q7oQSZIkSZKkGTOpMNygMEqv0OCgMOGoQi6D/pyOwC2vTBDGbmKaFYPCMicGhGQOMbiTW9lAjkbDY5SmWpIkexg8QjtzMIRwxzjrkVQ9w3qStAa1RuueWqP1lcDPVl2LtI78MfDCWqP1r1UXIkmSJEmSNIMGdtYbUWChb1e9dCTvCiVG9a45TJieFO/3ZzzRqz6tlI5xHPT3tRu4dQLlSGs1KEh3sN+d6c/DoI5Xe5IkqayT27zxGKVplnbzvKvk5sdCCLeMsx5J08GwniSNQK3RejnwjcBHqq5FmnGvrDVaX1NrtNpVFyJJkiRJkjSLSoThYDTd9frtY1BgsF/QZVcatlsLu+qNXplxfLcmSVK2c5A0cUmS7Kd/kBfKvdb7BvpSjsKdLI9RmlZNBh93IHaIbIy5FklTwrCeJI1IrdH6XeD5wC9VXYs0g+4GvrLWaP1E1YVIkiRJkiStA4PCaLvXsvO0Y1S/E8+DOhwNqm+tYcJBYb8yoQ4td5DBIVCIYZi77CqmKTWoq17PrqB56TaDtnPs6mR5jNLUSZKkyeD3JJlGCKHMSGdJ64BhPUkaoVqj9WCt0foe4D8Bp6uuR5oRrwf21BqtP626EEmSJEmSpHViUIik6s51g+5fa0cqO+uNWDpmskw3MYh//3clSfKOJEkcO6mpkI6iHHRsGCbIW2bbQeFAjYjHKE2b9LVV9v3MLWWCwpLWD8N6kjQGtUbrz4DPAv6h6lqkKfeKWqO1WGu07q66EEmSJEmSpHVk3J3r+o7ATUMTPaX39zspvWe1HanSEbp9u/4Nqk893UEc01fWHuD2JElCkiRNQzGq2KDQzDBhL0pua1hvsjxGaSqknRvLjly+I4QwzLFH0jpgWE+SxqTWaL2n1mh9Bo7Flbp5L/CiWqP101UXIkmSJEmStN6UGNG4Kw21DS0N0fV7bNmudeMKFNpVb0zSkOMtq3z4fjqhmAeTJLnVYIwmbFBw7tAwQd5020Hd9XYnSbLWTqEqyWOUpkHaxbNZcvMjIYTbxlmPpOlkWE+Sxiwdi3sz8EDVtUhT4leBF9QaraNVFyJJkiRJkrSOjSsMNyh4UjYMN65RvYMe55i5NQghHGH1YZjMLmLHoSwYE7JgzGo7Kkr9pIG53QM2G2YE7jCPsbveBHmMUpXS10eT/h1+M8eBxngrkjStDOtJ0gTUGq3fA54L/HrVtUgV+g/g62qN1v9ba7TOVl2MJEmSJEnSOjeuMFy/kN+JtKvfQCGEQ8Sxk72sNuAyqL7VBHKGkgt3TMsy0rBQOq5vrWGYotvT5cG05jvTYMyggJVUxqCQ8fE05DWU9HgyaOzqPl/Hk+UxShW6k3Lvr04AjWG6eUpaXzZWXYAkzYtao/Vx4NvbzfrvAj8GfG61FUkT9Rrgh2qN1v1VFyJJkiRpcm666eZkDLvdACTpQm692/Wkz+MG7X9cAnBpyG1DyduH2XZsXve6353Yc0nqq4oxs8OGXY7QO0SzK0mSPWXDfwDpaN9+3WwcgTsiIYSDSZIcp3wHoWFlAcPbkyQBuIMYqDo4hufSOpZ2uhoU1lvL6+ogMcTVzwHAUZcT5DFKk5aOTS479vqWYd7fSFp/DOtJ0oTVGq0W0Go36/8F+BHgCRWXJI3TB4Hbao3WH1RdiCRJkqRoFQG6hBhg67ckPdZ7XU+6rNPj/vxtCfE7zQU6gboFYBPLp4hsTJdsmw1dHtfNhnRfC2X+YlYhAEvARcoF9gJwIX1MPgB3Kb39UmHbi+nSb9vQZcmH+fLrve7LP664Xbjpppsv5W67VLi/32XxtlUxLChFIYQTSZIco3eHl11JkuwapqvLGMJwx+h/Ynsfw42tHRRA9MT4CIUQjiRJ8hRiJ6GyAYXVuhUgSZI7iaNHjxiKUUllOkuupePmIUqE9ZIkucMuWpPlMUqTko7aHnQcyNw2iS6/kqabYT1Jqkit0frf7Wb994CXAT8AbK+4JGnUfhn44VqjdarqQiRJkqRZNUSwLiEGzDYULrvdlr/c0ON6ftkIbE6XTbnLjQMus/X87ZtzdW1keTiuuL459/xZ8K5b17x8oI/Cbfnrxdt6mbbOet2273Vbv23zAbwsMJitX8htkw8H5oOF+dDfpcI+LgHn08uLueVCbrvicqFwfSm3/YXCvvNhvoFLGhYsuywV/n4GMgyoGXOE/uPY9jFcSGVQGG7Yk8+Dwn3DjuodtL2d9UYsDR81kiTZRwyrrLZj4zD2A/vTUMwdgCEo9TMorHckhDBolG1PIYTjSZIcof9rP+vuZ3hrwjxGadzSUch3ltz8UAjhjnHWI2k2GNaTpArVGq2HgFe2m/XfAn4U+JaKS5JG4a3Ay2uN1t9WXYgkSZJUpRJBuyxg12/Jh+42drktf99mYCudYF239S2Fy3wAL1vfQidst5lOqK4Y6OvXTa/f/f065/VaLzO+VuUVO+R167QHK4N+/R53qcv6Wjrs5YN/S8Qw4IV0ya/nrxdv77Z9v22X6IT38kG+ZZc33XRz/vqg7UsF+wwAaowGdZLbw3ABu36diY4NG0YIIRxLkuQEvbv17R+y+1+/EMYJR86NTwjhCHAk7b64n7TL1ATcCtyadi1zzKiWSQNauwdsNooA3SEGh8AOjOi5tAoeozQO6ZjtsqOWjwG3jLciSbPCsJ4kTYFao/VB4FvbzfpvAv8V+MKKS5JW4xTwo7VG6xeqLkSSJEkalQGBu2wkaxaiywfq8rcVr2frWTCuRgzTbU2vF9fzt+Xvy27PQnb5gF/Zznr9Oupl960lJGfAbjqNa8xvZlTBs6G76q1yybr/nQfOEoN759LlfLrkr58r3HYufczZwvbn6YQN88G+FetpALDXku2j79+rgT/1MKiTXOkOQ+kJ6X6d61bbte4g/UMTpbr/pfX1O1nuyLkJSAORx4DbkiQ5QAxKTSIUc2s6hvCWNJQjweCueidGNI4yG4Xb7xi0J0mSfb4+q+UxSiN2J+W6AJ8AGnZYlJQxrCdJU6TWaLWAVrtZ/0bgh4DnVlySVNavAz9Va7Q+XHUhkiRJUjcDQndZMG1jYel2W37ZTAzabUsvs2VretvWwm3Fy62sDPWVXYrd9YYJxRmg07iN6jW22lDhakJr2djfbh3yugXsyl5mXfzO0gnwZev56+3c7WdzSzu3no0HXup2edNNN+dvu1jYpuvoZQN+618I4USSJMfofSJ5zxCd6wYF+1bbtW5U3f8G1Wc4YsJCCFkXsdvSDmdZR6thxxuXtRu4yw5WgkcDvP26gcKIOt2lx9pBwWPSejwWTQmPUVqLJEluZfAxJnPjWsZtS1p/DOtJ0hSqNVqvbTfrTeJvff0Q8KSKS5J6+Vvgx9KgqSRJkjQRfYJ3GygXsstvk416zUJ329PLXkv+/q3p4wd11uu1XqZrncE6aXir+bnJRi+XMUzALQsB9u2sV2K5SAzytXPL2dz66fTyTJelTaf7Xxbiu0An4Lfi9lx9Kxjwm0mH6B88KNW5bsA+1tKdalTd/waFKwzIVCgbQQncAZB2mNrNeIIxt6YhVMcNzrdBXfVgtB03DzE4rHcgSZLb7K41fTxGaRjp6+P2kpvflnZ0lKRHGdaTpClVa7QuAK9uN+v/F/gB4OXAjmqrkh71fuD2WqP1mqoLkSRJ0uzrEb5LWB6629TjMlvPj5TtF7jrdt+Wwv7KdtgbFLYzaCetT8N2stxAPMb0UyYA1200br6TXrGrXnZbNtb3dLqcyq1n14u3nSF2/cvCe49e3nTTzRfS6/ml65heg31TY1BIbXfJ/fQLvqw6CFey+9+eEie6+4X6jk0yHBNC8D3AALlwZxaMybpa7WOI8cx9HEiSBMMwc21QWO/YKAM0IYRjA45lmQOkr3tNL49R6iVJkt3E8bdl3BFC8Odd0gqG9SRpytUarTPAT7ab9dcSfyurzG+DSeNyH/CzwKvSQKkkSZLUVY8AXtb5blOXZWNhPet2t4MYsMtfFm+7LL0shu7KdtjrF7rzZLukSShzrMmOW0WDAnGB2CWv2D1vWQiP5SG/83Q69p3KXT6SWx5OL08Rw31Z975Hlx7BvkuG+CYrDZCcAHb12GRgx6AkSfb0eTysfgRu5siAOvb1e4503GW/x9tVb8r16Wp1gPKB0qIDSZIcNygxf9Jg1aDXzZ4kSar4/8iw3gzyGCV49P3GXfR/T5Q55rhjSb0Y1pOkGVFrtI4Dt7Sb9V8kdtp7ScUlab48DLwa+F+1RuueqouRJElSNVYRwCsuW+mE7S4rLDtyl1kIbzPLA3zFQF+xw95Cn/IN3UmaJmsJB1yiE8DL1kNhvXhbr0vohJY3FfabdeW7QKfLXrZ+LnfbeWJYLx/geyhdHs7d/lC6fn6Nf36tzhHiKL9uynQIGrTNWsNwg8ZHDgoUjrs+TVi+q1UajjjA6sZR3p4kyaEQwvGRFqhp1+t4Nw12J0lyIIRwsOpCtHoeo+bWnZQLZx4HbhxzLZJmmGE9SZoxtUbrvcBL2836rxJH435dxSVpfTsN/Brwc7VG6z+qLkaSJEnj0SWElx/bmC2be1zPAniXAZcXLotBvG1d9tOts94mOuGRbgzeSRqnYYNk+XDbpcLS7bbQ5bYy2wSWj8DNOuIVR+PmR+Re6HPbJWJwrtfjs8Bf1m0v+3vJ9nEp9+c/D5ylE+Brs3yU7rn0+oVV/P1qNI7RO7yyq8SY2X7hg+NrHSVZovvfoDBev/pOpB2RNKPSEcZ3EEMxe4ihmGEm0NyJoYm5kQanpjmsB7E+w3rrhMeo+ZAkye2UP7Y00teFJHVlWE+SZlSt0foHYH+7Wf8i4PuBF1dcktaXM8QvC15da7Q+UHUxkiRJWp0+nfDyYbv8Zba+hTiCNgveZUu36zsKjy0G+/IhvAW6B+0M30laqzIBsHyA7iLLw3T5y6XCtsVtimG8fLe5bD3fda7Yma64nKczerbbaNoLufWs7kGd9Yod9LrdDstDed22p7A9he2Kf7f56yv24fjbSg0Kq/UcM1si+HKoz33D6Nf9b1CgsF+Yz6DeOpK+Bm5JkuQgMeBSpovVvhKBVK0fByg3orJKvibXKY9R61M69rhfB+C8hv+WkgYxrCdJM67WaL0ReGO7Wf9yYmivzNgKqZeTwGuAX641Wh+sthRJkiT106Mb3kaWB+e6rWchvCvSJQveXVG4rdgFr18YzwCepNUaFN7Kusnll0tdbuu25IN5WajuHLEDXLZkIbtsrGu+Q1xxPT/6NQvmXWBlwC973tDl9n6d9LLH9OqwVwzNrZnhuflRonNdvzDBoO8bR3VCul/3v6yOFc+Vhgn71e8J83UoDUK8IEmSOynXwWo/vhbmxbR31cscAG6puogJm/YQ5ch4jFo/0m6Jd5bc/I7ciGRJ6smwniStE7VG68+BP09De98LfHHFJWm2fBT4v8Bv1Bqtj1ZdjCRJ0rzrEsTbwPIgXnHJj6O9AtjJyvBddrmD2DmvX2e9zelzdgsESlJe2bBdccRqfixrr/uyrnL5gN05VgbuzhUui9u10/WLhecd1EGv2zbF9Xz3uFIMyKlC/TrX9QvkDeoKNKrOdYP206uOQWFCO+utYyGEW0qOPT0A3DaBklShJEn2Ua6T2TTYnyTJbSMYlXl80AZJkuwOIQzcbgIGhfWmocaR8hg129J/uyblgqaHQgj+G0oqxbCeJK0zudDeFwM/CNxYcUmabm8Ffg1o1hqtR6ouRpIkaR706IiXD8ttphOmy3fD20EnhJe/zNYvT7fLP7bbuNtunfAM4UmC3qGzfOCu19ItgJeF7bLAXLacSS+Lt3dbzrMyYNevi16/pVRIzjCd1rF+net29Qlz9AvDHRtB0AR4tPvfMXoHbYa9HeC4o+hWL0mSDwK7+2xyWwjhjknV08ctxNdBv1oHjVLW+jArXfUghn8OAJP4GZqWjnb9fkaH5jFKE9Ck3Ov2OPPXKVPSGhjWk6R1qtZovQF4Q7tZ/yLieNwXV1ySpscF4I+IXfTeUHUxkiRJ600hjJeNpt3EygBeFsrLxtLuzC27Ctd3pNv16qyXBfE2FMoxhCfNp36hu0v0D911W7JxsKeJQbszhfVs6RbAy8bFDuqi1+u2pTJ/YAN2UimHgNv73L+HQlejdPRbvzDcqEe9HenzfLuTJNnVJRzYL0zoKLq1Oc6AcMmkCuknhHAiSZKD9H99Q3xtGYRZp0p2L5s2owjrlelGV/nPavrvM8iwnfU8RmlskiS5ncHdewFOADeO6pcXJM0Hw3qStM7VGq03Am9sN+v7gO8CFisuSdX5N+JvAb221mi9r+piJEmSZlGP8bRZ17otdAJ52WU2mnYn3UN4u+jeEa8Y7NuIQTxpnvUKohU72F3scv1C4bass12/4F3xvnaX/ffrrJcP22WjYrsyZCdNTgjheInOdcVw26RHzA4KKewjV2Ma/ugXJjT0sDaDggdlQgyTUiYIMxXBHY3Nfgb/G0+s01o6kveuAZvtTpJkXwhhLcfSMgGhkXa0W6Wy3cmG4TFKY5EkyX7g1pKb3zIlY6YlzRDDepI0J2qN1hHgSLtZ/2zgpcA3EE8Ian07T/xC4HeA19carTMV1yNJkjTVunTF28Dy8Fz+MuuKdwXxS/VdwJV0QnhZMG87vbvq2RFPml/dQmrdwncXckv+9qzb3RngVLqczi3dbsvGymb7WKLT9W5QEK9rqM6wnTRz+nWu6xZq6BeEOzGGcX2DAivFQOGkw4TzZlD4YE+PbocTl3auOkH/sItBmPXtQIltJtZtM4RwJEmSQZ3fINY9D2G9fv+fZIY9lniM0silXYWbJTe/LYRgF19JQzOsJ0lzptZovQV4S7tZ/xngW4GvZzo+qGm03kEcdfv6WqP13qqLkSRJmhZdwngLLA/f5cN4W4lBu510wnf55UpWdsUrXm5OnyPPIJ60PnULrWVjZy/QPXR3vrCejZp9hE7QLlsvLqfT7Xt10OvWbe9ijzoBg3fSnOgXrusWaugXhht5EC4NMwzq/tfvet6xaQhozLgynYKWdTusmEGYOVViZDfAkQq6X5XpprY/SZLda6itTGh6Gs4BjaOznscojVTasbdsUO/gpDp1Slp/DOtJ0pyqNVrvB36k3az/BPC1wLcAX1xtVVqjDwJ/DvxRrdH664prkSRJqkTJMF625EfUXllYsq54l6Xb5YN8+f05nlZa/7oF2IoBvPOsDORlt7eJgbssdPdIj+UUMXyX73xX7K5XXL/UrWBDd5L6GBSw200a/EjDL/2CA+PqWneI0YT1piWcMcvKhICmKQgzKOjimML1a3+Jbap4nZYJ60Gsf1Whn3TE+aAQ2DSMgy1Tw7DdWj1GadSalAuWHgsh3DLuYiStX4b1JGnO1Rqts8Brgde2m/XnA18NfDnw/EoLU1nHgb8EDgNvTv89JUmS1rVCIG+BOEa2GMLLLi9jeRjvqtz6zvT+bkG+LJS3keXhO4N40vpRDLQFOmNhu4XwzrO8A14Wsnu4sGTBu4fpjJ7tFuTr1mnvUpe6DN9JGpkSnev20Qk/DApWjCv80C8EuCtJkj258bv9wnqOwF2jEMKxEiGg/UmS3FZ1F8O0G5JdqeZQ+m8/aATuCSoIbKXH3EMMDhPeyirDeqnj9D8eFo+dE5X+G5UZgztUWM1jlEYpSZLbKRcqPQ40xlyOpHXOsJ4k6VG1RuudwDuB/9Zu1vcA/wl4Ubpsr7I2LfNO4I3AnwHHao3W6YrrkSRJGqku3fE2EYNz+Q53xTG1WRAvv+xiZWe8YiBvAcN40nrTLdiWD+Gd73KZLadZHrp7GHiI5aG8R4AzwDm6B/qK3e+WisUYvpNUsSOU61xXyYjZEuGL3cCxAZ3/TlQVSlmHDtE/CJUFpaoeBVims5pdq9an/QwOQR2qMKx1kMGvz11JkhwIIRxc5XP0O65n9jN857pRKfPzudr/VzxGac2SJDlADM2W0ahgpLakdcawniSpq1qjdYz0g1u7WX8y8JnAi4HnpIsm537gLcCbgb9J/20kSZJmWiGQt4EYyMt3xMsua8AVrAzjZdevALYVHpdfDONJ60u3bngXWR64KwbwslG0WfAuu3yocNvDxBBeMczXrcveUrEWA3iSZki/75byo9/6dZcZd9e6I/QONuwhhjOqrG+eHGFw17JbkyQ5VHF4oUwQxtfF+jStI3ABCCEcSZLkOINHa+4nBvtWo8w5gwNJktxRUWhxnD+fHqO0Jmn4/86Sm9/iLwNIGgXDepKkgWqN1oeADwGvA2g3659JHJP7BcBnADdUVds6dQ74Z+DvgLcCb6k1Wp+otiRJkqThdRlXm++Ol7/cRvxt96uAq3OXVxNDeTuIob1u3fE2EcN+GcN40uwqht0usTKIVwzlZeNos/Ddydx6PpB3mvhZq1tXvfylXfAkzYN+YYA96ag+6N+patwnqo/RO9iQBV76dv4bbTnzK4RwqETQaBfQBF4wmaqWS5JkP4NHF46tG6SqkyTJbgb/2x8PIVQdgjoI3D5gm31rGFVb5s+3i9g57LZV7H/VkiTZR7nRoqv6N/IYpbVI3/M0S25+xxq6X0rSMob1JElDqzVabwPeBvxqu1nfATwL+BziB52nAp+KY3OHcRZ4N/B24B+At9YarfdXW5IkSVI5fQJ52bKFGLTbQfyCPAvh5QN5O9P7uwX5HFUrrQ+DOuKdY3kQ7xyxG94pOgG8/GW2/nC6XfHxFwrrdsKTpFQI4USSJEfoHRzoN14W4ATj7/5ziN7BlqzufmG9qoM5602ZoNGeJEnuDCHcMomCMmnQYlBtUGFnNY3VoI5qsPpudaPU75iWdwAY+mcoPa4fYnD3tqzD3CQDzWU6lp1YY6DSY5RW6y4Gd70EOBJCmGjQVdL6ZlhPkrQmtUbrFDFg9g/Zbe1m/anEAN+nAs8FPh14IrFjyrxbAj5I7Jz3XuAfgX+sNVr/UWlVkiRJfXQZWVsM5GXjarcTO+Fdky5X5y53Et8PdgvkbSIG8jKG8aTZEwrrl1gZvsuv5zvinUiXk+mSrT9CDOL16qyXBfEu5QsxhCdJpawlrHdk3N1/QgjHkyQ5RvdA3q60m1avk+vHHFE3cgeJHbn6vS4gjtncHUK4cQI1ZSGYskGLaQhsafTKhPUqD0Glx7QyYbr9SZLctspjbJn9A9yVJMmNkzhOJknSpNzP5x1rfCqPURpakiS30z/4nzkGNMZcjqQ5Y1hPkjRytUbrA8AHgD/Nbms3608kjst9DvA8YnjvycB1xC4q680l4H7gOPBR4pv59xKDeh+uNVpnK6xNkiRphR6BvCxMl1+yDnnXsDKUt5MY2Cs+Zku6P7vjSbOrGMYrdsU7x/Ig3hmWB++y9ez6Q+k2+ccVg30XMYgnSePSr4PRbqZjxOyRPnX0C6TYVW/E0q5dt1GuQ9a+JEk+CNwyztGjaWCzSbmgxUHHS64/SZIcYHA461gI4fgk6imhTJhuFzGAOHR4reQ42Ow57kqSpDHmn9Em5cKDJ1hjUM1jlIaVJMmtxIDnICeAhv8+kkbNsJ4kaSJqjdZHiaG1N2e3tZv1GnAt8BTiB8inAdcDVwCPT+/bxfSO1G3TGcH0fuBe4N+Bj2eXtUbrE5VVJ0mSVNAlkLeJ5YG6rEPeNmKHvHxnvCyYl70/Kwbysg55G3LPYSBPmh3FMF42RrYYxMt3xTtJPHnxYOHyZHr/WXoH8bLRtI8yiCdJkxNCOJYkyQm6B1320T/sMakwXL9QYL8T7HbVG4MQwsEkSfbTuyNj3m5iGOgQcMeoO3ilIYsyYyUhvjdxdOH6VCYIVnlXvUwaput13M1bVVgvdQflAmtZYO+OUY/2TJJkX1pDmW5yEI8Raw5CeYxSWUmS7KH8v8+NUxT4lbSOGNaTJFWm1mi1gY+kSyt/X7tZ30jszLILeByxA991dDq2XEcM9dXS61vpdH/ZTKcbTDZSLTtpvETszHCJ+P/gAvEk0WniiaRLxO4N9xM/JC2l6x8jdn04AXwIeDi9/V7gVPpnkSRJqlwhkJfQu0PeNuJ7rV6BvB1dHpO95zKQJ82eYhhvieWd8M7lluwXk/IBvGIY73TuccVQX9YV79HnNIgnSVPpCN3DLv0CFicmOGK2Xyiw75jeUReiR90CvIPBYaPMfuJYz0PE8cmr7p6VdqnaT/mARWa1I0U1xdLXQ5lQ1rSNFs3GtfazO0mSfavp+jZkYA3g1rRD4R0hhDWNok33M8xzAxxf6/MWeIxSX+lo4mbJzRsTfM8jac4kIfg9mSRptrWb9c10Orlk3WE2E8N4gRjAy7q/ZN0bstDeJpaPacpOLJ2pNVrLujxIkiRNk1woLyG+78kH8mrp9e3EL6mvYuXI2qvS+2t0H1m7kHs6A3nSbMh/0bdE/PyTD+GdZXlnvCyA90BuyQJ5WRgv3w0vH8i7hGE8SZppQ3b+yYy8C1M/SZLcxXDBj2MhhBeMqx5YVU3T6LbVBmTSrll3reG5j6QL/WpIOx9lf8+3Uj58k3cohNBYxeNGIg3vfHDAZgdDCLdMop6iEfxbTsLxEMJTijeWPH5V+u/fTcnXBKyh9vQ5hgms5ZX9+czG9UL8OV3tMfEFY+hqN3fHqDQoOaij4o3jHPs7yLQcD4f4GZwVXY+RkqafnfUkSTOv1mhlATtJkqR1pdAlb4EYosvCePkOeZfTCeFdy/Jg3mX07pBnIE+aLd1G1Z7rspwlhu1O0gngZZdZF/FHiB30uj3+PI6olaR5sJqT9pPuMHOE4UIgUzPycr0KIRxJkuQWyo3a7ObRYE+SJMOGRYdxbNqCWhqpQd3pYAqPByGE40mSlDmu7U+SZPdqxm+mz9FgdYG1Sf18wpi6lnmMkiTNAsN6kiRJkiRVqMfY2mKwrkYcS5t1yMsH8q4BriCG9opBvi0YyJNmSbdRtd3CdPlRtfkwXn79YWL38G5jbs+l+7YzniTNsRDCsSRJTjBcN6BJd+UZ9vkcgTsB6ahNWH0YZtyOATdWXYTGIx3zOui4dSKEMHVhvdQhyoWQ9wOr6oA5gsDauN0yzn8fj1GSpGlnWE+SJEmSpAkYcmxtFsK7Nl2uBq6k+9jaren+8vuXNL36dcc7SydY16YzqjbfFS8L452kM6q2WyDvInFULWAYT5LU0xFiIKSMYyGEE+MspmjIQOGJcXRpUndpGOY40GR14x/HZepGn2rkyhyzDo69itU7RBzhO+jn5tYkSQ6u9rib+xmdplHHJ4gd9cYerPYYJUmaZob1JEmSJEkakRGOrc1vnwX5NgMbcvs3lCdNr2Ig7zwrw3hn6XTHu58YwLs/tzyAo2olSeM3TFivqi5VZWu0q96Epd27nkLsXlX2dTROt4QQpjmkpTVKkmQ35V5r09pVjxDCiSRJDjJ4lO8u4p911a/p9Gf0BcSf0T2r3c+IHCH+jA492ne1PEZJkqaVYT1JkiRJkoZU6JK3mRimKwbsHFsrrW/9AnlZZ7xzxO53J4kBvPtYHsp7EDiVbtutQ95FHFUrSRqvQ5QfE1hVGK5sWM+uehVIu3410tGktwO7KyjjIHDbpDs/qhKljgUz0GXzEIPDegAHWGOXwPTv4gVJktxK/BmtQmUhNY9RkqRpZFhPkiRJkqQuCoG8BVaOrc265F1J7Ih3LY6tldajkLu8SKc7Xn45Q2dc7X10gnlZh7wskJcP42WXl7LnMIwnSZq0tMPTMQZ3XKpyxGzZQKHdiioUQjgEHEoDMQeAfRN42juAg5Ps1KXKHSixzdR21cukI77LHHv3JEmybxRjY0MIdwB3pKG9W5nMaNjb0uetnMcoSdI0MawnSZIkSZpbhbG1G4BNdB9bexnLx9Zel65fRRxpuw3H1kqzLB/IW2L5yNp8IC8bWXsvMYyXD+Q90uUxZymMqzWQJ0maQkcYHBipbMRsyUDhMTsWTYdcIGYXnUDMKEMxh4j/3lMRANLkpCGrMl3RZiW4e5ByQeT9jPAYnAvtZX+fo+62dwdwfFrHvXqMkiRNgyQEvx+UJEmSJK1vXbrk5bvcZcG87cTfLL+WlV3ydqX39xpba5c8afrlvwS7RGdsbTaCtp0uD9PpkJct96a3PUwM7RUDeecwkCdJktRTkiS7WT7CtExnryN0QkrHRtFdTFJ3ace9zH4Gh7gBbsutH5zl0LTHKEnSJBnWkyRJkiStC1265G1mZSCvBlzB8rG11xA75V0F7Ei3yW+fdckzkCfNhmKXvHyoLgvknSaOrb0PuIflnfJO0D2QdzbdnyNrJUmSJEmSJK2KY3AlSZIkSTOl0CVvIzFMl+92VyOG7opd8q5Jl110xtZ265JHbv+Splc+lHeeThgvH8rLj63NL9nY2nbhcWeBC7l9G8qTJEmSJEmSNDKG9SRJkiRJU6fQJW+BTpe8fLhuGyu75GWhvKuAy7o8ZiuwCbvkSbMiH5RbIobyioG8rEvevXS65N3Dyi55+UCeY2slSZIkSZIkTZxhPUmSJElSZQpd8jaxPFSXhewuI4bvrqETxssuLwe2d3nMZuySJ82S4ujac3TCeNnyCLEjXhbGy5b70/vOsLJT3qNd8gzkSZIkSZIkSaqaYT1JkiRJ0lgVAnkLxHGzxVDeNmAny4N419EZW7uDlR3ythI/19olT5od+VDeRZZ3yGsTA3cPE7vi5bvk3UMM6p3KbZs9NuuSZyhPkiRJkiRJ0lQzrCdJkiRJWrPC2NoNxM52W1g5tjbrkpcP5F2b3nZ5bvv84zan+8wYypOmX7dQXtb5LgvlnWR5GO+T6fUTxFBePsiXja69lD2BoTxJkiRJkiRJs2ZsYb2bbrp5A/Gkyvb0ebLxJefwN50lSZIkaSYVuuRtpNMlLx+y2wZcSadLXrZcTeyS121s7RZi1z275EmzpRjKK46uPUMM391LDOPdA9xNJ5R3prD9WeA8fnckSZIkSZIkaR0aZ2e9BeAK4AbiSZkF4DSd344+c9NNN58mfimbjSvxS1hJkiRJqlihS94CsbNdMVy3jdgJ72qWB/KuIXbJu4yVIb4t6b7y+zeUJ82GYUN52ZKF8k6zMpR3AUN5kiRJkiRJkubIOMN6S8BDwEfT53k+8AziyZxzxC9rPwZ8Il1/iOUBvjYG+CRJkiRpLAqBvATYRCeQlw/m7SB2ySsG8q4h/oLWNlaOrc265OX3L2k2GMqTJEmSJEmSpDFJQhjvd6Q33XTzAnHE0WOBTwE+E3g28QTPVuIXtg8Rv9j9eLp8LL3+EPFL3nyA7wL45a4kSZIklVEYW7vAyrG1WZe8K1g+tjZbv5L4ma7W5XEbcWytNKvyobwLxFBdPmR3GjiJoTxJkiRJkiRJGpmxh/UyaWhvG/AY4FnAi4jBvd3ALuKXudmXwaeBh+l038tCfHcDD7I8wHcGvwyWJEmSNMd6jK3Nh+qykN3lxBG1xVBeNrZ2GyvH3W4GNuT2byhPmi1lQ3n3pMvdufWTGMqTJEmSJEmSpJGZWFgvc9NNN28gnvS5jjgW90XAZwFPI54k2ko8+bNEHJd7hk4w7xFigO8TdEJ8nwAeAE7ltm2nj70EfnEsSZIkafYVAnkbiCG6Ype8GrEL3lUsH1d7DXA1sDPdphjky8bW2iVPml1lQnnF8bWG8iRJkiRJkiRpgiYe1sukob2txBNITyMG9vYSA3zXEU8eZd0bsiIvAedZHuA7RQzr3U1nhO4ngPuI4b7Tue3PEkOAfsksSZIkaeoUAnkJsIlOmC4fyttO7FCeBfHywbxdxA553QJ5mzCQJ8261YTy8uNrz2AoT5IkSZIkSZIqUVlYL5OejNpK7PLwFOJo3BcBzwSuJ55kWujy0OKX09kX0lmA7yTxy+hP0Anx3QM8xPIAXxu4iF9KS5IkSZqQXCgvIX7eycJ4+UDeNuAKlnfHy5argB2F7bNlE46tldaDfqG8M+nyICs75fUK5fn9hyRJkiRJkiRVrPKwXiY9WbWZeNLpycALgc8BPgV4LPFEVLfQXlH2B7rI8i+wTwMPE7+0/nhuuZv4JXa3Mbp+gS1JkiRpVQpd8haIn3eKgbwacDnxc1C+Q9616W2XEUN7WwvLZpZ/PjKQJ82uXqG8M7nLYigv65R3srBd1inPUJ4kSZIkSZIkTaGpCetl0hNam4ArgScBe4ihvWcDjyOerNo45G6zP+QSMYR3Jrc8AtxPpwPfx9P1+1k+RvdM+ljH6EqSJEkCVgTyNrA8kJcP5m2nE8jLh/KuBnam23QbW7uAY2ul9aLbhICy42tP0vluIj++1lCeJEmSJEmSJM2QqQvrZdKTXhuBXcATgOcDn00M7T2WeEJrC6s/YZX/kvw8ywN8p4i/tX43y7vw3UvszpcP8GVjZPxiXJIkSVqH+gTy8qNrtxIDeVcSA3jFsbW7iB3yugXyNmEgT1pPyoTyeo2vPUmn47+hPEmSJEmSJElaZ6Y2rJdJT4wtAFcAjweeBbwA+HRi571riCfFhu2210tIl2yMbhbMOw08RPwC/WN0OvB9kvhlenGM7gX8Il2SJEmaCUME8nYQg3dX0wnlZeu70vuLnfW2EgN5G3LPYShPmn1lQ3n3pEu+U95DGMqTJEmSJEmSpLkz9WG9vJtuunmBGMy7BngiMbC3B3gmsdveLtbWba+X/BjdsywP8D0C3EcM7mUhvruJX8hnAT7H6EqSJEkVKxnIy0bWdgvkZR3ytrOyO97WdH8G8qT1p9iZ/yzLQ3aniONrs0BedmkoT5IkSZIkSZK0zEyF9TLpSbbNxFG4jwGeQafb3g3Ek2g7GF23vW6yv7hLxBBevgtffoxuNkr3bjpf1OcDfHbhkyRJkkZkQCAvP4K2WyAvC+UZyJPmU79QXvYLe8XxtflQ3hkM5UmSJEmSJEmS+pjJsF5e2m1vG/Gk2hOB5wAvJI7LzXfb29BrHyPUbQROPpj3MPFL/E/QCfF9ErvwSZIkSaX1CeQVl2EDeVkoz0CetL71CuVlYbtB42vPFLY/S/z8bihPkiRJkiRJktTXzIf1MukJu010uu09jU63vScB1wKXE7vtTfpkW36M7jmWh/KykwB3E0N8WZDvHmK4zy58kiRJmjuFQN4C8b3+oEBePoxnIE9St1BevvtdPpSX75R3H4byJEmSJEmSJEljsG7Cenm5bntXAY8DPhXYk14+Lr19G/GkX1XKdOG7h5WjdE9gFz5JkiTNuEIYLyG+N99CZ9xs/nIHMXh3FQbyJK2UfQ6+ROfzdX45DTzAyvG1+VBePsRnKE+SJEmSJEmSNBbrMqyXSU8AbiR21LuW2GHv04HnEzvvPYbYia94Eq9K/brwnSKG9fLhPbvwSZIkaSp1CeRtYnkIL1uvAZcBVxIDeFelS7a+k/jLNgbypPmWD+WdZ3m4rk38zFzslHcPMZR3kuWBPEN5kiRJkiRJkqSJW9dhvbybbrp5A/Fk3k7geuDpxNDec4khvmuIJwirGJM7yDBd+PKjdE8QOwi0c485C1zEkxGSJElao0IYD2J3vM2s7JC3hRi228nyQF7WHe9K4i/Y1OjeWW8TBvKkedIrlJd9rs065WWhvHvS5V46v8hmKE+SJEmSJEmSNHXmJqyXl47J3U48Qfh44NOIY3KfBTyWeLJwO9WOyS1jUBe+kyzvKPBJ4smLE3Qf82OIT5IkScv06Y7XbWTtduJY2mKHvKvS23awvCtePsxX/KUZA3nS+pcP5Z1j5fjaU8RQXj6Ql42v7RbKO4ehPEmSJEmSJEnSFJvLsF4mPfG4ic6Y3BuA5xBH5T6VOCZ3F/Ek4rSMyR2k2IUvGweULaeJY4HuZWWI72R6f/aYs+lyHk92SJIkrUtdwngLLA/jFcfVXkEnfHdVYf0KOt3xikG+zSz/ZRjDeNJ8yH+GzH7RLP85Nftls/tZ3invk+ltj9C7Ux7g51RJkiRJkiRJ0uyY67BeXmFM7mOA3cTQ3nOJIb5riScfNzM7wb28XiG+M7nLLMR3T+7yvvT2Yhe+NjHE5wkSSZKkKdYljLeR+J42P642H67bQfyFlatY2RlvF7F73tYuj83G1dodT5pP3UJ5xU55D9MJ5eWDefen9xW3zzrlAX7mlCRJkiRJkiTNPsN6XaRjcmvEE5LXA88gBveeDTyBONLrclaO6ppF/TrxnSWG9IonVO5NlweIXQ7yXfiy5UJu355UkSRJGpMeYbwtLA/jZes14DLiL6hk42rzy05iWC/fHS/fIW8TdseT5l0xlJd9Bsz/gtcjxF/8ygJ5WSgv/xky2/4shvIkSZIkSZIkSXPCsF4f6YnPBeIJy6uAxwGfAjwvvbyeeFJzB+sjuJeXD/EVuyJkgb5TLO/Gd3+6fj9xpO4ZVob4zgEXcayuJElSKV3CeJsYHMbLuuBll/n1fGe8Yne9bFSt3fEk9ftMmIXt8r/YdTedX/DKh/Lyi93ZJUmSJEmSJElzzbBeSelJ0k3EjnpXEzvsfSpxTO4ziKNzrySe/Cye4FxP8i+YS8STLcXOetl4owfoBPjuS5fieKMswJfvpmBHPkmSNBcKQTyADcT3nN1CdFkY73KWh/Hy6zuBbcQwXrcxt5vT5zCMJylTDOXlu63nQ3n5TnlZKO9+4DTLu+pln+0ugZ/pJEmSJEmSJEnKM6y3CjfddPMG4onOK4jBvScCn0YM7j2VGNzLupYUT4auZ906L2TdF/JBvoeIJ3XyAb77iV36HqZ7iO8cjtaVJEkzpksYb4H4PjK/5IN12+iE8bp1x9tJfI9ZDPFtye0vP6YW5ue9qKT+yoTyHiJ+RssCefnxtafp3inPUJ4kSZIkSZIkSSUZ1lujNLi3hRjcu5YY3Hs28BxicO864onVGvMV3CvKnxi6SCeIV+zI9widjnzZkl1/iP5BvkfHKYEniyRJ0niV6IqXD+RlgbptxPeNWfCu2B3vCuL7xmJnvPw+NxSed17fX0rqrvjZq1co7146gbxPptcfBE4Vtj+LoTxJkiRJkiRJkkbCsN4IpcG9rcQTr9cATyaG9p6Trl9DZzTZPAf38kJhPQvy5cN42cmlU8STR/kQ3wPpbSeJJ53yAb78coH05BJ4gkmSJPXXJYiX0Ani5QN4+fVtwGV0gng7WR7KuwLYQSeI1y2MtwnDeJLKKYbysmBdFsg7Q/yclIXy8p3yTtDplHeG5aG8AH5mkiRJkiRJkiRpHAzrjUka3KsRT8xeSwzrfVq6ZMG9XRjcG6Q4quk83TvrZeN1H+yyPJDed4buQT5H7EqSNEd6BPE2snI8bT6QVyMG8XayPIC3M7dcRgzideuqlx9Rm39+3wNKGiT/megCy0N5WdjuBN075eVDefnl0c8/fvaRJEmSJEmSJGlyDOtNwE033bxAPMG7kxjSuwH4VOK43N3EMN9OYDsG94ZR7Mp3gd5hvGzUUzHEl61nI3a7PfY8hvkkSZoJPYJ4C8SOdcUQXbbUiB3vdtI9hLcTuDzdrjiSNr9sYuX7ON/XSSor+4xxic4vKeUDdqdZGcq7B7iP7qG8sxjKkyRJkiRJkiRpqhjWm7A0uJcflfskOh33dtPpuLed2OHFE7yrl39xX2J5mC/foS8L851kZYjvQeKJr2KY73zuMgvzPTpmFzwZJknSKHUJ4UEM4eU74m3qsr6F+L7qClYG8LLRtFek2xTH2haDeI6nlbRW+c8IWefwfLjuDDF09wAxlJcF8rJQXtYxPP8YQ3mSJEmSJEmSJM0Iw3oVyo3K3QlcBTwBeBYxuPdU4DriSeTL6N6pRWtTDPNlAbxuS9bFIh/gO0EM+J0EHqYT5jvPyjDfiu584Ik0SZJg4FjafACveH0b8X1SFri7nE4XvPxt+Y543cbTbiIG/4o1SNJqFUN551g5ivYRYigv3yXvHuB+Op8vip3yljCUJ0mSJEmSJEnSzDKsNyXS4N4W4knlq4DHAs8kBveeDlxPDO5dTjypXOzsotEq/mBkXS/ynfXygbzsZNvJ3HKicP2RdLtuQb5zxDDfxeJzexJOkjSreoTwNtC7C14+RHdZuuykE7zLwnfZ+o5020099rMJg3iSxivkLpfodLrLAnZniJ8D7qcTxusXyssev5Q9gZ8HJEmSJEmSJElaPwzrTaE0uLeJeDL6SmJQ72nApxKDe49Lb7+C2FFmA550nrTiD04ghu2KAbz8ept4Mu4ky4N82fpDxBN5Zwv7KQb6Hu2mkfEEniRpkvqE8DYVlmJwbgvxvUs+cJfviJcP4dXoHubLry+w8j2Q74kkjUM+lHeR5YG8LJT3MHFUbTGU9wBwipWhvHMYypMkSZIkSZIkaa4Y1pty6cnwTXQ6y1wNPJnYde+ZwA3ANel9O3Bc7jQp/nBdohPoK3bWy247TQztPcTKznwn0ttP0wnuFcfsZusX0+d7lCf/JEn9dAngQQzgbWRlAK8YyttCDNddlluKgbwslLeN5d3wunXE28jKLsK+v5E0CflQ3gU6wbp8KO8kcC+dMN4n0+sn6ITy8o85T/re3PfkkiRJkiRJkiTNN8N6MyQ9ib4B2E484X0lscveM4BnEbvvXUdnXO5W4oltT25Pr27jdnsF+rIRvFnXjof6LNlJwm5Bvgu5yxVjd8GTiJK0XvQI4CXEMFwWwusWvstu20r8ZYAsfNfvcmthX7064nXrCOx7FUmTlr3fzX6hphiwOw08SCeU98n08j5iKO8MKzvlnc/26/tpSZIkSZIkSZLUjWG9GZWefE+InWkuJwb0rgOeQgzuPQN4PHAVMdi3ne6j4jT9QmH9Er0DePlg3yPpcpJOuC+//ggx1NctxFdcv0huRFfGk5CSNHl9AnjdxtB2C+BtIb4vuIwYxMvCdlewPHx3WbrdZnqH+vLLQo+6JKkq+feql4jvkYvja7NQXn5s7SeJobysq3U+kHeW+P7YUJ4kSZIkSZIkSRqaYb11Ij1xv5F40n0ncVzuk4ijcp9FHJ17DZ0T8Zux6956UvxBDsSAXbcgXz6Id5YY2HuEGOLLlkfoBPoeZnmnvuzxF+mE+fLLihG84IlMSeqlR/gOVo6g3djjMgvSbWXlGNpulztY2QWvW6gv677XKxwoSdMi/z5ziRjKaxeWU8ADrAzl3U98v1vslHeOXBdq38tKkiRJkiRJkqRRMKy3DuXG5dbojMt9LHFM7jOBpwLXE7vxXQFsw65786DbD/slVobuunXXO09n/G4W5uu2nCJ2HznL8lG7vUJ9F9IaHMUrad0oEb7rFsArhvA20+mAl42h3cHyjnjF+3oF8Iq3bUxrKfJ9gKRpF3KXF1geyss65j1MDOBl42uz5X7i+9ViiO8cMeBnKE+SJEmSJEmSJI2dYb05cNNNN28gnqi/jNh17ypi171npMsNxE58O9NttmDXvXnXrVPfEt1Dd8XlPPHEZ7cgXzHUl+/Yl4X38pe9but64PLkqqRR6xO8gxh0X2B5F7peAbz8+NkddEJ2/cJ4W1kZsuvXZc8xtJLWg+Lo2vMsH117lvhLJCeIo2qzUN696fIgy0fXZo/JQnmA7xslSZIkSZIkSVI1DOvNmTR0sECn694u4DrgKcSue08jduHbRRyXt4MYAvBkv7rpdgDJB/sGddXLOqKcoRPgeyS9zMJ8p3L3nU63Pcfy8N7F3HMu9bjv0ZOzRZ6sleZDn+Bd1pF2IytDd71u20QM020jBuyyZQfdw3g7iP/35kfMDgrgbcARtJLWr3yXvGx0bTGUd4oYvst3ybuXGNI7SXxfeDa3fdbd+RL4Hk+SJEmSJEmSJE0fw3pzLu26t4kYIriC2HXv8cRRuU8HdgPXErvuXY4jc7V6vQ422SjeXp30ipfZSN7ThcvibacL9/UK+BXXu11e6vcH80SwNDkDOt1lgfSNuctuS/G+fPBuBysDeNtz9+Wvb6F3V71ene8M30maN8XRtVmoLt/5rji6Nrt8gJWja7PHP9pt2fdikiRJkiRJkiRpVhjW06PSAMQGYmDhMmJ472rimNynEcN7T0xvuzzdpkbvzj/SWvQ6OGXdVy72WYqhvIt0OvjlQ33ZSd8zhevtwvWsC2Ax3DdoyW838GDriWatdwOCdpkNdA/cFW/rdlnsdretz5K/P+t416ujXq9uext6/Bn8P1HSvMm/h1li+eja7PIMsRteNq42P7r2BLGLXrGznqNrJUmSJEmSJEnSumJYTz3lRuZuJ4bzdhK77O0mdt57KrELXzYy9zJilyHDe6pKvwNasYNfv256xfVsLFsW4MtGruU7w5ztsbTpdPUrBvku0enct1RiPX996IO3J7g1rJLhOuiMkc2CdguF9XygrteSBeA2EwN3tdyyrXBZXLLbt7I8UNevu17x/n4jciVJUb5LXvYeKR/IaxNDdw/QCeJly33AQ3TeT+XfQ13A0bWSJEmSJEmSJGkOGNZTKWlgIyGGIPLhvcewPLx3PZ3w3g5ieC97rDStBh0Is6Bft3Bfme562fjeLPSXX/Lj4M4XtsvWs+V87vZi2K/MUnbb0GV9pDwR398QIblh5AN1+SUbzbrQ5/5eIbx8F7zNuWVrbtnC8vBd/ratudtqLB8rW6aTXvFy0Jh2/y+SpMHy/0dfYvn7lyxcd4YYvLuf5R3y7iUG9U6zvENe9ssLjq6VJEmSJEmSJElzzbCeViUX3ttMDOVdTgzpXU8M7z0tvXwMcZyu4T2tZ2UOpPmuePllUFe9XvdnI+bOEwN/gy4v0OnwdyF3X3G7/CjhfNiwGN7rFujLX/Zah+UBwMDKQGD+cWW276e4r1HLjmfFcajZbcVjXf62hOWP73W97Hp+/922WyAeszd1uczWu13PB/C2FNaz61vojIXt1z2vX1e9MmE7StwvSSon//9s9j6hOLr2FPAg/bvkFbsMnyP3/7ShPEmSJEmSJEmSpA7DehqJXHhvC3Ecbj6892Ri170nE8N7OzG8J/VS9qCcD8uV7Z43bGe9/OUSKwN8+VBfPui3VLgvP/aX3HahsO/Q5f5Lucfnt8/vr9/fUbavcUnoBM3yx7EFYuBtQ49t8wG6Yne4DeljFwr7yY9uXc3jhummV+yqN6izXtnx5x7rJWmy8u8rlujdJe8kMYCXLfeklw8SA3vFsbVnsUueJEmSJEmSJEnS0AzraSzS8N4GYhgv67y3k97hvcvS7bZSPvQhaThrOeD36553qcttZTvrUdiu+FzF7UNhGSS/n3FZa2e9fh3y8vf36r5XpvPeakPRHoslafoVx9aepxOoywfzHiGOqM0CeVmXvPtZ3iUv/5jz2CVPkiRJkiRJkiRpZAzraSK6hPcuI3beuw64gTgy98nEMN8uOuG9bcSuTWBoRFpP/M+nP493kqS8UFi/QPdA3mngBMsDeffT6ZJ3hpWd9c4Su+7ZJU+SJEmSJEmSJGnMDOupEoWxuTvS5QrgGuBJxPDeDcDjgauI4b3LiOG9jTg6V5IkSetPvqvsEisDeb3G1mbLA8Sxtd0edz63f0N5kiRJkiRJkiRJFTCsp6mQC+9tArbTCeddBTyR2HXvycAT0tsuJwb8tuPoXEmSJM2O/AewJeAc3QN5D9MZW3svywN5D7O8M14+kLeU7dxAniRJkiRJkiRJ0nQxrKeplIb3IHbR20YnvLcTeAyx+94N6eVj0tuzDn3biKE/MMAnSZKkySsG8s6zPFR3jhi2O0UnkFdcHmL52Nr8Yx1bK0mSJEmSJEmSNIMM62lmpAG+DcROevnue9cQO+5lAb786Nxi9z0wwCdJkqS169Uhr9gpLwvk3Z9bsg55J4iBvG5d8i5iIE+SJEmSJEmSJGldMaynmVUYnbuNGMzLuu9dTxyf+yRikC/ffW97umxOH294T5IkSd2E3GWZDnndAnkngdOsDPGdAy4Al7InM5QnSZIkSZIkSZK0vhnW07qRG527AagRA3nZaNyrgMfSCfA9ntiR73I64b1sfK4BPkmSpPkQCutZh7xisK5bIO++9DIL5OVH1ua77J3PP4+BPEmSJEmSJEmSpPllWE/rWi7At4nlAb7LgKuJob0nErvvPZbO+FwDfJIkSetD/gPPJWI3u3wgL1tvA48AD7IykHc/8BAxkJcP8mXrFzCQJ0mSJEmSJEmSpAEM62nuFMbnbs8tWYDvccQQ3xPS9XyAb1u6ZCN0wRCfJElSlfp1xyuG8s4Qu+A90GV5EHiYGNrLB/HyI2sN5EmSJEmSJEmSJGnVDOtp7uW67yXEEN42Vgb4HksM7z0+Xb+a2KEvH+DbQhzBm+1LkiRJo9GrO16+M14WrHsEOEFnZG0+kHcSON3jseeBixjIkyRJkiRJkiRJ0pgY1pO66BHgy0J8lwFXAtcTO+89jhjguwa4nOUBvhqwMbdrQ3ySJEnLFT+QZGG88yzvjneeGKrLuuNl42rzYbwTdLrjdRt1ez7dP2AYT5IkSZIkSZIkSZNlWE8qqRDg20QM4mUBvm3AFcB1xO57WYDvMcDOdJts+xp24ZMkSfOj+IFjiRiay8J4xVBeG3iIGLx7sMvlSWJ3vGJnvGxfdseTJEmSJEmSJEnSVDKsJ61RLsS3AGylE97Lj9F9DDG8d326XJ3el+/AVyOGAPOhQEmSpGlW/DAR6ITxikG8Yme8fAgvv/4Qnc54xcfbHU+SJEmSJEmSJEkzy7CeNAa5AN8G4hjdrKtetlwBXEsnvHc9MdB3JZ0ufNmyFUN8kiRp8voF8Xot54hd704Sw3f5MF4WyHuEGMbrFcS7QC6MBwbyJEmSJEmSJEmStD4Y1pMmqEsXvqyrXtaJbxcxxPeY3HJtenu+C99W7MQnSZJWr1sQ7yK9Q3gXiF3xTgEPE8N4J4ld8E7mlodZPqK2WyDPMbWSJEmSJEmSJEmaS4b1pIrlAnwJsJHlXfWyIN9Olof4rkuXLMSXD/BtJXbzW8g9jUE+SZLmQ7cQ3iVi2C4L3WXr53PrWRCvGL57KHf5EHGE7Tn6h/qWMIwnSZIkSZIkSZIkrWBYT5pSXUJ8WRgvW7YTx+leQwzy5ZergB0sH6VbA7ak+7IbnyRJs6Xbm/Yllofvul2eIwbsHiF2vXuoy+XJdL1NuSDeowziSZIkSZIkSZIkSeUZ1pNmTJcQ3xaWB/KyIN9VLA/wXQdcTQz4ZdtnyxZWBvnAMJ8kSePU7Y14No72Ip3QXTaethjGy0J4WfCuWxjv4XS7Yie9Ync9g3iSJEmSJEmSJEnSmBnWk9aJXIgPYAMxfJeF8bJw3jbgcmKQ75rccnV62+W5bfOPN8gnSVI5vQJ4+S54/ZZzwGliCO8UMWz3SO4yH8I7zcrAXbcg3qViXQbxJEmSJEmSJEmSpMkzrCfNgR7d+PJBvCzQlwX5rmZ5kO9KOkG+LT2WDRjmkyStT2U64GVL8XoWwGsTw3b54F1x/RFiAO8sywN4+aXYCc8QniRJkiRJkiRJkjQjDOtJc6zQjS8f5MuH+bJlB7CLGOa7Mr3M1nel9+dH6m4BNqeXm4AFDPNJkqrX681vvvtdMYTXLZR3nhisO5Uu+bBdPnz3cHp/vwBeMex3qVicITxJkiRJkiRJkiRp9hnWk9RToSPfAp3wXXHJuvJdWVh2pctOYDsrQ3ybc+sbid358gz0SZL66Re8u0QnYHexy1IM4Z0HztAJ4OVH0RZDeafSbc/RPWxXDPUZwJMkSZIkSZIkSZJkWE/S6gzoylcM5W0hdt7bSSfAt6tw/XI6nfk20QnyZcsmOh36igz1SdJs6/eGNOt41y1w1y14d5EYkDtLJ2SXhfDySxbCO8PK8N3FAZfZ+oq6DeBJkiRJkiRJkiRJ6sWwnqSx6BLmy3fm21xYz3fnu4IY4suvZ5eXpdvl97GJ5WG+zXTv0pfVIUkaj0FvKrNOd8XgXbcgXv62LHiXBe4GBe+yy3zwrl+wL3+965/BAJ4kSZIkSZIkSZKkUTCsJ6kShTAfxHBdPnBXDONlob4dxCDfTmKI74r0+mXp5eXpNlvpHubLX9+YLt1CfAb7JM2bQW8Ksw53WZCuuF68zAfusnGwbWKYrk0M1PVasu3OEIN6ZUbZ5q8v0WXsLBi8kyRJkiRJkiRJklQdw3qSplaXQF++Q18xiJcP5G0BttEJ8OWDfJcRA3470mU7K8N8GwuX+fUFegf5DPhJqkqZoN0lOiG6bkuvsF0+dJd1uGuny9ncerclH77Ld7ob1E2vWIsd7yRJkiRJkiRJkiTNPMN6kmZen1DfJrp31MsvWbBvR265jBjiy9bzwb5tdEbtdls2dbltge5jefP1SpovZd+AZQG7fNCuX+juYp/bzxHDdWdz6+3cbYOCd8WwXdkOe1n4rmunOzB0J0mSJEmSJEmSJGk+GNaTNDe6hPogBuWKQbtiN738ehbu20YnvLc9t76jy3219HH58F6/y+Jt/YJ+xT+LpNEZ5k1S1rkuW5a6rPcK23W77xKdsa7nCks2TrYYvMsH7oq3n6N/kK9Mh71L/f5ODNxJkiRJkiRJkiRJUn+G9SSpix7BPlge7ivbWW8TsJUY3qvllm1d1ou3baXTyW+BTnhvoc/1XrcNE/wr/pmlKq31zcqlwlIM1vVaugXueq1fJIboLqSX5wrr2eXZwnrxvvz1YsCuGPzrFb7rtvQN2oFhO0mSJEmSJEmSJEkaN8N6kjQiAwJ+GyjXRa94X76j39Z02UIM8OWvb+myTbfr+eDfhhEtSZ/bx8UA4dpM6j//LBQXcuv524vhueLlMLdl15e6XM861GXL+dz6xcL17P7stnNd1otBvOxxxUBdt/V+3fS6rZf6tzJoJ0mSJEmSJEmSJEnTz7CeJFWsT8gvk4XfynTOG9RtLx/825wu2ajfLMiXv9zUZyneX3zsAp0gX1JYzzr8dbsvKWyTFJb84yg8lsJjenUS7BUm7LavSckH0AZt0+32fvfl91vcrtf9+Trygbv844tBvOL6JWKILQugFdezy4t0AnXZ+hIxDFfcprht8TLf3e4iy0N03ZZuXfaK2/e7nl8vzXCdJEmSJEmSJEmSJM0fw3qStE6UCP1BJ4yWD/CNspteccm6A2ZBwex5N+XqKHYVXMhdz0J3G7tcX8hd35S7TmHfRflauv39FPc1KfkwWzeBToituE1238Uut2ed5bLHZM+TD9Zd6HF/sa7A8vDbxdy+s20u5bbpFeLr1UlvLR31+oXxhn6zY5hOkiRJkiRJkiRJkjRqhvUkSX2VDAF2U+yI16uL3oYut/XqpFfspkdhP72eu6hfZ71+HfnGqUxnvV7393tsMbBWHEcbetzfa/til71+QbyRMDgnSZIkSZIkSZIkSVoPDOtJkmbOGgKEwvCbJEmSJEmSJEmSJElVMKwnSZIkSZIkSZIkSZIkSdKYVTHmT5IkSZIkSZIkSZIkSZKkuWJYT5IkSZIkSZIkSZIkSZKkMTOsJ0mSJEmSJEmSJEmSJEnSmBnWkyRJkiRJkiRJkiRJkiRpzAzrSZIkSZIkSZIkSZIkSZI0Zob1JEmSJEmSJEmSJEmSJEkaM8N6kiRJkiRJkiRJkiRJkiSNmWE9SZIkSZIkSZIkSZIkSZLGzLCeJEmSJEmSJEmSJEmSJEljZlhPkiRJkiRJkiRJkiRJkqQxM6wnSZIkSZIkSZIkSZIkSdKYGdaTJEmSJEmSJEmSJEmSJGnMDOtJkiRJkiRJkiRJkiRJkjRmhvUkSZIkSZIkSZIkSZIkSRozw3qSJEmSJEmSJEmSJEmSJI2ZYT1JkiRJkiRJkiRJkiRJksbMsJ4kSZIkSZIkSZIkSZIkSWNmWE+SJEmSJEmSJEmSJEmSpDEzrCdJkiRJkiRJkiRJkiRJ0pgZ1pMkSZIkSZIkSZIkSZIkacwM60mSJEmSJEmSJEmSJEmSNGaG9SRJkiRJkiRJkiRJkiRJGjPDepIkSZIkSZIkSZIkSZIkjZlhPUmSJEmSJEmSJEmSJEmSxsywniRJkiRJkiRJkiRJkiRJY2ZYT5IkSZIkSZIkSZIkSZKkMTOsJ0mSJEmSJEmSJEmSJEnSmBnWkyRJkiRJkiRJkiRJkiRpzAzrSZIkSZIkSZIkSZIkSZI0Zob1JEmSJEmSJEmSJEmSJEkaM8N6kiRJkiRJkiRJkiRJkiSNmWE9SZIkSZIkSZIkSZIkSZLGzLCeJEmSJEmSJEmSJEmSJEljZlhPkiRJkiRJkiRJkiRJkqQxM6wnSZIkSZIkSZIkSZIkSdKYGdaTJEmSJEmSJEmSJEmSJGnMDOtJkiRJkiRJkiRJkiRJkjRmhvUkSZIkSZIkSZIkSZIkSRozw3qSJEmSJEmSJEmSJEmSJI2ZYT1JkiRJkiRJkiRJkiRJksbMsJ4kSZIkSZIkSZIkSZIkSWNmWE+SJEmSJEmSJEmSJEmSpDEzrCdJkiRJkiRJkiRJkiRJ0pgZ1pMkSZIkSZIkSZIkSZIkacwM60mSJEmSJEmSJEmSJEmSNGaG9SRJkiRJkiRJkiRJkiRJGjPDepIkSZIkSZIkSZIkSZIkjZlhPUmSJEmSJEmSJEmSJEmSxsywniRJkiRJkiRJkiRJkiRJY2ZYT5IkSZIkSZIkSZIkSZKkMTOsJ0mSJEmSJEmSJEmSJEnSmBnWkyRJkiRJkiRJkiRJkiRpzAzrSZIkSZIkSZIkSZIkSZI0Zob1JEmSJEmSJEmSJEmSJEkaM8N6kiRJkiRJkiRJkiRJkiSNmWE9SZIkSZIkSZIkSZIkSZLGzLCeJEmSJEmSJEmSJEmSJEljZlhPkiRJkiRJkiRJkiRJkqQxM6wnSZIkSZIkSZIkSZIkSdKYGdaTJEmSJEmSJEmSJEmSJGnMDOtJkiRJkiRJkiRJkiRJkjRmhvUkSZIkSZIkSZIkSZIkSRozw3qSJEmSJEmSJEmSJEmSJI2ZYT1JkiRJkiRJkiRJkiRJksbMsJ4kSZIkSZIkSZIkSZIkSWNmWE+SJEmSJEmSJEmSJEmSpDEzrCdJkiRJkiRJkiRJkiRJ0pgZ1pMkSZIkSZIkSZIkSZIkacwM60mSJEmSJEmSJEmSJEmSNGb/P+cQ0D/prbWDAAAAAElFTkSuQmCC" style="height:52px;width:auto;"/>
  <div class="header-text">
    <h1>Urlaubsübersicht ${pdfYear}</h1>
    <div class="sub">Therapie- &amp; Pflegezentrum Westlausitz</div>
  </div>
</div>
<div class="meta">
  Mitarbeiter: <strong>${user?.vorname} ${user?.nachname}</strong> &nbsp;|&nbsp;
  Position: ${posLabel(user?.position,user?.geschlecht)} &nbsp;|&nbsp;
  Erstellt am: ${new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"})}
</div>
<div class="sum">
  <div class="sum-box"><div class="sv">${user?.urlaubstage||30}</div><div class="sl">Urlaubstage gesamt</div></div>
  <div class="sum-box"><div class="sv">${fmtT(urlT+rstT)}</div><div class="sl">Genommen / Beantragt</div></div>
  <div class="sum-box"><div class="sv" style="color:${rem<0?"#dc2626":"#5a8a1f"}">${fmtT(rem)}</div><div class="sl">Verbleibend</div></div>
</div>
<table>
  <thead><tr><th>Typ</th><th>Von</th><th>Bis</th><th>Werktage</th><th>Beantragt am</th><th>Status</th></tr></thead>
  <tbody>${sorted.map(e=>`<tr>
    <td>${TL[e.type]||e.type}</td>
    <td>${fde(e.von)}</td>
    <td>${fde(e.bis)}</td>
    <td style="text-align:center;font-weight:bold">${fmtT(countWD(e.von,e.bis))}</td>
    <td>${e.created_at?new Date(e.created_at).toLocaleDateString("de-DE"):"—"}</td>
    <td><span class="${e.status==="confirmed"?"ok":"pend"}">${e.status==="confirmed"?"✓ Bestätigt":"⏳ Ausstehend"}</span></td>
  </tr>`).join("")}</tbody>
</table>
<div class="sig-area">
  <div class="sig-box">
    <div style="height:46px"></div>
    <div class="sig-label">Ort, Datum ________________ &nbsp;&nbsp; Unterschrift Mitarbeiter</div>
    <div class="sig-note">Ich bestätige die Richtigkeit meiner Urlaubsbeantragung.</div>
  </div>
  <div class="sig-box">
    <div style="height:44px"></div>Unterschrift Praxisleitung</div>
    <div class="sig-note">Genehmigt durch die Praxisleitung.</div>
  </div>
</div>
<div class="foot">Therapie- & Pflegezentrum Westlausitz · Urlaubsplaner · Erstellt am ${new Date().toLocaleDateString("de-DE")}</div><style>.np{position:fixed;top:10px;right:14px;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);}@media print{.np{display:none!important;}}</style><button class=np onclick=window.close()>Schliessen</button>
<script>window.onload=()=>window.print();</script>
</body></html>`);
            w.document.close();
          }} style={{background:"#475569",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            🖨 PDF / Drucken
          </button>
          <button style={{...S.addBtn,background:user?.color||"#5a8a1f"}} onClick={onAdd}>+ Urlaub beantragen</button>
          {!istPauschal(user)&&<button style={{...S.canBtn,fontWeight:700}} onClick={()=>setUeFormular(v=>!v)}>⏱ Überstunden melden</button>}
        </div>
      </div>
      {istPauschal(user)&&(
        <div style={{background:"#fff7ed",border:"1.5px solid #fcd9b0",borderRadius:10,padding:"12px 14px",marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:14,color:"#92400e",marginBottom:2}}>Pauschalkraft</div>
          <div style={{fontSize:12,color:"#b45309"}}>
            Für dich wird kein festes Urlaubskontingent geführt. Freie Tage kannst du normal eintragen —
            sie werden gezählt, aber nicht gegen einen Anspruch gerechnet. Bislang eingetragen: <strong>{fmtT(urlU+rstU)} Tage</strong> in {year}.
          </div>
        </div>
      )}
      {!istPauschal(user)&&<div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[["📅","Urlaubstage",user?.urlaubstage||30,false],["✈️","Genommen",urlU+rstU,false],["✅","Verbleibend",rem,rem<0],...(rstU>0?[["↩","Resturlaub",rstU,false]]:[]),...((user?.ueberstunden||0)>0?[["⏱","Überstunden",`${fmtT(ueU)}/${user.ueberstunden}`,false]]:[]),["⏱️","Std./Tag",fmtStd(stdProTag(user)),false]].map(([ic,lb,vl,warn])=>(
          <div key={lb} style={{background:"#fff",borderRadius:10,padding:"12px 16px",border:`1.5px solid ${warn?"#fca5a5":"#d4e6d8"}`,minWidth:90,boxShadow:"0 1px 4px rgba(61,122,79,0.06)"}}>
            <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
            <div style={{fontSize:20,fontWeight:800,color:warn?"#dc2626":"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{vl}</div>
            <div style={{fontSize:11,color:"#5a6b4a",fontWeight:600}}>{lb}</div>
          </div>
        ))}
      </div>}

      {/* Überstunden melden */}
      {ueFormular&&(
        <div style={{background:"#fff",border:"1.5px solid #d5e8a0",borderRadius:12,padding:16,marginBottom:20,boxShadow:"0 2px 8px rgba(61,122,79,0.06)"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#2d3a2e",marginBottom:4}}>⏱ Änderung der Überstunden beantragen</div>
          <div style={{fontSize:12,color:"#5a6b4a",marginBottom:12}}>
            Positive Zahl für geleistete Mehrarbeit, negative Zahl für Abbau. Bei dir entspricht
            ein Urlaubstag <strong>{fmtStd(stdTag)} Stunden</strong>.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:12,marginBottom:12}}>
            <div><label style={S.lbl}>Stunden</label>
              <input style={S.inp} type="text" inputMode="decimal" placeholder="z. B. 4 oder -2"
                value={ueStunden} onChange={e=>setUeStunden(e.target.value.replace(/[^0-9,.\-]/g,""))}/>
            </div>
            <div><label style={S.lbl}>Grund (optional)</label>
              <input style={S.inp} value={ueGrund} onChange={e=>setUeGrund(e.target.value)}
                placeholder="z. B. Samstagsdienst 15.08."/>
            </div>
          </div>
          {ueStunden&&!isNaN(parseFloat(String(ueStunden).replace(",",".")))&&stdTag>0&&(
            <div style={{fontSize:12,color:"#4a6b0f",background:"#f7fce8",border:"1px solid #d5e8a0",borderRadius:6,padding:"7px 10px",marginBottom:12}}>
              Entspricht {fmtT(Math.round((parseFloat(String(ueStunden).replace(",","."))/stdTag)*100)/100)} Urlaubstagen.
            </div>
          )}
          {ueFehler&&<div style={{fontSize:12,color:"#b91c1c",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:6,padding:"7px 10px",marginBottom:12}}>⚠️ {ueFehler}</div>}
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.savBtn,opacity:ueBusy?0.6:1}} onClick={ueAbsenden} disabled={ueBusy}>
              {ueBusy?"Wird gesendet…":"Antrag stellen"}
            </button>
            <button style={S.canBtn} onClick={()=>{setUeFormular(false);setUeFehler("");}}>Abbrechen</button>
          </div>
        </div>
      )}

      {/* Eigene Überstundenanträge — immer sichtbar, damit der Stand klar ist */}
      {!istPauschal(user)&&<div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#2d3a2e",marginBottom:8}}>
          ⏱ Meine Überstundenanträge
          {meineUeAntraege.filter(a=>a.status==="pending").length>0&&
            <span style={{marginLeft:8,fontSize:11,background:"#fef3c7",color:"#92400e",borderRadius:10,padding:"2px 8px"}}>
              {meineUeAntraege.filter(a=>a.status==="pending").length} offen
            </span>}
        </div>
        {meineUeAntraege.length===0?(
          <div style={{background:"#fff",border:"1px dashed #d5e8a0",borderRadius:10,padding:"14px 12px",fontSize:12,color:"#8aaa5f"}}>
            Noch keine Überstunden gemeldet. Über „⏱ Überstunden melden" oben kannst du eine Änderung beantragen.
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {meineUeAntraege.map(a=>{
              const tage=stdTag>0?Math.round((a.stunden/stdTag)*100)/100:null;
              const farbe=a.status==="confirmed"?"#7ab529":a.status==="rejected"?"#fca5a5":"#f0932b";
              return(
                <div key={a.id} style={{background:"#fff",border:"1.5px solid "+farbe,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <strong style={{fontSize:15,color:a.stunden<0?"#b45309":"#2d3a2e"}}>
                      {a.stunden>0?"+":""}{fmtStd(a.stunden)} Std.
                    </strong>
                    {tage!==null&&<span style={{fontSize:12,color:"#5a6b4a"}}>≙ {fmtT(tage)} Tage</span>}
                    <span style={{marginLeft:"auto"}}><StBadge status={a.status}/></span>
                    {a.status==="pending"&&(
                      <button style={{...S.icnBtn,color:"#f87171"}} title="Antrag zurückziehen"
                        onClick={()=>{if(window.confirm("Antrag zurückziehen?"))onUeZurueck(a.id);}}>🗑</button>
                    )}
                  </div>
                  {a.grund&&<div style={{fontSize:12,color:"#5a6b4a",marginTop:4}}>„{a.grund}"</div>}
                  <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>
                    Eingereicht: {a.created_at?new Date(a.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}
                    {a.status==="pending"&&" · wartet auf die Leitung"}
                    {a.entschieden_am&&" · entschieden am "+new Date(a.entschieden_am).toLocaleDateString("de-DE")}
                  </div>
                  {a.hinweis&&<div style={{fontSize:11,color:"#b45309",marginTop:4}}>Rückmeldung: {a.hinweis}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>}

      <div style={{background:"#fff",borderRadius:12,border:"1px solid #d5e8a0",overflow:"hidden",boxShadow:"0 2px 8px rgba(61,122,79,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8faf0"}}>{["Typ","Von","Bis","Tage","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {entries.length===0&&<tr><td colSpan={6} style={{...S.td,color:"#475569",textAlign:"center",padding:28}}>Noch keine Urlaubsanträge.</td></tr>}
            {[...entries].sort((a,b)=>a.von.localeCompare(b.von)).map(e=>(
              <tr key={e.id} style={{borderBottom:"1px solid #edf5ee"}}>
                <td style={S.td}><span style={{fontSize:11,background:ca(user?.color||"#2563EB",0.2),color:user?.color||"#2563EB",borderRadius:10,padding:"2px 8px"}}>{TL[e.type]||e.type}</span></td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.von)}</td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.bis)}</td>
                <td style={{...S.td,fontWeight:600,color:"#8aaa5f"}}>{fmtT(countWD(e.von,e.bis))}</td>
                <td style={{...S.td,fontSize:11,color:"#8aaa5f"}}>
                  {e.created_at?new Date(e.created_at).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}
                </td>
                <td style={S.td}>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      <StBadge status={e.status}/>
                      {(()=>{
                        // Prüfe Kollision mit anderen bestätigten Einträgen
                        const conflicts=allEntries.filter(o=>
                          o.id!==e.id&&
                          o.user_id!==e.user_id&&
                          o.status==="confirmed"&&
                          e.von<=o.bis&&e.bis>=o.von
                        );
                        if(conflicts.length===0)return(
                          <span style={{fontSize:10,color:"#15803d",fontWeight:600}}>✅ Frei</span>
                        );
                        return(
                          <div style={{background:"#fff7ed",border:"1px solid #f0932b",borderRadius:6,padding:"4px 7px",marginTop:2}}>
                            <div style={{fontSize:10,fontWeight:700,color:"#92400e",marginBottom:2}}>⚠ Kollision:</div>
                            {conflicts.map((o,i)=>{
                              const op=profiles.find(p=>p.id===o.user_id);
                              return(
                                <div key={i} style={{fontSize:10,color:"#b45309",display:"flex",alignItems:"center",gap:3}}>
                                  <div style={{width:6,height:6,borderRadius:"50%",background:op?.color||"#f0932b",flexShrink:0}}/>
                                  <span><strong>{op?.vorname||"?"}</strong> {fmtDE(o.von)}–{fmtDE(o.bis)}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                <td style={S.td}>
                  {e.status!=="confirmed"?(
                    <div style={{display:"flex",gap:6}}>
                      <button style={S.icnBtn} onClick={()=>onEdit(e)} title="Bearbeiten">✏️</button>
                      <button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>{if(window.confirm("Antrag löschen?"))onDelete(e.id);}} title="Löschen">🗑</button>
                    </div>
                  ):(
                    // Bestätigt: Änderungsantrag oder Stornierung beantragen
                    new Date(e.von)>new Date()?(
                      <div style={{display:"flex",gap:6}}>
                        <button style={{...S.icnBtn,background:"#fff7ed",color:"#92400e",border:"1px solid #f0932b",fontSize:11}} onClick={()=>onRequestChange(e)} title="Änderung beantragen">
                          🔄 Änderung
                        </button>
                        <button style={{...S.icnBtn,background:"#fff1f2",color:"#be123c",border:"1px solid #fca5a5",fontSize:11}} onClick={()=>onRequestDelete(e)} title="Stornierung beantragen">
                          ✕ Storno
                        </button>
                      </div>
                    ):<span style={{fontSize:10,color:"#8aaa5f"}}>Vergangen</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:10,fontSize:11,color:"#8aaa5f"}}>Bestätigte Einträge können nur vom Administrator bearbeitet werden.</div>
    </div>
  );
}

// ─── Ferien & Feiertage ───────────────────────────────────────────────────────
function FerView({year,state,stateName}){
  const[tab,setTab]=useState("ferien");
  const data=getSD(state,year);
  const ferien=data.ferien||[];
  const feiertage=Object.entries(data.feiertage||{}).sort(([a],[b])=>a.localeCompare(b));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div><h2 style={S.pgT}>Ferien & Feiertage {year}</h2><div style={{fontSize:13,color:"#64748b"}}>📍 {stateName}</div>
          {!ferienVorhanden(state,year)&&(
            <div style={{fontSize:12,color:"#92400e",background:"#fff7ed",border:"1px solid #fcd9b0",borderRadius:6,padding:"6px 10px",marginTop:8,maxWidth:520}}>
              Für {year} liegen noch keine Ferientermine vor. Die Feiertage sind berechnet.
              Sobald das Kultusministerium die Ferien veröffentlicht, werden sie beim nächsten Aufruf mit Internetverbindung automatisch geladen.
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:4,background:"#1e293b",borderRadius:8,padding:4}}>
          {[["ferien","🌸 Schulferien"],["feiertage","🎉 Feiertage"],["beides","📅 Alle"]].map(([id,lbl])=>(
            <button key={id} style={{...S.tabTgl,...(tab===id?S.tabTglAct:{})}} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>
      </div>
      {(tab==="ferien"||tab==="beides")&&ferien.length>0&&(
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f472b6",marginBottom:10}}>Schulferien ({ferien.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {ferien.map(([v,b,n],i)=>(
              <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 14px",border:"1px solid #d5e8a0",borderLeft:"4px solid #f9a8d4",boxShadow:"0 1px 4px rgba(61,122,79,0.06)"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#2d3a2e",marginBottom:3}}>{n}</div>
                <div style={{fontSize:12,color:"#5a6b4a"}}>{fmtDE(v)} – {fmtDE(b)}</div>
                <div style={{fontSize:11,color:"#8aaa5f",marginTop:3}}>{fmtT(countWD(v,b))} Werktage</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(tab==="feiertage"||tab==="beides")&&(
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#c9a07a",marginBottom:10}}>Feiertage ({feiertage.length})</div>
          <div style={{background:"#fff",borderRadius:10,border:"1px solid #d5e8a0",overflow:"hidden",boxShadow:"0 1px 4px rgba(61,122,79,0.06)"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f8faf0"}}><th style={S.th}>Datum</th><th style={S.th}>Tag</th><th style={S.th}>Feiertag</th></tr></thead>
              <tbody>{feiertage.map(([iso,name])=>(
                <tr key={iso} style={{borderBottom:"1px solid #edf5ee"}}>
                  <td style={{...S.td,fontFamily:"monospace",fontSize:12,color:"#92400e",fontWeight:600}}>{fmtDE(iso)}</td>
                  <td style={{...S.td,fontSize:12,color:isWE(...iso.split("-").map((v,j)=>j===1?parseInt(v)-1:parseInt(v)))?"#f87171":"#64748b"}}>{wday(iso)}</td>
                  <td style={{...S.td,fontWeight:500}}>{name}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profil ───────────────────────────────────────────────────────────────────
function ProfView({user,onSave,onChangePw,onDirtyChange}){
  // Nur Administratoren, Geschäfts- und Praxisleitung sowie Teamleitungen dürfen
  // Urlaubskonto und Überstunden pflegen — im eigenen Profil niemand ohne Leitungsrolle.
  const darfKontoAendern=istLeitung(user);
  // Zahlenfelder als String speichern → kein "0" Prefix Problem
  const[form,setForm]=useState({
    vorname:user?.vorname||"",
    nachname:user?.nachname||"",
    geburtsdatum:user?.geburtsdatum||"",
    position:user?.position||"",
    color:user?.color||"#5a8a1f",
    urlaubstage:String(user?.urlaubstage??30),
    ueberstunden:String(user?.ueberstunden??0),
  });
  const[pwMode,setPwMode]=useState(false);
  const[curPw,setCurPw]=useState("");
  const[npass,setNpass]=useState("");
  const[npass2,setNpass2]=useState("");
  const[pwMsg,setPwMsg]=useState("");
  const[showCur,setShowCur]=useState(false);
  const[showNew,setShowNew]=useState(false);
  const[busy,setBusy]=useState(false);
  const[saved,setSaved]=useState(false); // kurze Bestätigungsanzeige

  // Formularfelder überwachen → dirty melden
  const initialRef = useRef(null);
  useEffect(()=>{
    initialRef.current = {
      vorname:user?.vorname||"",nachname:user?.nachname||"",
      geburtsdatum:user?.geburtsdatum||"",position:user?.position||"",
      color:user?.color||"#5a8a1f",
      urlaubstage:String(user?.urlaubstage??30),
      ueberstunden:String(user?.ueberstunden??0),
    };
  },[user]);

  useEffect(()=>{
    if(!initialRef.current)return;
    const dirty=Object.keys(form).some(k=>form[k]!==initialRef.current[k]);
    onDirtyChange?.(dirty);
  },[form]);

  // Auf "Speichern und wechseln"-Event vom Dialog hören
  useEffect(()=>{
    async function handle(e){
      await doSave();
      // nach save wechselt App automatisch weil dirty=false gesetzt wurde
    }
    window.addEventListener("profil-save-and-leave",handle);
    return()=>window.removeEventListener("profil-save-and-leave",handle);
  },[form]);

  async function doSave(){
    setBusy(true);
    try{
      const daten={...form};
      if(darfKontoAendern){
        daten.urlaubstage=parseInt(form.urlaubstage)||0;
        daten.ueberstunden=parseInt(form.ueberstunden)||0;
      }else{
        // Geschützte Felder gar nicht erst übermitteln
        delete daten.urlaubstage;
        delete daten.ueberstunden;
        delete daten.color;
      }
      await onSave(user.id,daten);
      // Initialwerte aktualisieren
      initialRef.current={...form};
      onDirtyChange?.(false);
      setSaved(true);
      setTimeout(()=>setSaved(false),2500);
    }finally{setBusy(false);}
  }

  async function saveProfile(){ await doSave(); }

  async function changePw(){
    if(!curPw){setPwMsg("Bitte aktuelles Passwort eingeben.");return;}
    if(npass.length<6){setPwMsg("Mindestens 6 Zeichen.");return;}
    if(npass!==npass2){setPwMsg("Passwörter stimmen nicht überein.");return;}
    setBusy(true);
    try{await onChangePw(curPw,npass);setCurPw("");setNpass("");setNpass2("");setPwMode(false);setPwMsg("");}
    catch(e){setPwMsg(e.message);}
    finally{setBusy(false);}
  }

  function updateForm(key,val){
    setForm(f=>({...f,[key]:val}));
  }
  return(
    <div style={{maxWidth:580}}>
      <h2 style={{...S.pgT,marginBottom:20}}>Mein Profil</h2>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{...S.av,width:52,height:52,fontSize:20,background:form.color}}>{form.vorname?.[0]||"?"}</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{form.vorname} {form.nachname}</div>
            <div style={{fontSize:12,color:user?.role==="admin"?"#92400e":"#5a6b4a",fontWeight:600}}>{posLabel(user?.position,user?.geschlecht)} · {rolleLabel(user?.role)}</div>
            <div style={{fontSize:12,color:"#8aaa5f"}}>{user?.email}</div>
          </div>
        </div>

        {/* ── Stammdaten ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
          {/* Zeile 1: Vorname + Nachname */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={S.lbl}>Vorname</label>
              <input style={S.inp} value={form.vorname} onChange={e=>updateForm("vorname",e.target.value)}/>
            </div>
            <div><label style={S.lbl}>Nachname</label>
              <input style={S.inp} value={form.nachname} onChange={e=>updateForm("nachname",e.target.value)}/>
            </div>
          </div>
          {/* Zeile 2: Position */}
          <div><label style={S.lbl}>Position</label>
            <input style={{...S.inp,background:"#f1f5f0",color:"#5a6b4a"}} value={posLabel(user?.position,user?.geschlecht)} readOnly/>
            <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>Die Position legt die Berechtigungen fest und wird von der Leitung vergeben.</div>
          </div>
          <div><label style={S.lbl}>Arbeitszeit</label>
            <input style={{...S.inp,background:"#f1f5f0",color:"#5a6b4a"}} readOnly
              value={fmtStd(user?.wochenstunden||0)+" Std./Woche an "+(user?.arbeitstage_woche||5)+" Tagen  ·  "+fmtStd(stdProTag(user))+" Std./Tag"}/>
            <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>Änderungen an der Arbeitszeit nimmt die Leitung vor.</div>
          </div>
          {/* Zeile 3: Geburtsdatum alleine - iOS date braucht volle Breite */}
          <div style={{maxWidth:280}}>
            <label style={S.lbl}>Geburtsdatum</label>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input style={{...S.inp,flex:1}} type="date" value={form.geburtsdatum}
                onChange={e=>updateForm("geburtsdatum",e.target.value)}/>
              {alterAus(form.geburtsdatum)!==null&&(
                <span style={{fontSize:13,fontWeight:700,color:"#4a6b0f",background:"#f7fce8",
                  border:"1px solid #d5e8a0",borderRadius:8,padding:"7px 11px",whiteSpace:"nowrap"}}>
                  {tageBisGeburtstag(form.geburtsdatum)===0?"🎂 ":""}{alterAus(form.geburtsdatum)} J.
                </span>
              )}
            </div>
            {tageBisGeburtstag(form.geburtsdatum)===0&&(
              <div style={{fontSize:11,color:"#4a6b0f",marginTop:4,fontWeight:600}}>🎉 Alles Gute zum Geburtstag!</div>
            )}
          </div>
          {/* Zeile 3: Urlaubstage + Überstunden — nur von der Leitung änderbar */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={S.lbl}>Urlaubstage / Jahr</label>
              <input style={darfKontoAendern?S.inp:{...S.inp,background:"#f1f5f0",color:"#5a6b4a"}}
                type="text" inputMode="numeric" pattern="[0-9]*"
                readOnly={!darfKontoAendern}
                value={form.urlaubstage}
                onChange={e=>darfKontoAendern&&updateForm("urlaubstage",e.target.value.replace(/[^0-9]/g,""))}
                onFocus={e=>darfKontoAendern&&e.target.select()}/>
            </div>
            <div><label style={S.lbl}>Überstunden (Tage)</label>
              <input style={darfKontoAendern?S.inp:{...S.inp,background:"#f1f5f0",color:"#5a6b4a"}}
                type="text" inputMode="numeric" pattern="[0-9]*"
                readOnly={!darfKontoAendern}
                value={form.ueberstunden}
                onChange={e=>darfKontoAendern&&updateForm("ueberstunden",e.target.value.replace(/[^0-9]/g,""))}
                onFocus={e=>darfKontoAendern&&e.target.select()}/>
            </div>
          </div>
          {!darfKontoAendern&&(
            <div style={{fontSize:11,color:"#8aaa5f",marginTop:-4}}>
              🔒 Urlaubstage und Überstunden werden von der Leitung gepflegt. Bei Rückfragen bitte an die zuständige Leitung wenden.
            </div>
          )}
        </div>

        <div style={{marginBottom:16}}><label style={S.lbl}>Farbe</label>
          {!darfKontoAendern?(
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:form.color,
                boxShadow:"0 1px 3px rgba(0,0,0,0.2)",flexShrink:0}}/>
              <span style={{fontSize:12,color:"#8aaa5f"}}>
                🔒 Deine Kalenderfarbe wird von der Leitung vergeben.
              </span>
            </div>
          ):(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {PRESET_COLORS.map(c=>(
              <div key={c} onClick={()=>updateForm("color",c)}
                style={{width:32,height:32,borderRadius:6,background:c,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:form.color===c?"0 0 0 3px #2d3a2e, 0 0 0 5px "+c:"0 1px 3px rgba(0,0,0,0.2)",
                  transform:form.color===c?"scale(1.15)":"scale(1)",transition:"all .15s"}}>
                {form.color===c&&<span style={{color:"#fff",fontSize:16,fontWeight:900,textShadow:"0 1px 2px rgba(0,0,0,0.5)"}}>✓</span>}
              </div>
            ))}
            <div style={{position:"relative",width:32,height:32}}>
              <input type="color" value={form.color} onChange={e=>updateForm("color",e.target.value)}
                style={{width:32,height:32,border:"2px solid #d5e8a0",borderRadius:6,cursor:"pointer",padding:2}}/>
            </div>
          </div>
          )}
        </div>
        {saved&&<div style={{padding:"8px 14px",background:"#dcfce7",color:"#15803d",borderRadius:8,fontSize:13,fontWeight:600,marginBottom:8,border:"1px solid #86efac"}}>✅ Profil erfolgreich gespeichert!</div>}
        <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={saveProfile} disabled={busy}>{busy?"Speichern…":"Profil speichern"}</button>
        <div style={{marginTop:24,borderTop:"1px solid #edf5d8",paddingTop:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:pwMode?14:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#2d3a2e"}}>🔐 Passwort</div>
            <button style={S.canBtn} onClick={()=>{setPwMode(v=>!v);setPwMsg("");}}>{pwMode?"Abbrechen":"Passwort ändern"}</button>
          </div>
          {pwMode&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{position:"relative"}}><label style={S.lbl}>Aktuelles Passwort</label><input style={S.inp} type={showCur?"text":"password"} value={curPw} onChange={e=>setCurPw(e.target.value)}/><button onClick={()=>setShowCur(v=>!v)} style={{position:"absolute",right:10,top:27,background:"none",border:"none",color:"#64748b",cursor:"pointer"}}>{showCur?"🙈":"👁"}</button></div>
              <div style={{position:"relative"}}><label style={S.lbl}>Neues Passwort</label><input style={S.inp} type={showNew?"text":"password"} value={npass} onChange={e=>setNpass(e.target.value)}/><button onClick={()=>setShowNew(v=>!v)} style={{position:"absolute",right:10,top:27,background:"none",border:"none",color:"#64748b",cursor:"pointer"}}>{showNew?"🙈":"👁"}</button></div>
              <div><label style={S.lbl}>Neues Passwort bestätigen</label><input style={S.inp} type="password" value={npass2} onChange={e=>setNpass2(e.target.value)}/></div>
              <div style={{background:"#f8faf0",border:"1px solid #d5e8a0",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#5a6b4a",marginBottom:6,textTransform:"uppercase"}}>Passwort-Anforderungen</div>
                {[
                  ["Mindestens 8 Zeichen",npass.length>=8],
                  ["Ein Großbuchstabe (A-Z)",/[A-Z]/.test(npass)],
                  ["Ein Kleinbuchstabe (a-z)",/[a-z]/.test(npass)],
                  ["Eine Zahl (0-9)",/[0-9]/.test(npass)],
                ].map(([label,ok],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:11.5,marginBottom:3,color:ok?"#15803d":"#94a3b8"}}>
                    <span>{ok?"✅":"⬜"}</span><span>{label}</span>
                  </div>
                ))}
              </div>
              {pwMsg&&<div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"8px 12px",borderRadius:6}}>{pwMsg}</div>}
              <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={changePw} disabled={busy}>Passwort ändern</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Login-Daten Kopier-Button ────────────────────────────────────────────────
function CopyLoginButton({email, password, vorname}){
  const[copied,setCopied]=useState(false);
  async function copy(){
    const text=`Hallo ${vorname ? vorname+"," : ""}\n\nhier sind deine Zugangsdaten für den TZ Westlausitz Urlaubsplaner:\n\n🌐 Adresse: https://derkeili.github.io/Individuelles-Funktionstraining/\n📧 E-Mail: ${email}\n🔑 Passwort: ${password}\n\n📱 ALS APP AUF DEM SMARTPHONE SPEICHERN:\n\niPhone/iPad (Safari):\n1. Seite oben öffnen\n2. Teilen-Symbol ▢↑ antippen\n3. „Zum Home-Bildschirm" wählen\n4. „Hinzufügen" tippen → App erscheint auf dem Home-Bildschirm\n\nAndroid (Chrome):\n1. Seite oben öffnen\n2. Menü ⋮ antippen\n3. „App installieren" oder „Zum Startbildschirm hinzufügen" wählen\n4. Bestätigen → App erscheint auf dem Startbildschirm\n\nBitte melde dich beim ersten Login an und ändere dein Passwort unter „Profil".\n\nViele Grüße\nThomas Keilig`;
    try{
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(()=>setCopied(false),3000);
    }catch(e){
      // Fallback für ältere Browser
      const el=document.createElement("textarea");
      el.value=text;document.body.appendChild(el);el.select();
      document.execCommand("copy");document.body.removeChild(el);
      setCopied(true);setTimeout(()=>setCopied(false),3000);
    }
  }
  return(
    <button onClick={copy} style={{
      width:"100%",padding:"9px 14px",borderRadius:8,border:"1.5px solid #5a8a1f",
      background:copied?"#dcfce7":"#f8faf0",color:copied?"#15803d":"#5a8a1f",
      fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",
      display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:6
    }}>
      {copied?"✅ Kopiert! Jetzt in Nachricht einfügen":"📋 Login-Daten kopieren (für Nachricht an Mitarbeiter)"}
    </button>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({title,initial,isAdmin,onSave,onClose,onResetPw,usedColors=[],jahrHinweis=new Date().getFullYear()}){
  const[f,setF]=useState({
    vorname:initial?.vorname||"",nachname:initial?.nachname||"",
    email:initial?.email||"",role:initial?.role||"mitarbeiter",
    geschlecht:initial?.geschlecht||"d",
    pauschal:initial?.pauschal??false,
    fronleichnam:initial?.fronleichnam??false,
    wochenstunden:initial?.wochenstunden??40,
    arbeitstage_woche:initial?.arbeitstage_woche??5,
    color:initial?.color||PRESET_COLORS[0],position:initial?.position||"trainer",
    geburtsdatum:initial?.geburtsdatum||"",
    einstellungsdatum:initial?.einstellungsdatum||"",
    urlaubstage:String(initial?.urlaubstage??26),
    ueberstunden:String(initial?.ueberstunden??0),
    resturlaub:String(initial?.resturlaub??0),
    ...(initial?{id:initial.id}:{})
  });
  // Urlaubstage automatisch berechnen wenn Einstellungsdatum geändert wird
  function handleEinstellungsdatum(val){
    if(!val){
      setF(p=>({...p,einstellungsdatum:""}));
      return;
    }
    const auto=calcUrlaubstage(val);
    setF(p=>({...p,einstellungsdatum:val,urlaubstage:String(auto)}));
  }
  // Für neuen User: Passwort
  const[newUserPw,setNewUserPw]=useState("");
  const[showPw,setShowPw]=useState(false);
  // Admin-Passwort-Reset für bestehenden User
  const[showPwReset,setShowPwReset]=useState(false);
  const[adminPw,setAdminPw]=useState("");
  const[adminPw2,setAdminPw2]=useState("");
  const[pwErr,setPwErr]=useState("");
  const[resetSuccess,setResetSuccess]=useState(null);
  const[saveErr,setSaveErr]=useState("");
  const[start]=useState(()=>JSON.stringify({...(initial||{}),...{}}));
  const[busy,setBusy]=useState(false);

  // Zahlenfeld: beim Fokus leeren damit man direkt tippen kann
  function numFocus(e){if(e.target.value==="0")e.target.select();}

  async function save(){
    setSaveErr("");
    if(!f.vorname||!f.email){setSaveErr("Vorname und E-Mail sind Pflichtfelder.");return;}
    if(!f.email.includes("@")){setSaveErr("Bitte eine gültige E-Mail-Adresse eingeben.");return;}
    if(!initial&&!newUserPw){setSaveErr("Bitte ein Startpasswort für den neuen Mitarbeiter vergeben.");return;}
    if(!initial&&newUserPw.length<8){setSaveErr("Das Startpasswort muss mindestens 8 Zeichen lang sein.");return;}
    setBusy(true);
    try{
      await onSave({...f,email:f.email.trim().toLowerCase(),pauschal:!!f.pauschal,fronleichnam:!!f.fronleichnam,wochenstunden:f.pauschal?0:(parseFloat(f.wochenstunden)||0),arbeitstage_woche:f.pauschal?0:(parseInt(f.arbeitstage_woche)||5),urlaubstage:f.pauschal?0:(parseInt(f.urlaubstage)||0),ueberstunden:f.pauschal?0:(parseInt(f.ueberstunden)||0),resturlaub:f.pauschal?0:(parseInt(f.resturlaub)||0),geburtsdatum:f.geburtsdatum||null,einstellungsdatum:f.einstellungsdatum||null,...(!initial?{password:newUserPw}:{})});
    }catch(e){
      setSaveErr(e.message||"Speichern fehlgeschlagen.");
    }finally{setBusy(false);}
  }

  // Wurde etwas verändert? Vergleich gegen den Ausgangszustand
  function istGeaendert(){
    if(!initial)return Object.values(f).some(v=>v!==""&&v!==null&&v!==undefined);
    return Object.keys(f).some(k=>{
      const alt=initial[k]??"",neu=f[k]??"";
      return String(alt)!==String(neu);
    })||!!newUserPw;
  }
  async function schliessen(){
    if(!istGeaendert()){onClose();return;}
    const w=window.confirm("Es gibt ungespeicherte Änderungen.\n\nOK = speichern\nAbbrechen = verwerfen");
    if(w){await save();}else{onClose();}
  }

  async function saveAdminPwReset(){
    const pw=adminPw||generatePassword();
    if(pw.length<6){setPwErr("Mindestens 6 Zeichen.");return;}
    setBusy(true);
    try{
      await onResetPw(initial.id,pw);
      // Nachrichtentext erstellen und kopieren
      const text=`Hallo ${initial?.vorname},

dein Passwort für den TZ Westlausitz Urlaubsplaner wurde zurückgesetzt:

🌐 https://derkeili.github.io/Individuelles-Funktionstraining/
📧 E-Mail: ${initial?.email}
🔑 Neues Passwort: ${pw}

Bitte ändere dein Passwort nach dem ersten Login unter „Profil".

Viele Grüße
Thomas Keilig`;
      try{await navigator.clipboard.writeText(text);}catch(e){
        const el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
      }
      setShowPwReset(false);setAdminPw("");setAdminPw2("");setPwErr("");
      setResetSuccess({pw,email:initial?.email,vorname:initial?.vorname});
    }catch(e){setPwErr("Fehler: "+e.message);}
    finally{setBusy(false);}
  }

  return(
    <div style={S.overlay}>
      <div style={{...S.modal,maxHeight:"92vh",overflowY:"auto",width:520}}>
        <div style={S.mHd}><span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{title}</span><button style={S.clsBtn} onClick={schliessen}>✕</button></div>
        <div style={S.mBd}>

          {/* ── Stammdaten ── */}
          <div style={{fontSize:11,fontWeight:700,color:"#6a9e2f",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Stammdaten</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={S.lbl}>Vorname *</label><input style={S.inp} value={f.vorname} onChange={e=>setF(p=>({...p,vorname:e.target.value}))}/></div>
              <div><label style={S.lbl}>Nachname</label><input style={S.inp} value={f.nachname} onChange={e=>setF(p=>({...p,nachname:e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={S.lbl}>Geschlecht</label>
                <select style={S.inp} value={f.geschlecht} onChange={e=>setF(p=>({...p,geschlecht:e.target.value}))}>
                  {GESCHLECHTER.map(([k,l])=><option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>Position</label>
                <select style={S.inp} value={f.position} onChange={e=>setF(p=>({...p,position:e.target.value}))} disabled={!isAdmin}>
                  {POSITIONEN.map(pos=><option key={pos.key} value={pos.key}>{posLabel(pos.key,f.geschlecht)}</option>)}
                  {!POS_MAP[f.position]&&<option value={f.position}>{f.position} (alt)</option>}
                </select>
              </div>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:9,fontSize:13,color:"#2d3a2e",
              background:f.pauschal?"#f7fce8":"#f8faf0",border:"1.5px solid "+(f.pauschal?"#7ab529":"#d5e8a0"),
              borderRadius:8,padding:"10px 12px",cursor:"pointer",fontWeight:600}}>
              <input type="checkbox" checked={!!f.pauschal}
                onChange={e=>setF(p=>({...p,pauschal:e.target.checked}))} style={{width:17,height:17}}/>
              <span>Pauschalkraft — keine feste Stundenzahl, kein fester Urlaubsanspruch</span>
            </label>
            <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:13,color:"#2d3a2e",
              background:f.fronleichnam?"#f7fce8":"#f8faf0",border:"1.5px solid "+(f.fronleichnam?"#7ab529":"#d5e8a0"),
              borderRadius:8,padding:"10px 12px",cursor:"pointer",fontWeight:600}}>
              <input type="checkbox" checked={!!f.fronleichnam}
                onChange={e=>setF(p=>({...p,fronleichnam:e.target.checked}))} style={{width:17,height:17,marginTop:2,flexShrink:0}}/>
              <span>Fronleichnam ist ein Feiertag
                <div style={{fontWeight:400,fontSize:11,color:"#5a6b4a",marginTop:2}}>
                  In Sachsen nur in einzelnen Gemeinden des Landkreises Bautzen gesetzlicher Feiertag.
                  Ist der Haken gesetzt, kostet Fronleichnam für diese Person keinen Urlaubstag.
                </div>
              </span>
            </label>
            {!f.pauschal?(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={S.lbl}>Wochenarbeitszeit (Std.)</label>
                  <input style={S.inp} type="number" min="0" max="60" step="0.5" value={f.wochenstunden}
                    onChange={e=>setF(p=>({...p,wochenstunden:e.target.value}))}/>
                </div>
                <div><label style={S.lbl}>Arbeitstage pro Woche</label>
                  <select style={S.inp} value={f.arbeitstage_woche} onChange={e=>setF(p=>({...p,arbeitstage_woche:e.target.value}))}>
                    {WOCHENTAGE_AUSWAHL.map(n=><option key={n} value={n}>{n} {n===1?"Tag":"Tage"}</option>)}
                  </select>
                </div>
              </div>
              <div style={{fontSize:12,color:"#4a6b0f",background:"#f7fce8",borderRadius:6,padding:"6px 10px",border:"1px solid #d5e8a0"}}>
                ⏱ Ein Urlaubstag entspricht <strong>{fmtStd(stdProTag(f))} Stunden</strong>
                {f.ueberstunden>0&&<> · Überstundenkonto: {fmtT(f.ueberstunden)} T ≈ {fmtStd(tageInStd(f.ueberstunden,f))} Std.</>}
              </div>
            </>):(
              <div style={{fontSize:12,color:"#92400e",background:"#fff7ed",borderRadius:6,padding:"8px 10px",border:"1px solid #fcd9b0"}}>
                Für Pauschalkräfte werden Arbeitszeit, Urlaubsanspruch und Überstundenkonto nicht geführt.
                Freie Tage lassen sich weiterhin im Kalender eintragen — sie werden nur gezählt, nicht gegen ein Kontingent gerechnet.
              </div>
            )}
            <div style={{fontSize:12,color:"#5a6b4a",background:"#f8faf0",borderRadius:6,padding:"6px 10px",border:"1px solid #d5e8a0"}}>
              {(()=>{
                const sc=posInfo(f.position).scope,br=posInfo(f.position).bereich;
                if(sc==="alle")return "🔑 Darf alle Mitarbeiter und Leitungen sehen und bearbeiten.";
                if(sc==="bereich")return "🔑 Darf alle Mitarbeiter im Bereich "+(BEREICH_NAME[br]||"–")+" bearbeiten, Urlaub eintragen, genehmigen und ablehnen.";
                return "👤 Sieht und bearbeitet nur den eigenen Urlaub und die eigenen Stammdaten.";
              })()}
            </div>
            <div style={{maxWidth:280}}><label style={S.lbl}>Geburtsdatum</label>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <input style={{...S.inp,flex:1}} type="date" value={f.geburtsdatum} onChange={e=>setF(p=>({...p,geburtsdatum:e.target.value}))}/>
                {alterAus(f.geburtsdatum)!==null&&(
                  <span style={{fontSize:13,fontWeight:700,color:"#4a6b0f",background:"#f7fce8",
                    border:"1px solid #d5e8a0",borderRadius:8,padding:"7px 11px",whiteSpace:"nowrap"}}>
                    {alterAus(f.geburtsdatum)} J.
                  </span>
                )}
              </div>
            </div>
            {/* Einstellungsdatum: nur für Admin sichtbar */}
            {isAdmin&&(
              <div>
                <label style={S.lbl}>📅 Einstellungsdatum</label>
                <div style={{maxWidth:240}}>
                  <input style={S.inp} type="date" value={f.einstellungsdatum}
                    onChange={e=>handleEinstellungsdatum(e.target.value)}/>
                </div>
                {f.einstellungsdatum&&(
                  <div style={{marginTop:6,fontSize:12,color:"#5a6b4a",background:"#f8faf0",borderRadius:6,padding:"6px 10px",border:"1px solid #d5e8a0"}}>
                    💡 Betriebszugehörigkeit: <strong>{(()=>{
                      const j=calcUrlaubstage(f.einstellungsdatum);
                      const einDate=new Date(f.einstellungsdatum);
                      const jahre=new Date().getFullYear()-einDate.getFullYear();
                      return jahre<=0?"1. Jahr (Eintrittsjahr)":`${jahre}. Jahr → ${j} Urlaubstage vorgeschlagen`;
                    })()}</strong>
                  </div>
                )}
              </div>
            )}
            {!f.pauschal&&(<>
            <div style={{fontSize:12,color:"#92400e",background:"#fff7ed",border:"1px solid #fcd9b0",borderRadius:6,padding:"7px 10px"}}>
              💡 Urlaubsanspruch und Resturlaub gelten ab sofort <strong>je Kalenderjahr</strong>.
              Die Werte hier betreffen das im Kopf gewählte Jahr <strong>{jahrHinweis}</strong>.
            </div>
            <div><label style={S.lbl}>Urlaubstage / Jahr</label>
              <input style={S.inp} type="text" inputMode="numeric" pattern="[0-9]*"
                value={f.urlaubstage}
                onFocus={e=>e.target.select()}
                onChange={e=>setF(p=>({...p,urlaubstage:e.target.value.replace(/[^0-9]/g,"")}))}/>
            </div>
            <div><label style={S.lbl}>Überstunden (Tage)</label>
              <input style={S.inp} type="text" inputMode="numeric" pattern="[0-9]*"
                value={f.ueberstunden}
                onFocus={e=>e.target.select()}
                onChange={e=>setF(p=>({...p,ueberstunden:e.target.value.replace(/[^0-9]/g,"")}))}/>
            </div>
            <div><label style={S.lbl}>Resturlaub Vorjahr</label>
              <input style={S.inp} type="text" inputMode="numeric" pattern="[0-9]*"
                value={f.resturlaub}
                onFocus={e=>e.target.select()}
                onChange={e=>setF(p=>({...p,resturlaub:e.target.value.replace(/[^0-9]/g,"")}))}/>
            </div>
            </>)}
            {isAdmin&&<div><label style={S.lbl}>Berechtigung</label>
              <select style={S.inp} value={f.role} onChange={e=>setF(p=>({...p,role:e.target.value}))}>
                {ROLLEN.map(([k,l])=><option key={k} value={k}>{l}</option>)}
              </select>
              <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>
                {f.role==="admin"?"Administrator: alle Berechtigungen im gesamten Urlaubsplaner.":"Mitarbeiter: Rechte richten sich nach der Position."}
              </div>
            </div>}
          </div>

          {/* ── Farbe ── */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <label style={S.lbl}>Farbe</label>
              <div style={{display:"flex",alignItems:"center",gap:6,background:"#f8faf0",borderRadius:8,padding:"4px 10px",border:"1px solid #d5e8a0"}}>
                <div style={{width:18,height:18,borderRadius:4,background:f.color}}/>
                <span style={{fontSize:12,fontWeight:600,color:"#5a6b4a"}}>{f.color}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
              {PRESET_COLORS.map(c=>{
                const isUsed=usedColors.includes(c)&&f.color!==c;
                return(
                  <div key={c}
                    onClick={()=>!isUsed&&setF(p=>({...p,color:c}))}
                    title={isUsed?"Diese Farbe ist bereits vergeben":""}
                    style={{width:32,height:32,borderRadius:6,background:c,
                      cursor:isUsed?"not-allowed":"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      opacity:isUsed?0.3:1,
                      boxShadow:f.color===c?"0 0 0 3px #2d3a2e, 0 0 0 5px "+c:"0 1px 3px rgba(0,0,0,0.2)",
                      transform:f.color===c?"scale(1.15)":"scale(1)",
                      transition:"all .15s",
                      position:"relative",
                    }}>
                    {f.color===c&&<span style={{color:"#fff",fontSize:16,fontWeight:900,textShadow:"0 1px 2px rgba(0,0,0,0.5)"}}>✓</span>}
                    {isUsed&&<span style={{color:"#fff",fontSize:14,fontWeight:900}}>✗</span>}
                  </div>
                );
              })}
              <div style={{position:"relative",width:32,height:32}}>
                <input type="color" value={f.color} onChange={e=>setF(p=>({...p,color:e.target.value}))}
                  style={{width:32,height:32,border:"2px solid #d5e8a0",borderRadius:6,cursor:"pointer",padding:2}}/>
                <span style={{position:"absolute",bottom:-14,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"#8aaa5f",whiteSpace:"nowrap"}}>Eigene</span>
              </div>
            </div>
          </div>

          {/* ── Zugangsdaten (separater Bereich) ── */}
          <div style={{borderTop:"1px solid #334155",paddingTop:14,marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6a9e2f",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>🔐 Zugangsdaten</div>

            {/* E-Mail */}
            <div style={{marginBottom:12}}><label style={S.lbl}>E-Mail-Adresse *</label>
              <input style={S.inp} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/>
            </div>

            {/* Neuer User: Passwort mit Generator */}
            {!initial&&(
              <div>
                <label style={S.lbl}>Passwort *</label>
                {/* Generator-Button immer sichtbar, groß und auffällig */}
                <button onClick={()=>{const pw=generatePassword();setNewUserPw(pw);}}
                  style={{width:"100%",padding:"11px 14px",background:"#5a8a1f",color:"#fff",border:"none",
                    borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    boxShadow:"0 2px 6px rgba(90,138,31,0.3)"}}>
                  🔑 Sicheres Passwort automatisch generieren
                </button>
                {/* Passwort-Anzeige mit Kopier-Möglichkeit */}
                {newUserPw&&(
                  <>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                      <div style={{flex:1,background:"#f8faf0",border:"1.5px solid #5a8a1f",borderRadius:8,
                        padding:"10px 14px",fontFamily:"monospace",fontSize:15,letterSpacing:"0.08em",
                        color:"#2d3a2e",fontWeight:700}}>
                        {newUserPw}
                      </div>
                      <button onClick={()=>setNewUserPw(generatePassword())}
                        title="Neues Passwort generieren"
                        style={{background:"#f8faf0",border:"1.5px solid #d5e8a0",borderRadius:8,
                          padding:"10px 10px",cursor:"pointer",fontSize:16}}>
                        🔄
                      </button>
                    </div>
                    {f.email&&<CopyLoginButton email={f.email} password={newUserPw} vorname={f.vorname}/>}
                  </>
                )}
                {!newUserPw&&(
                  <div style={{fontSize:11,color:"#f97316",marginTop:4,fontWeight:600}}>
                    ⚠ Bitte erst Passwort generieren
                  </div>
                )}
              </div>
            )}

            {/* Bestehender User: Admin kann Passwort zurücksetzen */}
            {initial&&isAdmin&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#64748b"}}>Passwort des Mitarbeiters zurücksetzen</span>
                  <button onClick={()=>{setShowPwReset(v=>!v);setPwErr("");}} style={{...S.canBtn,fontSize:11,padding:"4px 10px"}}>
                    {showPwReset?"Abbrechen":"Passwort zurücksetzen"}
                  </button>
                </div>
                {showPwReset&&(
                  <div style={{marginTop:10,padding:12,background:"#f8faf0",borderRadius:8,border:"1px solid #d5e8a0",display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{fontSize:11,color:"#92400e",marginBottom:2}}>⚠ Als Admin kannst du das Passwort ohne das alte Passwort zurücksetzen.</div>
                    <div><label style={S.lbl}>Neues Passwort</label>
                      <input style={S.inp} type="password" value={adminPw} onChange={e=>setAdminPw(e.target.value)} placeholder="Mindestens 6 Zeichen"/>
                    </div>
                    <div><label style={S.lbl}>Neues Passwort bestätigen</label>
                      <input style={S.inp} type="password" value={adminPw2} onChange={e=>setAdminPw2(e.target.value)}/>
                    </div>
                    {pwErr&&<div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"6px 10px",borderRadius:6}}>{pwErr}</div>}
                    {/* Auto-Generieren Button */}
                    <button onClick={()=>setAdminPw(generatePassword())}
                      style={{width:"100%",padding:"9px",background:"#5a8a1f",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:6}}>
                      🔑 Neues Passwort automatisch generieren
                    </button>
                    {adminPw&&(
                      <div style={{background:"#f8faf0",border:"1.5px solid #5a8a1f",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:15,letterSpacing:"0.08em",color:"#2d3a2e",fontWeight:700,marginBottom:6}}>
                        {adminPw}
                      </div>
                    )}
                    <button style={{...S.savBtn,width:"100%",opacity:(busy||!adminPw)?0.6:1}} onClick={saveAdminPwReset} disabled={busy||!adminPw}>
                      {busy?"Wird gesetzt…":"✓ Passwort setzen & Nachrichtentext kopieren 📋"}
                    </button>
                    {resetSuccess&&(
                      <div style={{marginTop:10,background:"#f0fdf4",border:"1.5px solid #22c55e",borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#15803d",marginBottom:6}}>✅ Passwort zurückgesetzt!</div>
                        <div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:"#2d3a2e",marginBottom:8}}>{resetSuccess.pw}</div>
                        <CopyLoginButton email={resetSuccess.email} password={resetSuccess.pw} vorname={resetSuccess.vorname}/>
                        <div style={{fontSize:11,color:"#5a6b4a",marginTop:6}}>Nachrichtentext wurde kopiert → einfügen & senden.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {saveErr&&(
          <div style={{margin:"0 20px",padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,color:"#B91C1C",fontSize:14,lineHeight:1.4}}>
            ⚠️ {saveErr}
          </div>
        )}
        <div style={S.mFt}>
          <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={save} disabled={busy}>{busy?"Speichert…":"Speichern"}</button>
          <button style={S.canBtn} onClick={schliessen}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({title,year,isAdmin,initial,onSave,onClose,allEntries,currentUserId,kontingent,zielBereich,bereichVon,zielUserId,zielUser}){
  const[type,setType]=useState(initial?.type||"urlaub");
  const[von,setVon]=useState(initial?.von||"");
  const[bis,setBis]=useState(initial?.bis||"");
  const zeitraumGesetzt=!!von&&!!bis;
  const[note,setNote]=useState(initial?.note||"");
  const[busy,setBusy]=useState(false);
  const[conflicts,setConflicts]=useState([]);
  const[quelle,setQuelle]=useState("");        // Ausgleich für fehlende Urlaubstage
  const wd=countWD(von,bis,zielUser);
  const feiertageImZeitraum=besondereTage(von,bis,zielUser);

  // ── Urlaubskonto prüfen ──────────────────────────────────────────
  const k=kontingent||null;
  const restJahr   =k?Math.max(0,Math.round((k.urlaubstage -k.genutztUrlaub)*2)/2):0;
  const restVorjahr=k?Math.max(0,Math.round((k.resturlaub  -k.genutztRest )*2)/2):0;
  const restUeber  =k?Math.max(0,Math.round((k.ueberstunden-k.genutztUeber)*2)/2):0;
  // Nur beim Neuanlegen von normalem Urlaub prüfen
  const pruefen=!!k&&!initial&&type==="urlaub"&&wd>0&&zeitraumGesetzt;
  // Resturlaub wird zuerst verbraucht, deshalb zählt er zum verfügbaren Vorrat
  const verfuegbar=Math.round((restJahr+restVorjahr)*2)/2;
  const fehlend=pruefen?Math.max(0,Math.round((wd-verfuegbar)*2)/2):0;
  // Überstundenabbau ist jederzeit möglich und belastet den Urlaubsanspruch nicht
  const ueberzogen=(!initial&&type==="ueberstunden"&&k&&zeitraumGesetzt)?Math.max(0,Math.round((wd-restUeber)*2)/2):0;
  const ausgleichMoeglich=restUeber;
  const gewaehlteReserve=quelle==="ueberstunden"?restUeber:0;
  // Eigene Doppelbuchung: überschneidet sich der Zeitraum mit einem eigenen Eintrag?
  const eigeneUeberschneidung=(()=>{
    const uid=zielUserId||currentUserId;
    if(!uid||!von||!bis||bis<von)return [];
    return (allEntries||[]).filter(e=>
      e.user_id===uid&&
      e.id!==initial?.id&&
      e.status!=="rejected"&&
      von<=e.bis&&bis>=e.von
    );
  })();
  const doppelt=eigeneUeberschneidung.length>0;

  const blockiert=!zeitraumGesetzt||doppelt||wd===0||ueberzogen>0||(fehlend>0&&(ausgleichMoeglich<=0||!quelle||gewaehlteReserve<fehlend));

  // Gibt es nur eine mögliche Ausgleichsquelle, direkt vorauswählen —
  // sonst bleibt der Speichern-Knopf ohne erkennbaren Grund gesperrt.
  useEffect(()=>{
    if(fehlend>0&&restUeber>=fehlend)setQuelle("ueberstunden");
    else setQuelle("");
  },[von,bis,type,fehlend,restUeber]);

  // Konflikt-Prüfung in Echtzeit
  useEffect(()=>{
    if(!von||!bis||bis<von||(allEntries||[]).length===0){setConflicts([]);return;}
    const cf=(allEntries||[]).filter(e=>
      e.status==="confirmed"&&
      e.user_id!==(zielUserId||currentUserId)&&
      e.id!==initial?.id&&
      von<=e.bis&&bis>=e.von&&
      // Nur derselbe Fachbereich zählt als Überschneidung
      (!bereichVon||!zielBereich||bereichVon(e.user_id)===zielBereich)
    );
    setConflicts(cf);
  },[von,bis,allEntries,currentUserId]);

  async function save(){
    if(!von||!bis||bis<von){alert("Bitte gültige Daten wählen.");return;}
    if(doppelt){alert("Für diesen Zeitraum ist bereits ein Eintrag vorhanden.");return;}
    if(blockiert)return;
    if(conflicts.length>0&&!isAdmin){
      const ok=window.confirm(`⚠ Überschneidung mit ${conflicts.length} bestätigtem Urlaub im selben Fachbereich.\nTrotzdem beantragen?`);
      if(!ok)return;
    }
    // Aufteilung des Zeitraums: erst Resturlaub aus dem Vorjahr, dann Jahresurlaub,
    // zuletzt der gewählte Ausgleich. Bei "Überstunden abbauen" bleibt alles unberührt.
    let pakete=[{type,von,bis,note}];
    if(type==="urlaub"){
      const stufen=[];
      if(restVorjahr>0)stufen.push({typ:"resturlaub",menge:Math.min(restVorjahr,wd),
        text:"Resturlaub aus dem Vorjahr (wird zuerst verbraucht)"});
      const nachRest=Math.max(0,wd-(restVorjahr>0?Math.min(restVorjahr,wd):0));
      if(nachRest>0)stufen.push({typ:"urlaub",menge:Math.min(restJahr,nachRest),text:null});
      const offen=Math.max(0,nachRest-Math.min(restJahr,nachRest));
      if(offen>0&&quelle)stufen.push({typ:quelle,menge:offen,
        text:"Ausgleich aus "+(quelle==="resturlaub"?"Resturlaub":"Überstunden")});

      const echte=stufen.filter(x=>x.menge>0);
      if(echte.length>1){
        pakete=[];
        let start=von,verbraucht=0;
        for(let i=0;i<echte.length;i++){
          const st=echte[i];
          verbraucht+=st.menge;
          const letzterTag=i===echte.length-1?bis:splitDatum(von,bis,verbraucht);
          if(!letzterTag)break;
          pakete.push({type:st.typ,von:start,bis:letzterTag,
            note:st.text?((note?note+" · ":"")+st.text):note});
          if(i<echte.length-1)start=naechsterTag(letzterTag);
        }
      }else if(echte.length===1&&echte[0].typ!=="urlaub"){
        pakete=[{type:echte[0].typ,von,bis,
          note:echte[0].text?((note?note+" · ":"")+echte[0].text):note}];
      }
    }
    setBusy(true);try{await onSave(pakete);}finally{setBusy(false);}
  }
  return(
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.mHd}><span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{title}</span><button style={S.clsBtn} onClick={onClose}>✕</button></div>
        <div style={S.mBd}>
          {/* 1. Zeitraum wählen */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={S.lbl}>Von</label><input style={S.dateInp} type="date" value={von} onChange={e=>{setVon(e.target.value);if(e.target.value>bis)setBis(e.target.value);}}/></div>
            <div><label style={S.lbl}>Bis</label><input style={S.dateInp} type="date" value={bis} min={von} onChange={e=>setBis(e.target.value)}/></div>
          </div>

          {/* 2. Erst danach entscheiden, wovon abgezogen wird */}
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>Wovon soll der Zeitraum abgezogen werden?</label>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:5}}>
              {[["urlaub","🏖 Urlaub",restVorjahr>0?"Resturlaub aus dem Vorjahr wird automatisch zuerst genutzt":"Vom Jahresurlaub",k?fmtT(verfuegbar)+" T verfügbar":null],
                ["ueberstunden","⏱ Überstunden",k&&k.stdProTag>0?"Belastet den Urlaubsanspruch nicht":"Belastet den Urlaubsanspruch nicht",k?fmtT(restUeber)+" T verfügbar"+(k.stdProTag>0?" (≈ "+fmtStd(restUeber*k.stdProTag)+" Std.)":""):null]
              ].map(([wert,titel,erklaerung,vorrat])=>{
                const aktiv=type===wert;
                const leer=k&&((wert==="urlaub"&&verfuegbar<=0)||(wert==="ueberstunden"&&restUeber<=0));
                return(
                  <label key={wert} style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",
                    background:aktiv?"#f7fce8":"#fff",border:"1.5px solid "+(aktiv?"#7ab529":"#d5e8a0"),
                    borderRadius:8,padding:"9px 11px",opacity:leer&&!aktiv?0.55:1}}>
                    <input type="radio" name="abzugsquelle" checked={aktiv}
                      onChange={()=>setType(wert)} style={{marginTop:3,flexShrink:0}}/>
                    <span style={{flex:1,minWidth:0}}>
                      <span style={{fontWeight:700,fontSize:13,color:"#2d3a2e"}}>{titel}</span>
                      {vorrat&&<span style={{fontSize:12,color:leer?"#dc2626":"#4a6b0f",fontWeight:600}}> · {vorrat}</span>}
                      <div style={{fontSize:11,color:"#8aaa5f",marginTop:1}}>{erklaerung}</div>
                    </span>
                  </label>
                );
              })}
              {initial&&type==="resturlaub"&&(
                <div style={{fontSize:12,color:"#8aaa5f"}}>Dieser Eintrag läuft als Resturlaub aus dem Vorjahr.</div>
              )}
            </div>
          </div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Hinweis (optional)</label><input style={S.inp} value={note} onChange={e=>setNote(e.target.value)} placeholder="z.B. Familienurlaub"/></div>
          {!zeitraumGesetzt&&(
            <div style={{fontSize:13,color:"#8aaa5f",padding:"10px 12px",background:"#f8faf0",border:"1px dashed #d5e8a0",borderRadius:8}}>
              Bitte zuerst Start- und Enddatum wählen.
            </div>
          )}
          {zeitraumGesetzt&&<div style={{fontSize:13,color:"#5a6b4a",padding:"8px 0",borderTop:"1px solid #edf5d8",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <span>Urlaubstage (ohne Feiertage): <strong style={{color:wd===0?"#dc2626":"#2d3a2e"}}>{fmtT(wd)}</strong></span>
            {pruefen&&<span>Verfügbar: <strong style={{color:fehlend>0?"#dc2626":"#4a6b0f"}}>{fmtT(verfuegbar)} T</strong>
              {restVorjahr>0&&<span style={{color:"#8aaa5f",fontWeight:400}}> (davon {fmtT(restVorjahr)} Resturlaub)</span>}</span>}
            {!initial&&type==="ueberstunden"&&k&&<span>Überstundenkonto: <strong style={{color:ueberzogen>0?"#dc2626":"#4a6b0f"}}>{fmtT(restUeber)} T</strong></span>}
          </div>}

          {/* Warum werden Tage nicht gezählt? */}
          {feiertageImZeitraum.length>0&&(
            <div style={{fontSize:12,color:"#4a6b0f",background:"#f7fce8",border:"1px solid #d5e8a0",borderRadius:6,padding:"7px 10px"}}>
              {feiertageImZeitraum.map((f,i)=>(
                <div key={i}>🎉 {fmtDE(f.iso)} · {f.name}{f.halb?" – zählt als halber Tag":" – Feiertag, kostet keinen Urlaub"}</div>
              ))}
            </div>
          )}
          {zeitraumGesetzt&&wd===0&&(
            <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#b91c1c",marginBottom:2}}>⛔ Kein Arbeitstag im Zeitraum</div>
              <div style={{fontSize:12,color:"#b91c1c"}}>
                Der Zeitraum besteht nur aus Wochenenden und Feiertagen — ein Urlaubsantrag ist nicht nötig.
              </div>
            </div>
          )}

          {/* Bereits vorhandener eigener Eintrag im selben Zeitraum */}
          {doppelt&&(
            <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 12px",marginTop:4}}>
              <div style={{fontWeight:700,fontSize:13,color:"#b91c1c",marginBottom:4}}>
                ⛔ Für diesen Zeitraum besteht bereits ein Eintrag
              </div>
              {eigeneUeberschneidung.slice(0,3).map((e,i)=>(
                <div key={i} style={{fontSize:12,color:"#b91c1c"}}>
                  • {TYP_LABEL[e.type]||e.type}: {fmtDE(e.von)} – {fmtDE(e.bis)} ({e.status==="pending"?"wartet auf Genehmigung":e.status==="confirmed"?"bestätigt":e.status})
                </div>
              ))}
              <div style={{fontSize:11,color:"#b91c1c",marginTop:4}}>
                Bitte einen anderen Zeitraum wählen oder den bestehenden Eintrag bearbeiten.
              </div>
            </div>
          )}

          {/* Was genau wird gebucht? */}
          {!initial&&wd>0&&!doppelt&&k&&(()=>{
            const zeilen=[];
            if(type==="ueberstunden"){
              zeilen.push(["⏱ Überstunden",Math.min(wd,restUeber)]);
            }else{
              const ausRest=Math.min(restVorjahr,wd);
              if(ausRest>0)zeilen.push(["↩ Resturlaub Vorjahr",ausRest]);
              const ausJahr=Math.min(restJahr,Math.max(0,wd-ausRest));
              if(ausJahr>0)zeilen.push(["🏖 Jahresurlaub",ausJahr]);
              if(fehlend>0&&quelle==="ueberstunden")zeilen.push(["⏱ Überstunden",fehlend]);
            }
            if(zeilen.length===0)return null;
            return(
              <div style={{background:"#f7fce8",border:"1px solid #d5e8a0",borderRadius:8,padding:"9px 11px"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#4a6b0f",marginBottom:4}}>
                  So wird gebucht:
                </div>
                {zeilen.map(([lbl,menge],i)=>(
                  <div key={i} style={{fontSize:12,color:"#2d3a2e",display:"flex",justifyContent:"space-between"}}>
                    <span>{lbl}</span><strong>{fmtT(menge)} {menge===1?"Tag":"Tage"}</strong>
                  </div>
                ))}
                {zeilen.length>1&&(
                  <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>
                    Der Zeitraum wird dafür automatisch in {zeilen.length} Einträge geteilt.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Überstundenkonto reicht nicht */}
          {ueberzogen>0&&(
            <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#b91c1c",marginBottom:2}}>⛔ Nicht genügend Überstunden</div>
              <div style={{fontSize:12,color:"#b91c1c"}}>
                Der Zeitraum benötigt {fmtT(wd)} Tage, auf dem Überstundenkonto stehen {fmtT(restUeber)} Tage.
              </div>
            </div>
          )}

          {/* Urlaubskonto reicht nicht */}
          {fehlend>0&&(
            <div style={{background:ausgleichMoeglich>0?"#fff7ed":"#fef2f2",border:"1.5px solid "+(ausgleichMoeglich>0?"#f0932b":"#fca5a5"),borderRadius:8,padding:"10px 12px",marginTop:4}}>
              <div style={{fontWeight:700,fontSize:13,color:ausgleichMoeglich>0?"#92400e":"#b91c1c",marginBottom:6}}>
                ⚠ Nicht genügend Urlaub für diesen Zeitraum
              </div>
              <div style={{fontSize:12,color:ausgleichMoeglich>0?"#b45309":"#b91c1c",marginBottom:ausgleichMoeglich>0?8:0}}>
                Der Zeitraum benötigt {fmtT(wd)} Tage, verfügbar sind noch {fmtT(verfuegbar)} Tage (inkl. Resturlaub).
                Es fehlen <strong>{fmtT(fehlend)} Tage</strong>.
              </div>
              {ausgleichMoeglich>0?(
                <div>
                  <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:6}}>
                    Die fehlenden Tage werden über die Überstunden ausgeglichen:
                  </div>
                  <div style={{fontSize:12,color:"#92400e",padding:"3px 0"}}>
                    ⏱ <strong>{fmtT(fehlend)} {fehlend===1?"Tag":"Tage"}</strong> aus dem Überstundenkonto
                    {k?.stdProTag?" ("+fmtStd(fehlend*k.stdProTag)+" Std.)":""} · danach verbleiben {fmtT(restUeber-fehlend)} T.
                  </div>
                  <div style={{fontSize:11,color:"#92400e",marginTop:4}}>
                    Möchtest du den gesamten Zeitraum über Überstunden nehmen, wähle oben „⏱ Überstunden".
                  </div>
                </div>
              ):(
                <div style={{fontSize:12,color:"#b91c1c",marginTop:4}}>
                  Es steht weder Resturlaub aus dem Vorjahr noch ein Überstundenguthaben zur Verfügung. Bitte den Zeitraum verkürzen.
                </div>
              )}
            </div>
          )}
          {/* Konflikt-Warnung */}
          {conflicts.length>0&&(
            <div style={{background:"#fff7ed",border:"1.5px solid #f0932b",borderRadius:8,padding:"10px 12px",marginTop:4}}>
              <div style={{fontWeight:700,fontSize:13,color:"#92400e",marginBottom:4}}>
                ⚠ Überschneidung im Fachbereich {BEREICH_NAME[zielBereich]||""} ({conflicts.length} {conflicts.length===1?"Eintrag":"Einträge"})
              </div>
              {conflicts.slice(0,3).map((e,i)=>(
                <div key={i} style={{fontSize:12,color:"#b45309"}}>
                  • {fmtDE(e.von)} – {fmtDE(e.bis)}
                </div>
              ))}
              {isAdmin
                ? <div style={{fontSize:11,color:"#92400e",marginTop:4}}>Du kannst den Eintrag trotzdem bestätigen.</div>
                : <div style={{fontSize:11,color:"#92400e",marginTop:4}}>Du kannst den Antrag trotzdem stellen — die zuständige Leitung entscheidet.</div>
              }
            </div>
          )}
          {!isAdmin&&<div style={{fontSize:11,color:"#8aaa5f",marginTop:6}}>Dein Antrag wird dem Administrator zur Genehmigung vorgelegt.</div>}
        </div>
        <div style={S.mFt}><button style={{...S.savBtn,opacity:(busy||blockiert)?0.5:1,cursor:blockiert?"not-allowed":"pointer"}} onClick={save} disabled={busy||blockiert} title={!zeitraumGesetzt?"Bitte zuerst den Zeitraum wählen":blockiert?"Speichern derzeit nicht möglich – siehe Hinweise oben":""}>{isAdmin?"Speichern":"Beantragen"}</button><button style={S.canBtn} onClick={onClose}>Abbrechen</button></div>
      </div>
    </div>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
function PrintKal({year,entries,profiles,state,stateName,onClose,useNewWindow=false}){
  const ps={
    wrap:{position:"fixed",inset:0,background:"#fff",color:"#111",fontFamily:"Arial,sans-serif",padding:7,zIndex:9999},
    grid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,height:"calc(100% - 52px)"},
    mo:{border:"1px solid #ccc",padding:3,display:"flex",flexDirection:"column"},
    mt:{fontSize:8,fontWeight:700,textAlign:"center",marginBottom:2,borderBottom:"1px solid #eee",paddingBottom:2,color:"#5a8a1f"},
    cg:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flex:1},
    dh:{fontSize:6,fontWeight:700,color:"#888",textAlign:"center"},
    dc:{textAlign:"center",fontSize:6,minHeight:11,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:1},
    leg:{marginTop:4,display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"},
    li:{display:"flex",alignItems:"center",gap:3,fontSize:7},
    dot:{width:7,height:7,borderRadius:"50%"},
  };

  // Neue-Fenster-Modus: HTML in neuem Fenster öffnen und drucken
  useEffect(()=>{
    if(!useNewWindow)return;
    const w=window.open("about:blank","_kalender_"+Date.now(),"width=1200,height=800");
    if(!w)return;

    // Farbe zu rgba konvertieren (ohne nested template literals)
    function hexToRgba(hex,alpha){
      const r=parseInt(hex.slice(1,3),16);
      const g=parseInt(hex.slice(3,5),16);
      const b=parseInt(hex.slice(5,7),16);
      return "rgba("+r+","+g+","+b+","+alpha+")";
    }

    // Monate als HTML generieren
    const monthsHTML=MONTHS.map((mn,m)=>{
      const d=dimM(year,m),f=fwdM(year,m);
      const cells=[];
      for(let i=0;i<f;i++)cells.push(null);
      for(let x=1;x<=d;x++)cells.push(x);
      while(cells.length%7!==0)cells.push(null);

      const daysHTML=DAYS_SHORT.map(x=>'<div style="text-align:center;font-size:6px;font-weight:700;color:#888">'+x+'</div>').join("");

      const cellsHTML=cells.map(day=>{
        if(!day)return"<div></div>";
        const iso=toISO(year,m,day),wk=isWE(year,m,day);
        const fei=isFT(iso,state,year),fer=isFer(iso,state,year);
        const mk=entries.filter(e=>iso>=e.von&&iso<=e.bis).map(e=>{
          const p=profiles.find(x=>x.id===e.user_id)||e.profiles||{};
          return{color:p.color||"#5a8a1f"};
        });
        let bg="transparent",tc=wk?"#bbb":"#333";
        if(mk.length===1){bg=hexToRgba(mk[0].color,0.65);tc="#fff";}
        else if(mk.length>1){bg=hexToRgba(mk[0].color,0.5);tc="#fff";}
        else if(fei&&!fer){bg="#d4b896";tc="#5c3d1a";}
        else if(fer&&!fei){bg="#fce7f3";tc="#9d174d";}
        else if(fei&&fer){bg="linear-gradient(135deg,#fce7f3 50%,#d4b896 50%)";}
        return '<div style="text-align:center;font-size:6px;min-height:11px;display:flex;align-items:center;justify-content:center;border-radius:1px;background:'+bg+';color:'+tc+';font-weight:'+(mk.length?700:400)+'">'+day+'</div>';
      }).join("");

      return '<div style="border:1px solid #ccc;padding:3px;display:flex;flex-direction:column;">'
        +'<div style="font-size:8px;font-weight:700;text-align:center;margin-bottom:2px;border-bottom:1px solid #eee;padding-bottom:2px;color:#5a8a1f">'+mn+'</div>'
        +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;flex:1">'+daysHTML+cellsHTML+'</div>'
        +'</div>';
    }).join("");

    const usersLeg=profiles
      .filter(p=>entries.some(e=>e.user_id===p.id))
      .map(p=>'<div style="display:flex;align-items:center;gap:3px;font-size:7px"><div style="width:7px;height:7px;border-radius:50%;background:'+p.color+'"></div><span>'+p.vorname+' '+p.nachname+'</span></div>')
      .join("");

    const html='<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Urlaubsplan '+year+'</title>'
      +'<style>@page{size:A4 landscape;margin:6mm;}@media print{a[href]:after{content:none!important;}}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;}</style>'
      +'</head><body>'
      +'<div style="font-size:12px;font-weight:700;text-align:center;margin-bottom:4px">Urlaubsplan '+year+' · '+stateName+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;height:calc(100vh - 40px)">'+monthsHTML+'</div>'
      +'<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center">'
      +usersLeg
      +'<div style="display:flex;align-items:center;gap:3px;font-size:7px"><div style="width:7px;height:7px;border-radius:50%;background:#fce7f3;border:1px solid #f9a8d4"></div><span>Schulferien</span></div>'
      +'<div style="display:flex;align-items:center;gap:3px;font-size:7px"><div style="width:7px;height:7px;border-radius:50%;background:#d4b896;border:1px solid #c9a07a"></div><span>Feiertage</span></div>'
      +'</div>'
      +'<style>.np{position:fixed;top:10px;right:14px;background:#dc2626;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);}@media print{.np{display:none!important;}}</style><button class=np onclick=window.close()>Schliessen</button>'
      +'<script>window.onload=function(){window.print();}<'+'/script>'
      +'</body></html>';

    w.document.write(html);
    w.document.close();
    onClose?.();
  },[useNewWindow]);

  if(useNewWindow)return null;



  // Escape-Taste schließt Druckansicht
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose?.();};
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);
  return(
    <div className="pt" style={ps.wrap}>
      <style>{`@page{size:A4 landscape!important;margin:6mm;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-print{display:none!important;}a[href]:after{content:none!important;}}`}</style>
      {/* Schließen-Button — nur auf Bildschirm, nicht im Druck */}
      <button className="no-print" onClick={()=>onClose?.()} style={{position:"fixed",top:8,right:12,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer",zIndex:9999}}>✕ Schließen</button>
      <div style={{fontSize:11,fontWeight:700,textAlign:"center",marginBottom:4}}>Urlaubsplan {year} · {stateName}</div>
      <div style={ps.grid}>
        {MONTHS.map((mn,m)=>{
          const d=dimM(year,m),f=fwdM(year,m);
          const cells=[];for(let i=0;i<f;i++)cells.push(null);for(let x=1;x<=d;x++)cells.push(x);while(cells.length%7!==0)cells.push(null);
          return(
            <div key={m} style={ps.mo}><div style={ps.mt}>{mn}</div>
              <div style={ps.cg}>
                {DAYS_SHORT.map(x=><div key={x} style={ps.dh}>{x}</div>)}
                {cells.map((day,i)=>{
                  if(!day)return<div key={i}/>;
                  const iso=toISO(year,m,day),wk=isWE(year,m,day);
                  const fei=isFT(iso,state,year),fer=isFer(iso,state,year);
                  const mk=entries.filter(e=>iso>=e.von&&iso<=e.bis).map(e=>{const p=profiles.find(x=>x.id===e.user_id)||e.profiles||{};return{color:p.color||"#2563EB"};});
                  let bg="transparent",tc=wk?"#bbb":"#333";
                  if(mk.length===1){bg=ca(mk[0].color,0.65);tc="#fff";}
                  else if(mk.length>1){bg=ca(mk[0].color,0.5);tc="#fff";}
                  else if(fei&&!fer){bg="#d4b896";tc="#5c3d1a";}
                  else if(fer&&!fei){bg="#fce7f3";tc="#9d174d";}
                  else if(fei&&fer){bg="linear-gradient(135deg,#fce7f3 50%,#d4b896 50%)";}
                  return<div key={i} style={{...ps.dc,background:bg,color:tc,fontWeight:mk.length?700:400}}>{day}</div>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={ps.leg}>
        {profiles.filter(p=>entries.some(e=>e.user_id===p.id)).map(p=><div key={p.id} style={ps.li}><div style={{...ps.dot,background:p.color||"#2563EB"}}/><span>{p.vorname} {p.nachname}</span></div>)}
        <div style={ps.li}><div style={{...ps.dot,background:"#fce7f3",border:"1px solid #f9a8d4"}}/><span>Schulferien</span></div>
        <div style={ps.li}><div style={{...ps.dot,background:"#d4b896",border:"1px solid #c9a07a"}}/><span>Feiertage</span></div>
      </div>
    </div>
  );
}
function PrintList({year,users,stateName,onClose}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const ps={wrap:{position:"fixed",inset:0,background:"#fff",color:"#111",fontFamily:"Arial,sans-serif",padding:14,zIndex:9999},t:{width:"100%",borderCollapse:"collapse",fontSize:10},th:{textAlign:"left",padding:"4px 8px",background:"#f1f5f9",borderBottom:"1px solid #e2e8f0",fontWeight:600},td:{padding:"4px 8px",borderBottom:"1px solid #f8fafc"}};
  return(
    <div className="pt" style={ps.wrap}>
      <button className="no-print" onClick={()=>onClose?.()} style={{position:"fixed",top:8,right:12,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer",zIndex:9999}}>✕ Schließen</button>
      <div style={{fontSize:16,fontWeight:700,textAlign:"center",marginBottom:12}}>Urlaubsliste {year} · {stateName}</div>
      {users.map(u=>{const entries=u.entries||[];const urlU=eDays(entries,"urlaub",u)+eDays(entries,"resturlaub",u),ueU=eDays(entries,"ueberstunden",u);return(
        <div key={u.id} style={{marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:12,padding:"5px 8px",background:"#f1f5f9",borderLeft:`3px solid ${u.color||"#2563EB"}`,marginBottom:4,display:"flex",justifyContent:"space-between"}}><span>{u.vorname} {u.nachname}</span><span style={{fontWeight:400,fontSize:10,color:"#555"}}>Urlaub: {fmtT(urlU)}/{u.urlaubstage||30} · ÜS: {fmtT(ueU)}/{u.ueberstunden||0}</span></div>
          <table style={ps.t}><thead><tr>{["Typ","Von","Bis","Tage","Status"].map(h=><th key={h} style={ps.th}>{h}</th>)}</tr></thead>
            <tbody>{[...entries].sort((a,b)=>a.von.localeCompare(b.von)).map(e=><tr key={e.id}><td style={ps.td}>{TL[e.type]||e.type}</td><td style={ps.td}>{fmtDE(e.von)}</td><td style={ps.td}>{fmtDE(e.bis)}</td><td style={ps.td}>{fmtT(countWD(e.von,e.bis))}</td><td style={ps.td}>{e.status}</td></tr>)}</tbody>
          </table>
        </div>
      );})}
    </div>
  );
}


// ─── Änderungsantrag Modal ────────────────────────────────────────────────────
function ChangeRequestModal({entry,year,onSave,onClose}){
  const[von,setVon]=useState(entry?.von||"");
  const[bis,setBis]=useState(entry?.bis||"");
  const[grund,setGrund]=useState("");
  const[busy,setBusy]=useState(false);
  const wd=countWD(von,bis);
  return(
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.mHd}>
          <span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>🔄 Änderungsantrag</span>
          <button style={S.clsBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.mBd}>
          <div style={{fontSize:13,color:"#5a6b4a",marginBottom:14,background:"#fff7ed",padding:"8px 12px",borderRadius:8,border:"1px solid #f0932b"}}>
            Aktuell bestätigt: <strong>{fmtDE(entry?.von)} – {fmtDE(entry?.bis)}</strong><br/>
            Bitte gib den gewünschten neuen Zeitraum an.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><label style={S.lbl}>Neues Von-Datum</label>
              <input style={S.inp} type="date" value={von} onChange={e=>{setVon(e.target.value);if(e.target.value>bis)setBis(e.target.value);}}/>
            </div>
            <div><label style={S.lbl}>Neues Bis-Datum</label>
              <input style={S.inp} type="date" value={bis} min={von} onChange={e=>setBis(e.target.value)}/>
            </div>
          </div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Begründung (optional)</label>
            <input style={S.inp} value={grund} onChange={e=>setGrund(e.target.value)} placeholder="z.B. Familienurlaub verschoben"/>
          </div>
          <div style={{fontSize:13,color:"#5a6b4a",borderTop:"1px solid #edf5d8",paddingTop:8}}>
            Neuer Zeitraum: <strong style={{color:"#2d3a2e"}}>{fmtT(wd)} Arbeitstage</strong>
          </div>
          <div style={{fontSize:11,color:"#8aaa5f",marginTop:4}}>Der Änderungsantrag wird dem Administrator zur Genehmigung vorgelegt.</div>
        </div>
        <div style={S.mFt}>
          <button style={{...S.savBtn,opacity:busy?0.6:1}} disabled={busy} onClick={async()=>{
            if(!von||!bis||bis<von){alert("Bitte gültige Daten.");return;}
            setBusy(true);try{await onSave(von,bis,grund);}finally{setBusy(false);}
          }}>Änderung beantragen</button>
          <button style={S.canBtn} onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stornierungsantrag Modal ─────────────────────────────────────────────────
function DeleteRequestModal({entry,onSave,onClose}){
  const[grund,setGrund]=useState("");
  const[busy,setBusy]=useState(false);
  return(
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.mHd}>
          <span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>✕ Stornierungsantrag</span>
          <button style={S.clsBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.mBd}>
          <div style={{fontSize:13,color:"#92400e",marginBottom:14,background:"#fff1f2",padding:"8px 12px",borderRadius:8,border:"1px solid #fca5a5"}}>
            Zeitraum: <strong>{fmtDE(entry?.von)} – {fmtDE(entry?.bis)}</strong>
          </div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Begründung</label>
            <input style={S.inp} value={grund} onChange={e=>setGrund(e.target.value)} placeholder="Bitte begründe deinen Stornierungsantrag"/>
          </div>
          <div style={{fontSize:11,color:"#8aaa5f"}}>Der Antrag wird dem Administrator zur Genehmigung vorgelegt.</div>
        </div>
        <div style={S.mFt}>
          <button style={{...S.savBtn,background:"#dc2626",opacity:busy?0.6:1}} disabled={busy} onClick={async()=>{
            setBusy(true);try{await onSave(grund);}finally{setBusy(false);}
          }}>Stornierung beantragen</button>
          <button style={S.canBtn} onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}


// ─── Passwort-Reset Modal (für Dashboard-Anfragen) ───────────────────────────
function ResetPwModal({user,requestId,onDone,onClose}){
  const[pw,setPw]=useState(()=>generatePassword());
  const[busy,setBusy]=useState(false);
  const[done,setDone]=useState(false);
  const[err,setErr]=useState("");

  async function doReset(){
    if(pw.length<6){setErr("Mindestens 6 Zeichen.");return;}
    setBusy(true);setErr("");
    try{
      await adminResetPassword(user.id,pw);
      const text=`Hallo ${user.vorname},

dein Passwort für den TZ Westlausitz Urlaubsplaner wurde zurückgesetzt:

🌐 https://derkeili.github.io/Individuelles-Funktionstraining/
📧 E-Mail: ${user.email}
🔑 Neues Passwort: ${pw}

Bitte ändere dein Passwort nach dem ersten Login unter „Profil".

Viele Grüße
Thomas Keilig`;
      try{await navigator.clipboard.writeText(text);}catch(e){
        const el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
      }
      setDone(true);
      onDone(requestId);
    }catch(e){setErr("Fehler: "+e.message);}
    finally{setBusy(false);}
  }

  return(
    <div style={S.overlay}>
      <div style={{...S.modal,width:460}}>
        <div style={S.mHd}>
          <span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>🔑 Passwort zurücksetzen</span>
          <button style={S.clsBtn} onClick={onClose}>✕</button>
        </div>
        <div style={S.mBd}>
          {!done?(
            <>
              <div style={{background:"#fff7ed",border:"1px solid #f0932b",borderRadius:8,padding:"10px 12px",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:13,color:"#92400e"}}>Anfrage von: {user.vorname} {user.nachname}</div>
                <div style={{fontSize:12,color:"#b45309"}}>{user.email}</div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={S.lbl}>Neues Passwort</label>
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,background:"#f8faf0",border:"1.5px solid #5a8a1f",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:15,letterSpacing:"0.08em",color:"#2d3a2e",fontWeight:700}}>
                    {pw}
                  </div>
                  <button onClick={()=>setPw(generatePassword())}
                    style={{background:"#f8faf0",border:"1.5px solid #d5e8a0",borderRadius:8,padding:"10px 12px",cursor:"pointer",fontSize:18}} title="Neues generieren">
                    🔄
                  </button>
                </div>
              </div>
              {err&&<div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"8px 12px",borderRadius:6,marginBottom:8}}>{err}</div>}
              <div style={{fontSize:11,color:"#8aaa5f",marginBottom:12}}>
                Das Passwort wird gesetzt und der Nachrichtentext automatisch in die Zwischenablage kopiert.
              </div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"16px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>✅</div>
              <div style={{fontWeight:700,fontSize:15,color:"#2d3a2e",marginBottom:6}}>Passwort zurückgesetzt!</div>
              <div style={{fontSize:13,color:"#5a6b4a",marginBottom:14}}>Nachrichtentext wurde kopiert — jetzt einfügen und an {user.vorname} senden.</div>
              <div style={{background:"#f8faf0",border:"1px solid #d5e8a0",borderRadius:8,padding:"10px",fontFamily:"monospace",fontSize:14,fontWeight:700,color:"#2d3a2e"}}>
                {pw}
              </div>
            </div>
          )}
        </div>
        <div style={S.mFt}>
          {!done?(
            <>
              <button style={{...S.savBtn,opacity:busy?0.6:1,flex:1}} onClick={doReset} disabled={busy}>
                {busy?"Wird gesetzt…":"Passwort setzen & Nachricht kopieren 📋"}
              </button>
              <button style={S.canBtn} onClick={onClose}>Abbrechen</button>
            </>
          ):(
            <button style={{...S.savBtn,width:"100%"}} onClick={onClose}>Schließen</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// ─── TZ Westlausitz Farbpalette ───────────────────────────────────────────────
// Primär: Grün #3d7a4f / #5a9e6f  Akzent: Hellgrün #7cbd8f
// Hintergrund: Hellgrau-Grün #f0f4f0  Text: Dunkelgrau #2d3a2e
// Cards: Weiß #ffffff  Border: #d4e6d8
const S={
  app:{minHeight:"100vh",background:"#f5f8ec",display:"flex",flexDirection:"column"},
  header:{background:"linear-gradient(135deg,#5a8a1f 0%,#6a9e2f 100%)",borderBottom:"none",padding:"0 24px",display:"flex",justifyContent:"space-between",alignItems:"stretch",flexWrap:"wrap",gap:0,boxShadow:"0 2px 12px rgba(61,122,79,0.25)"},
  hL:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",padding:"12px 0"},
  hR:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"12px 0"},
  logoTxt:{fontSize:16,fontWeight:800,color:"#ffffff",letterSpacing:"-0.01em",fontFamily:"'Nunito',sans-serif"},
  logoSub:{fontSize:11,color:"rgba(255,255,255,0.75)",fontWeight:500},
  yearCtrl:{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"4px 8px",border:"1px solid rgba(255,255,255,0.2)"},
  yBtn:{background:"none",border:"none",color:"#fff",fontSize:20,padding:"0 4px",lineHeight:1,cursor:"pointer"},
  yLbl:{fontSize:17,fontWeight:700,color:"#fff",minWidth:54,textAlign:"center"},
  blSel:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",outline:"none"},
  uBadge:{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 12px",border:"1px solid rgba(255,255,255,0.2)"},
  av:{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",flexShrink:0,fontSize:14},
  pBtn:{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,cursor:"pointer"},
  nav:{background:"#ffffff",borderBottom:"1px solid #d4e6d8",padding:"0 24px",display:"flex",alignItems:"center",gap:2,overflowX:"auto",boxShadow:"0 1px 4px rgba(61,122,79,0.08)"},
  navBtn:{background:"none",border:"none",color:"#5a6b4a",padding:"13px 14px",fontSize:13,fontWeight:600,borderBottom:"3px solid transparent",whiteSpace:"nowrap",cursor:"pointer",transition:"color .15s"},
  navAct:{color:"#5a8a1f",borderBottom:"3px solid #5a8a1f"},
  pendBadge:{background:"#fef3c7",color:"#92400e",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,marginLeft:6,border:"1px solid #fde68a"},
  legend:{marginLeft:"auto",display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",paddingLeft:12},
  legRow:{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"},
  legItem:{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#5a6b4a"},
  legDot:{width:9,height:9,borderRadius:"50%"},
  notif:{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",borderRadius:10,padding:"11px 22px",zIndex:2500,fontSize:13,boxShadow:"0 8px 32px rgba(61,122,79,0.2)",maxWidth:"90vw",textAlign:"center",border:"1px solid",fontWeight:500},
  main:{flex:1,padding:20,overflowY:"auto"},
  mCard:{background:"#ffffff",borderRadius:12,padding:12,border:"1px solid #d5e8a0",boxShadow:"0 2px 8px rgba(61,122,79,0.06)"},
  mTitle:{fontSize:11,fontWeight:700,color:"#6a9e2f",marginBottom:7,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.08em"},
  cGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2},
  dHd:{textAlign:"center",fontSize:8,fontWeight:700,color:"#8aaa5f",padding:"3px 0"},
  dCell:{textAlign:"center",padding:"2px 0",borderRadius:3,minHeight:22,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},
  card:{background:"#ffffff",borderRadius:14,padding:20,border:"1px solid #d5e8a0",boxShadow:"0 2px 10px rgba(61,122,79,0.07)"},
  pgT:{fontSize:20,fontWeight:800,color:"#2d3a2e",marginBottom:18,fontFamily:"'Nunito',sans-serif"},
  addBtn:{background:"#5a8a1f",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 6px rgba(61,122,79,0.25)"},
  icnBtn:{background:"#f5f8ec",border:"1px solid #d5e8a0",color:"#6a9e2f",borderRadius:6,padding:"4px 8px",fontSize:13,cursor:"pointer"},
  th:{textAlign:"left",padding:"10px 14px",fontSize:11,fontWeight:700,color:"#5a6b4a",textTransform:"uppercase",letterSpacing:"0.05em",background:"#f8faf0"},
  td:{padding:"10px 14px",fontSize:13,color:"#2d3a2e",borderBottom:"1px solid #edf5ee"},
  overlay:{position:"fixed",inset:0,background:"rgba(45,58,46,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1500,backdropFilter:"blur(4px)",padding:12,boxSizing:"border-box"},
  modal:{background:"#ffffff",borderRadius:16,width:500,maxWidth:"95vw",border:"1px solid #d5e8a0",
    boxShadow:"0 20px 60px rgba(61,122,79,0.18)",
    // Nie höher als der Bildschirm — sonst rutschen die Knöpfe unerreichbar nach unten
    maxHeight:"calc(100dvh - 24px)",display:"flex",flexDirection:"column",overflow:"hidden"},
  mHd:{padding:"18px 22px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #edf5ee",flexShrink:0},
  mBd:{padding:"18px 22px",overflowY:"auto",WebkitOverflowScrolling:"touch",flex:"1 1 auto",minHeight:0},
  mFt:{padding:"14px 22px 18px",display:"flex",gap:10,borderTop:"1px solid #edf5ee",flexShrink:0,background:"#fff"},
  inp:{width:"100%",background:"#f8faf0",border:"1.5px solid #c8d890",borderRadius:8,padding:"9px 12px",color:"#2d3a2e",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .15s"},
  dateInp:{width:"100%",background:"#f8faf0",border:"1.5px solid #c8d890",borderRadius:8,padding:"7px 10px",color:"#2d3a2e",fontSize:13,lineHeight:1.2,height:38,outline:"none",boxSizing:"border-box",textAlign:"left",WebkitAppearance:"none",appearance:"none",fontFamily:"inherit"},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#5a6b4a",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"},
  savBtn:{background:"#5a8a1f",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 2px 6px rgba(61,122,79,0.25)"},
  canBtn:{background:"#f5f8ec",color:"#5a6b4a",border:"1px solid #d5e8a0",borderRadius:8,padding:"10px 20px",fontSize:13,cursor:"pointer",fontWeight:600},
  clsBtn:{background:"none",border:"none",color:"#8aaa5f",fontSize:20,lineHeight:1,padding:"2px 6px",cursor:"pointer"},
  tabTgl:{background:"none",border:"none",color:"#8aaa5f",padding:"7px 13px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"},
  tabTglAct:{background:"#e8f5eb",color:"#5a8a1f",fontWeight:700},
};
