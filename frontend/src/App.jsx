import { useState, useRef, useEffect } from "react";
import {
  supabase, signIn, signOut, getSession,
  getProfile, getAllProfiles, updateProfile, createUser, deleteUser,
  getAllEntries, getMyEntries, getConfirmedEntries,
  createEntry, updateEntry, setEntryStatus, deleteEntry, checkConflicts,
  adminResetPassword, requestPasswordReset,
  getPasswordResetRequests, dismissResetRequest,
} from "./supabase.js";

// ─── Feiertagsdaten 2025–2027 (alle 16 Bundesländer) ─────────────────────────
const KALENDER_DB = {"BW":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-01-07","2025-01-07","Heilige Drei Könige"],["2025-03-27","2025-04-04","Osterferien"],["2025-05-30","2025-05-30","Pfingstfreitag"],["2025-06-10","2025-06-21","Pfingstferien"],["2025-07-31","2025-09-13","Sommerferien"],["2025-10-28","2025-10-31","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-01-06","2026-01-06","Heilige Drei Könige"],["2026-04-09","2026-04-18","Osterferien"],["2026-06-09","2026-06-20","Pfingstferien"],["2026-07-30","2026-09-12","Sommerferien"],["2026-11-02","2026-11-06","Herbstferien"],["2026-12-23","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-10","Osterferien"],["2027-06-08","2027-06-19","Pfingstferien"],["2027-07-29","2027-09-11","Sommerferien"],["2027-11-01","2027-11-05","Herbstferien"],["2027-12-22","2028-01-07","Weihnachtsferien"]]}},"BY":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-06-19":"Fronleichnam","2025-08-15":"Mariä Himmelfahrt","2025-11-01":"Allerheiligen"},"ferien":[["2025-02-27","2025-03-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-31","2025-09-12","Sommerferien"],["2025-11-03","2025-11-07","Herbstferien"],["2025-12-24","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-06-04":"Fronleichnam","2026-08-15":"Mariä Himmelfahrt","2026-11-01":"Allerheiligen"},"ferien":[["2026-02-19","2026-02-27","Winterferien"],["2026-04-09","2026-04-17","Osterferien"],["2026-07-30","2026-09-11","Sommerferien"],["2026-11-02","2026-11-06","Herbstferien"],["2026-12-23","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-05-27":"Fronleichnam","2027-08-15":"Mariä Himmelfahrt","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-01","2027-03-05","Winterferien"],["2027-03-29","2027-04-09","Osterferien"],["2027-07-29","2027-09-10","Sommerferien"],["2027-11-01","2027-11-05","Herbstferien"],["2027-12-24","2028-01-05","Weihnachtsferien"]]}},"BE":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-03-08":"Internationaler Frauentag"},"ferien":[["2025-01-27","2025-02-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-24","2025-09-06","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-03-08":"Internationaler Frauentag"},"ferien":[["2026-02-02","2026-02-06","Winterferien"],["2026-04-01","2026-04-17","Osterferien"],["2026-07-16","2026-08-28","Sommerferien"],["2026-10-19","2026-10-30","Herbstferien"],["2026-12-21","2027-01-03","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-03-08":"Internationaler Frauentag"},"ferien":[["2027-02-01","2027-02-05","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-15","2027-08-27","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-20","2028-01-02","Weihnachtsferien"]]}},"BB":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-27","2025-02-07","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-24","2025-09-06","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-06","Winterferien"],["2026-04-01","2026-04-17","Osterferien"],["2026-07-16","2026-08-28","Sommerferien"],["2026-10-19","2026-10-30","Herbstferien"],["2026-12-21","2027-01-03","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-05","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-15","2027-08-27","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-20","2028-01-02","Weihnachtsferien"]]}},"HB":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-03","2025-02-04","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-03","Winterferien"],["2026-03-25","2026-04-09","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-02","Winterferien"],["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"HH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-31","2025-01-31","Winterferien"],["2025-03-10","2025-03-21","Frühjahrsferien"],["2025-07-10","2025-08-20","Sommerferien"],["2025-10-03","2025-10-17","Herbstferien"],["2025-12-19","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-01-30","2026-01-30","Winterferien"],["2026-03-02","2026-03-13","Frühjahrsferien"],["2026-07-16","2026-08-26","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-18","2027-01-01","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-03-01","2027-03-12","Frühjahrsferien"],["2027-07-15","2027-08-25","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-20","2027-12-31","Weihnachtsferien"]]}},"HE":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam"},"ferien":[["2025-03-24","2025-04-04","Osterferien"],["2025-07-07","2025-08-15","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-09","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-07-06","2026-08-14","Sommerferien"],["2026-10-12","2026-10-24","Herbstferien"],["2026-12-21","2027-01-08","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-07-05","2027-08-13","Sommerferien"],["2027-10-11","2027-10-23","Herbstferien"],["2027-12-22","2028-01-07","Weihnachtsferien"]]}},"MV":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-03-08":"Internationaler Frauentag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-07","2025-08-16","Sommerferien"],["2025-10-04","2025-10-18","Herbstferien"],["2025-12-22","2026-01-03","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-03-08":"Internationaler Frauentag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-16","2026-02-21","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-06","2026-08-15","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-03-08":"Internationaler Frauentag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-15","2027-02-20","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-05","2027-08-14","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}},"NI":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-01-31","2025-01-31","Winterferien"],["2025-04-07","2025-04-22","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-02","2026-02-03","Winterferien"],["2026-03-25","2026-04-09","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-24","Herbstferien"],["2026-12-23","2027-01-05","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-01","2027-02-02","Winterferien"],["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-23","Herbstferien"],["2027-12-22","2028-01-04","Weihnachtsferien"]]}},"NW":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-05","Sommerferien"],["2025-10-13","2025-10-25","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-11","Osterferien"],["2026-06-29","2026-08-11","Sommerferien"],["2026-10-05","2026-10-17","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-10","Osterferien"],["2027-06-28","2027-08-10","Sommerferien"],["2027-10-04","2027-10-16","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"RP":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-01","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-07","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-06-29","2026-08-07","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-06-28","2027-08-06","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SL":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-08-15":"Mariä Himmelfahrt","2025-11-01":"Allerheiligen"},"ferien":[["2025-04-14","2025-04-25","Osterferien"],["2025-06-23","2025-08-01","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-07","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-08-15":"Mariä Himmelfahrt","2026-11-01":"Allerheiligen"},"ferien":[["2026-03-30","2026-04-10","Osterferien"],["2026-06-29","2026-08-07","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-23","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-08-15":"Mariä Himmelfahrt","2027-11-01":"Allerheiligen"},"ferien":[["2027-03-29","2027-04-09","Osterferien"],["2027-06-28","2027-08-06","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SN":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-10-31":"Reformationstag","2025-11-19":"Buß- und Bettag"},"ferien":[["2025-02-17","2025-03-01","Winterferien"],["2025-04-18","2025-04-26","Osterferien"],["2025-07-21","2025-08-29","Sommerferien"],["2025-10-06","2025-10-17","Herbstferien"],["2025-12-22","2026-01-02","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-10-31":"Reformationstag","2026-11-18":"Buß- und Bettag"},"ferien":[["2026-02-16","2026-02-28","Winterferien"],["2026-04-09","2026-04-18","Osterferien"],["2026-07-20","2026-08-28","Sommerferien"],["2026-10-05","2026-10-16","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-10-31":"Reformationstag","2027-11-17":"Buß- und Bettag"},"ferien":[["2027-02-15","2027-02-27","Winterferien"],["2027-03-29","2027-04-10","Osterferien"],["2027-07-19","2027-08-27","Sommerferien"],["2027-10-04","2027-10-15","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}},"ST":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-01-06":"Heilige Drei Könige","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-24","Osterferien"],["2025-07-10","2025-08-20","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-06","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-01-06":"Heilige Drei Könige","2026-10-31":"Reformationstag"},"ferien":[["2026-02-09","2026-02-14","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-09","2026-08-19","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-21","2027-01-06","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-01-06":"Heilige Drei Könige","2027-10-31":"Reformationstag"},"ferien":[["2027-02-08","2027-02-13","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-08","2027-08-18","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2028-01-05","Weihnachtsferien"]]}},"SH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-10-31":"Reformationstag"},"ferien":[["2025-04-07","2025-04-18","Osterferien"],["2025-06-26","2025-08-06","Sommerferien"],["2025-10-13","2025-10-24","Herbstferien"],["2025-12-22","2026-01-05","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-10-31":"Reformationstag"},"ferien":[["2026-03-30","2026-04-17","Osterferien"],["2026-06-25","2026-08-05","Sommerferien"],["2026-10-12","2026-10-23","Herbstferien"],["2026-12-23","2027-01-05","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-10-31":"Reformationstag"},"ferien":[["2027-03-22","2027-04-07","Osterferien"],["2027-06-24","2027-08-04","Sommerferien"],["2027-10-11","2027-10-22","Herbstferien"],["2027-12-22","2028-01-04","Weihnachtsferien"]]}},"TH":{"2025":{"feiertage":{"2025-01-01":"Neujahr","2025-04-18":"Karfreitag","2025-04-20":"Ostersonntag","2025-04-21":"Ostermontag","2025-05-01":"Tag der Arbeit","2025-05-29":"Christi Himmelfahrt","2025-06-08":"Pfingstsonntag","2025-06-09":"Pfingstmontag","2025-10-03":"Tag der Deutschen Einheit","2025-12-25":"1. Weihnachtstag","2025-12-26":"2. Weihnachtstag","2025-06-19":"Fronleichnam","2025-09-20":"Weltkindertag","2025-10-31":"Reformationstag"},"ferien":[["2025-02-17","2025-02-22","Winterferien"],["2025-04-14","2025-04-25","Osterferien"],["2025-07-07","2025-08-16","Sommerferien"],["2025-10-20","2025-11-01","Herbstferien"],["2025-12-22","2026-01-03","Weihnachtsferien"]]},"2026":{"feiertage":{"2026-01-01":"Neujahr","2026-04-03":"Karfreitag","2026-04-05":"Ostersonntag","2026-04-06":"Ostermontag","2026-05-01":"Tag der Arbeit","2026-05-14":"Christi Himmelfahrt","2026-05-24":"Pfingstsonntag","2026-05-25":"Pfingstmontag","2026-10-03":"Tag der Deutschen Einheit","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2026-06-04":"Fronleichnam","2026-09-20":"Weltkindertag","2026-10-31":"Reformationstag"},"ferien":[["2026-02-16","2026-02-21","Winterferien"],["2026-04-01","2026-04-11","Osterferien"],["2026-07-06","2026-08-15","Sommerferien"],["2026-10-19","2026-10-31","Herbstferien"],["2026-12-21","2027-01-02","Weihnachtsferien"]]},"2027":{"feiertage":{"2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-28":"Ostersonntag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-16":"Pfingstsonntag","2027-05-17":"Pfingstmontag","2027-10-03":"Tag der Deutschen Einheit","2027-12-25":"1. Weihnachtstag","2027-12-26":"2. Weihnachtstag","2027-05-27":"Fronleichnam","2027-09-20":"Weltkindertag","2027-10-31":"Reformationstag"},"ferien":[["2027-02-15","2027-02-20","Winterferien"],["2027-03-22","2027-04-03","Osterferien"],["2027-07-05","2027-08-14","Sommerferien"],["2027-10-18","2027-10-30","Herbstferien"],["2027-12-22","2027-12-31","Weihnachtsferien"]]}}};

const BUNDESLAENDER=[["","—"],["BW","Baden-Württemberg"],["BY","Bayern"],["BE","Berlin"],["BB","Brandenburg"],["HB","Bremen"],["HH","Hamburg"],["HE","Hessen"],["MV","Mecklenburg-Vorpommern"],["NI","Niedersachsen"],["NW","Nordrhein-Westfalen"],["RP","Rheinland-Pfalz"],["SL","Saarland"],["SN","Sachsen"],["ST","Sachsen-Anhalt"],["SH","Schleswig-Holstein"],["TH","Thüringen"]];
const MONTHS=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DAYS_SHORT=["Mo","Di","Mi","Do","Fr","Sa","So"];
const PRESET_COLORS=["#2563EB","#DC2626","#059669","#D97706","#7C3AED","#DB2777","#0891B2","#65A30D","#EA580C","#0F766E"];

// ─── Kalender-Helpers ─────────────────────────────────────────────────────────
function getSD(state,year){if(!state)return{feiertage:{},ferien:[]};const db=KALENDER_DB[state];if(!db)return{feiertage:{},ferien:[]};const y=String(year);if(db[y])return db[y];const yrs=Object.keys(db).map(Number).sort();const b=yrs.reduce((a,x)=>Math.abs(x-year)<Math.abs(a-year)?x:a);return db[String(b)];}
const isFT=(iso,s,y)=>getSD(s,y).feiertage[iso]||null;
const isFer=(iso,s,y)=>{for(const[v,b,n]of getSD(s,y).ferien){if(iso>=v&&iso<=b)return n;}return null;};
const dimM=(y,m)=>new Date(y,m+1,0).getDate();
const fwdM=(y,m)=>{let d=new Date(y,m,1).getDay();return d===0?6:d-1;};
const isWE=(y,m,d)=>{let w=new Date(y,m,d).getDay();return w===0||w===6;};
const toISO=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const fmtDE=iso=>{if(!iso)return"";const[y,m,d]=iso.split("-");return`${d}.${m}.${y}`;};
const wday=iso=>{const[y,m,d]=iso.split("-").map(Number);return["So","Mo","Di","Mi","Do","Fr","Sa"][new Date(y,m-1,d).getDay()];};
function countWD(von,bis){if(!von||!bis)return 0;const[y1,m1,d1]=von.split("-").map(Number),[y2,m2,d2]=bis.split("-").map(Number);let s=new Date(y1,m1-1,d1),e=new Date(y2,m2-1,d2);if(e<s)return 0;let c=0,cur=new Date(s);while(cur<=e){const d=cur.getDay();if(d!==0&&d!==6)c++;cur.setDate(cur.getDate()+1);}return c;}
function eDays(entries=[],type){return entries.filter(e=>e.type===type).reduce((s,e)=>s+countWD(e.von||e.von,e.bis||e.bis),0);}
const ca=(hex,a)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;};
const lighten=(hex,f=0.4)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`#${Math.round(r+(255-r)*f).toString(16).padStart(2,"0")}${Math.round(g+(255-g)*f).toString(16).padStart(2,"0")}${Math.round(b+(255-b)*f).toString(16).padStart(2,"0")}`;};
const PRINT_STYLE=`@media print{body *{visibility:hidden!important;}.pt,.pt *{visibility:visible!important;}.pt{position:fixed;left:0;top:0;width:100%;height:100%;background:#fff;z-index:9999;}@page{size:A4 landscape;margin:6mm;}}`;

// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);       // eigenes Profil
  const [profiles,setProfiles]=useState([]);        // alle Profile
  const [entries,setEntries]=useState([]);           // alle sichtbaren Einträge
  const [loading,setLoading]=useState(true);
  const [year,setYear]=useState(new Date().getFullYear());
  const [bundesland,setBundesland]=useState("SN");
  const [view,setView]=useState("kalender");
  const [modal,setModal]=useState(null);
  const [tooltip,setTooltip]=useState(null);
  const [printMode,setPrintMode]=useState(null);
  const [notif,setNotif]=useState(null);
  const styleRef=useRef(false);

  if(!styleRef.current){
    const s=document.createElement("style");
    s.textContent=PRINT_STYLE+`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:wght@400;500;600;700&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Nunito Sans',sans-serif;background:#f0f4f0;color:#2d3a2e;}input,select,textarea{font-family:inherit;}button{cursor:pointer;font-family:inherit;}::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#e8f0e8;}::-webkit-scrollbar-thumb{background:#7ab529;border-radius:3px;}`;
    document.head.appendChild(s);
    styleRef.current=true;
  }

  const isAdmin=profile?.role==="admin";

  // ── Session-Init ──────────────────────────────────────────────────
  useEffect(()=>{
    getSession().then(async sess=>{
      setSession(sess);
      if(sess){await loadAll(sess.user.id);}
      else{setLoading(false);}
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(_,sess)=>{
      setSession(sess);
      if(sess){await loadAll(sess.user.id);}
      else{setProfile(null);setProfiles([]);setEntries([]);setLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadAll(userId){
    setLoading(true);
    try{
      const[prof,profs]=await Promise.all([getProfile(userId),getAllProfiles()]);
      setProfile(prof);
      setProfiles(profs);
      await loadEntries(prof.role==="admin",userId);
    }catch(e){notify(e.message,"warn");}
    finally{setLoading(false);}
  }

  async function loadEntries(isAdm,userId){
    try{
      if(isAdm){
        const all=await getAllEntries();
        setEntries(all);
      }else{
        const[mine,confirmed]=await Promise.all([getMyEntries(userId),getConfirmedEntries()]);
        // Merge: eigene + bestätigte anderer (ohne Duplikate)
        const myIds=new Set(mine.map(e=>e.id));
        const others=confirmed.filter(e=>e.user_id!==userId&&!myIds.has(e.id));
        // Eigene mit vollem Profil anreichern
        const myProf=profiles.find(p=>p.id===userId)||await getProfile(userId);
        const mineRich=mine.map(e=>({...e,profiles:myProf}));
        setEntries([...mineRich,...others]);
      }
    }catch(e){notify(e.message,"warn");}
  }

  function notify(msg,type="success"){setNotif({msg,type});setTimeout(()=>setNotif(null),5000);}

  // ── Auth ──────────────────────────────────────────────────────────
  async function handleLogin(email,password){
    await signIn(email,password);
    // onAuthStateChange übernimmt den Rest
  }
  async function handleLogout(){
    await signOut();
    setView("kalender");
  }

  // ── Profile CRUD ──────────────────────────────────────────────────
  async function handleUpdateProfile(id,data){
    const p=await updateProfile(id,data);
    setProfiles(prev=>prev.map(x=>x.id===id?p:x));
    if(id===profile?.id)setProfile(p);
    notify("Gespeichert.");
  }
  async function handleCreateUser(data){
    await createUser(data);
    const profs=await getAllProfiles();
    setProfiles(profs);
    notify("Mitarbeiter angelegt. Er kann sich nun anmelden.");
  }
  async function handleDeleteUser(id){
    await deleteUser(id);
    setProfiles(prev=>prev.filter(p=>p.id!==id));
    notify("Mitarbeiter gelöscht.");
  }

  // ── Entries CRUD ──────────────────────────────────────────────────
  async function handleCreateEntry(data){
    const{user_id,type,von,bis,note}=data;
    // Konfliktcheck (Trainer)
    if(!isAdmin){
      const conflicts=await checkConflicts(user_id,von,bis);
      if(conflicts.length>0){
        const names=conflicts.map(c=>c.profiles?.vorname||"Jemand").join(", ");
        notify(`Zeitraum überschneidet sich mit: ${names}. Antrag trotzdem gestellt – Admin entscheidet.`,"warn");
      }
    }
    const e=await createEntry({user_id,type,von,bis,note});
    if(isAdmin){await setEntryStatus(e.id,"confirmed");}
    await loadEntries(isAdmin,session.user.id);
    notify(isAdmin?"Eintrag bestätigt gespeichert.":"Urlaubsantrag eingereicht – wartet auf Genehmigung.");
  }
  async function handleUpdateEntry(id,data){
    await updateEntry(id,data);
    await loadEntries(isAdmin,session.user.id);
    notify("Eintrag aktualisiert.");
  }
  async function handleSetStatus(id,status){
    // Konflikt-Info holen vor Bestätigung
    if(status==="confirmed"){
      const entry=entries.find(e=>e.id===id);
      if(entry){
        const conflicts=await checkConflicts(entry.user_id,entry.von,entry.bis);
        if(conflicts.length>0){
          const names=conflicts.map(c=>c.profiles?.vorname||"jemand").join(", ");
          if(!window.confirm(`Überschneidung mit ${names}. Trotzdem bestätigen?`))return;
        }
      }
    }
    await setEntryStatus(id,status);
    await loadEntries(isAdmin,session.user.id);
    notify(status==="confirmed"?"Eintrag bestätigt!":"Eintrag abgelehnt.","success");
  }
  async function handleDeleteEntry(id){
    await deleteEntry(id);
    await loadEntries(isAdmin,session.user.id);
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

  function handlePrint(mode){setPrintMode(mode);setTimeout(()=>{window.print();setTimeout(()=>setPrintMode(null),600);},300);}

  // Kalender: bestätigte + eigene pending
  function calEntries(){
    return entries.filter(e=>e.status==="confirmed"||(e.user_id===session?.user.id));
  }
  // Profiles mit ihren Einträgen zusammenführen
  function profilesWithEntries(){
    return profiles.map(p=>({
      ...p,
      entries:entries.filter(e=>e.user_id===p.id)
    }));
  }

  const stateName=BUNDESLAENDER.find(b=>b[0]===bundesland)?.[1]||"";
  const pendingCount=entries.filter(e=>e.status==="pending").length;

  if(loading)return(
    <div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>📅</div>
      <div style={{color:"#64748b",fontSize:14}}>Verbinde mit Datenbank…</div>
    </div>
  );
  if(!session)return <LoginScreen onLogin={handleLogin}/>;

  const navItems=isAdmin
    ?[["kalender","📅 Kalender"],["dashboard","📊 Dashboard"],["mitarbeiter","👥 Mitarbeiter"],["eintraege","📋 Einträge"],["feiertage","🗓 Ferien & Feiertage"],["profil","👤 Profil"]]
    :[["kalender","📅 Kalender"],["dashboard","📊 Dashboard"],["meinurlaub","🏖 Mein Urlaub"],["feiertage","🗓 Ferien & Feiertage"],["profil","👤 Profil"]];

  const pwu=profilesWithEntries();

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
              <div style={{fontSize:10,color:isAdmin?"#fbbf24":"#64748b"}}>{isAdmin?"Administrator":"Trainer"}</div>
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
          <button key={id} style={{...S.navBtn,...(view===id?S.navAct:{})}} onClick={()=>setView(id)}>{lbl}</button>
        ))}
        {isAdmin&&pendingCount>0&&<div style={S.pendBadge}>{pendingCount} ausstehend</div>}
        <div style={S.legend}>
          {pwu.filter(u=>u.entries.some(e=>e.status==="confirmed")).map(u=>(
            <div key={u.id} style={S.legItem}><div style={{...S.legDot,background:u.color}}/><span>{u.vorname}</span></div>
          ))}
          <div style={S.legItem}><div style={{...S.legDot,background:"#fce7f3",border:"1px solid #f9a8d4"}}/><span>Ferien</span></div>
          <div style={S.legItem}><div style={{...S.legDot,background:"#d4b896",border:"1px solid #c9a07a"}}/><span>Feiertag</span></div>
        </div>
      </nav>

      {/* NOTIFICATION */}
      {notif&&(
        <div style={{...S.notif,background:notif.type==="warn"?"#fff7ed":"#f7fce8",borderColor:notif.type==="warn"?"#f0932b":"#7ab529",color:notif.type==="warn"?"#9a3412":"#4a6b0f"}}>
          {notif.type==="warn"?"⚠️":"✅"} {notif.msg}
        </div>
      )}

      {/* MAIN */}
      <main style={S.main} onClick={()=>setTooltip(null)}>
        {view==="kalender"&&<KalView year={year} entries={calEntries()} profiles={profiles} bl={bundesland} onTip={setTooltip} offTip={()=>setTooltip(null)}/>}
        {view==="dashboard"&&<DashView users={isAdmin?pwu:pwu.filter(u=>u.id===session.user.id)} isAdmin={isAdmin} year={year} onEdit={u=>setModal({type:"editUser",data:u})}/>}
        {view==="mitarbeiter"&&isAdmin&&<MitView users={pwu} onAdd={()=>setModal({type:"addUser"})} onEdit={u=>setModal({type:"editUser",data:u})} onDelete={async id=>{if(window.confirm("Mitarbeiter wirklich löschen?"))await handleDeleteUser(id);}}/>}
        {view==="eintraege"&&isAdmin&&<EintAdmin entries={entries} profiles={profiles} onStatus={handleSetStatus} onDelete={async id=>{if(window.confirm("Löschen?"))await handleDeleteEntry(id);}} onAdd={uid=>setModal({type:"addEntry",data:{userId:uid}})} onEdit={(uid,e)=>setModal({type:"editEntry",data:{userId:uid,entry:e}})}/>}
        {view==="meinurlaub"&&!isAdmin&&<MeinUrlaub user={pwu.find(u=>u.id===session.user.id)||profile} onAdd={()=>setModal({type:"addEntry",data:{userId:session.user.id}})} onEdit={e=>setModal({type:"editEntry",data:{userId:session.user.id,entry:e}})} onDelete={async id=>{if(window.confirm("Löschen?"))await handleDeleteEntry(id);}}/>}
        {view==="feiertage"&&<FerView year={year} state={bundesland} stateName={stateName}/>}
        {view==="profil"&&<ProfView user={pwu.find(u=>u.id===session?.user.id)||profile} onSave={async(id,d)=>handleUpdateProfile(id,d)} onChangePw={handleChangePw}/>}
      </main>

      {/* TOOLTIP */}
      {tooltip&&(
        <div style={{position:"fixed",left:Math.min(tooltip.x+14,window.innerWidth-250),top:Math.max(tooltip.y-8,60),background:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"10px 14px",zIndex:3000,boxShadow:"0 12px 32px rgba(0,0,0,0.5)",pointerEvents:"none",maxWidth:250}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6}}>{tooltip.date}</div>
          {tooltip.lines.map((l,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><div style={{width:8,height:8,borderRadius:"50%",background:l.color,flexShrink:0}}/><span style={{fontSize:12,color:"#f1f5f9"}}>{l.text}</span></div>)}
        </div>
      )}

      {/* MODALS */}
      {modal?.type==="addUser"&&<UserModal title="Neuer Mitarbeiter" isAdmin onSave={async d=>{await handleCreateUser(d);setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.type==="editUser"&&<UserModal title="Mitarbeiter bearbeiten" initial={modal.data} isAdmin onSave={async d=>{await handleUpdateProfile(d.id,d);setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.type==="addEntry"&&<EntryModal title="Urlaubsantrag" year={year} isAdmin={isAdmin} onSave={async d=>{await handleCreateEntry({...d,user_id:modal.data.userId});setModal(null);}} onClose={()=>setModal(null)}/>}
      {modal?.type==="editEntry"&&<EntryModal title="Eintrag bearbeiten" year={year} isAdmin={isAdmin} initial={modal.data.entry} onSave={async d=>{await handleUpdateEntry(modal.data.entry.id,d);setModal(null);}} onClose={()=>setModal(null)}/>}

      {/* PRINT */}
      {printMode==="kalender"&&<PrintKal year={year} entries={entries.filter(e=>e.status==="confirmed")} profiles={profiles} state={bundesland} stateName={stateName}/>}
      {printMode==="liste"&&<PrintList year={year} users={pwu} stateName={stateName}/>}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState("");
  const [busy,setBusy]=useState(false);
  const [forgotMode,setForgotMode]=useState(false);
  const [forgotEmail,setForgotEmail]=useState("");
  const [forgotSent,setForgotSent]=useState(false);

  async function submit(){
    if(!email||!pw){setErr("Bitte E-Mail und Passwort eingeben.");return;}
    setBusy(true);setErr("");
    try{await onLogin(email,pw);}
    catch(e){setErr(e.message);}
    finally{setBusy(false);}
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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8f5eb 0%,#f0f4f0 50%,#e0efe3 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#ffffff",borderRadius:16,padding:40,width:420,maxWidth:"90vw",border:"1px solid #d5e8a0",boxShadow:"0 20px 60px rgba(61,122,79,0.15)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TZ Westlausitz" style={{height:80,width:"auto",marginBottom:8}}/>
          <div style={{fontSize:13,color:"#5a6b4a",marginTop:8,fontWeight:600,letterSpacing:"0.02em"}}>Urlaubsplaner · Individuelles Funktionstraining</div>
        </div>

        {!forgotMode?(
          <>
            <div style={{marginBottom:14}}><label style={S.lbl}>E-Mail</label><input style={S.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus placeholder="name@tz-westlausitz.de"/></div>
            <div style={{marginBottom:8,position:"relative"}}><label style={S.lbl}>Passwort</label><input style={S.inp} type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/><button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:10,top:27,background:"none",border:"none",color:"#64748b",cursor:"pointer"}}>{showPw?"🙈":"👁"}</button></div>
            <div style={{textAlign:"right",marginBottom:16}}>
              <button onClick={()=>{setForgotMode(true);setForgotEmail(email);setErr("");}} style={{background:"none",border:"none",color:"#64748b",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Passwort vergessen?</button>
            </div>
            {err&&<div style={{fontSize:12,color:"#f87171",marginBottom:14,padding:"8px 12px",background:"rgba(248,113,113,0.1)",borderRadius:6,border:"1px solid rgba(248,113,113,0.2)"}}>{err}</div>}
            <button style={{...S.savBtn,width:"100%",padding:"11px 0",fontSize:14,opacity:busy?0.6:1}} onClick={submit} disabled={busy}>{busy?"Anmelden…":"Anmelden"}</button>
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
function KalView({year,entries,profiles,bl,onTip,offTip}){
  return(<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>{MONTHS.map((_,m)=><MonthCard key={m} year={year} month={m} entries={entries} profiles={profiles} bl={bl} onTip={onTip} offTip={offTip}/>)}</div>);
}
function MonthCard({year,month,entries,profiles,bl,onTip,offTip}){
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
          const fei=isFT(iso,bl,year),fer=isFer(iso,bl,year);
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

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashView({users,isAdmin,year,onEdit}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  return(
    <div>
      <h2 style={S.pgT}>Dashboard {year}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
        {users.map(u=>{
          const entries=u.entries||[];
          const urlU=eDays(entries,"urlaub"),rstU=eDays(entries,"resturlaub"),ueU=eDays(entries,"ueberstunden");
          const total=urlU+rstU,rem=(u.urlaubstage||30)-total,ueRem=(u.ueberstunden||0)-ueU;
          const pend=entries.filter(e=>e.status==="pending").length;
          return(
            <div key={u.id} style={{...S.card,borderTop:`4px solid ${u.color||"#3d7a4f"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{...S.av,width:40,height:40,fontSize:16,background:u.color||"#2563EB"}}>{u.vorname?.[0]||"?"}</div>
                  <div><div style={{fontWeight:700,fontSize:15,color:"#2d3a2e"}}>{u.vorname} {u.nachname}</div><div style={{fontSize:11,color:"#5a6b4a",fontWeight:500}}>{u.position||"Trainer"}</div></div>
                </div>
                {isAdmin&&<button style={S.icnBtn} onClick={()=>onEdit(u)}>✏️</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <StatBox label="Urlaub" val={total} total={u.urlaubstage||30} color={u.color||"#2563EB"}/>
                <StatBox label="Überstunden" val={ueU} total={u.ueberstunden||0} color={lighten(u.color||"#2563EB",0.3)}/>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:entries.length>0?10:0}}>
                {rstU>0&&<Chip text={`↩ Resturlaub: ${rstU}T`} bg={ca(u.color||"#2563EB",0.12)} col={lighten(u.color||"#2563EB",0.2)}/>}
                <Chip text={rem>=0?`✅ Noch: ${rem}T`:`⚠ Überzogen: ${Math.abs(rem)}T`} bg={rem<0?"rgba(248,113,113,0.15)":"rgba(100,116,139,0.12)"} col={rem<0?"#f87171":"#94a3b8"}/>
                {(u.ueberstunden||0)>0&&<Chip text={ueRem>=0?`⏱ ÜS-Rest: ${ueRem}T`:`⏱ ÜS+: ${Math.abs(ueRem)}T`} bg="rgba(139,92,246,0.12)" col="#a78bfa"/>}
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
                          <div style={{fontSize:10,color:"#5a6b4a"}}>{TL[e.type]||e.type} · {countWD(e.von,e.bis)} T</div>
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
function StatBox({label,val,total,color}){const p=total>0?Math.min(100,Math.round(val/total*100)):0;return(<div style={{background:"#f8faf0",borderRadius:8,padding:"9px 11px",border:"1px solid #edf5ee"}}><div style={{fontSize:10,color:"#5a6b4a",marginBottom:3,fontWeight:600}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:"#2d3a2e"}}>{val}<span style={{color:"#8aaa5f",fontWeight:400,fontSize:12}}> / {total}</span></div><div style={{marginTop:5,height:4,background:"#d4e6d8",borderRadius:2}}><div style={{height:"100%",width:p+"%",background:color,borderRadius:2}}/></div></div>);}
function Chip({text,bg,col}){return<span style={{fontSize:11,background:bg,color:col,borderRadius:20,padding:"3px 9px",whiteSpace:"nowrap",fontWeight:600}}>{text}</span>;}
function StBadge({status}){const m={confirmed:["✓ Bestätigt","#15803d","#dcfce7"],pending:["⏳ Ausstehend","#92400e","#fef3c7"],rejected:["✗ Abgelehnt","#991b1b","#fee2e2"]};const[t,c,b]=m[status]||["?","#6b8f74","#f0f4f0"];return<span style={{fontSize:10,background:b,color:c,borderRadius:20,padding:"3px 9px",fontWeight:700,whiteSpace:"nowrap",border:`1px solid ${b}`}}>{t}</span>;}

// ─── Mitarbeiter ──────────────────────────────────────────────────────────────
function MitView({users,onAdd,onEdit,onDelete}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={S.pgT}>Mitarbeiter ({users.length})</h2>
        <button style={S.addBtn} onClick={onAdd}>+ Mitarbeiter anlegen</button>
      </div>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #d5e8a0",overflow:"hidden",boxShadow:"0 2px 8px rgba(61,122,79,0.06)"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8faf0"}}>{["Name","E-Mail","Rolle","Urlaub","Überstunden","Offen",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map(u=>{
              const entries=u.entries||[];
              const urlT=eDays(entries,"urlaub")+eDays(entries,"resturlaub"),ueT=eDays(entries,"ueberstunden"),pend=entries.filter(e=>e.status==="pending").length;
              return(
                <tr key={u.id} style={{borderBottom:"1px solid #edf5ee"}}>
                  <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{...S.av,width:30,height:30,fontSize:13,background:u.color||"#2563EB"}}>{u.vorname?.[0]||"?"}</div>{u.vorname} {u.nachname}</div></td>
                  <td style={{...S.td,fontSize:12,color:"#8aaa5f"}}>{u.email}</td>
                  <td style={S.td}><span style={{fontSize:11,background:u.role==="admin"?"#fef3c7":"#e0f2fe",color:u.role==="admin"?"#92400e":"#0369a1",padding:"2px 8px",borderRadius:10,fontWeight:600}}>{u.role==="admin"?"Admin":"Trainer"}</span></td>
                  <td style={S.td}>{urlT} / {u.urlaubstage||30} T</td>
                  <td style={S.td}>{ueT} / {u.ueberstunden||0} T</td>
                  <td style={S.td}>{pend>0&&<Chip text={`${pend} offen`} bg="#fef3c7" col="#92400e"/>}</td>
                  <td style={S.td}><div style={{display:"flex",gap:6}}><button style={S.icnBtn} onClick={()=>onEdit(u)}>✏️</button><button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>onDelete(u.id)}>🗑</button></div></td>
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
function EintAdmin({entries,profiles,onStatus,onDelete,onAdd,onEdit}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const rich=entries.map(e=>{
    const prof=profiles.find(p=>p.id===e.user_id)||e.profiles||{};
    return{...e,pName:`${prof.vorname||""} ${prof.nachname||""}`.trim(),pColor:prof.color||"#2563EB"};
  }).sort((a,b)=>a.von.localeCompare(b.von));
  const pend=rich.filter(e=>e.status==="pending");
  const rest=rich.filter(e=>e.status!=="pending");
  function ETable({rows,showAct}){
    if(!rows.length)return null;
    return(
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #d5e8a0",overflow:"hidden",boxShadow:"0 1px 4px rgba(61,122,79,0.06)",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f8faf0"}}>{["Mitarbeiter","Typ","Von","Bis","Tage","Status",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(e=>(
              <tr key={e.id} style={{borderBottom:"1px solid #edf5ee"}}>
                <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{...S.legDot,background:e.pColor}}/>{e.pName||"Unbekannt"}</div></td>
                <td style={S.td}><span style={{fontSize:11,background:ca(e.pColor,0.2),color:e.pColor,borderRadius:10,padding:"2px 8px"}}>{TL[e.type]||e.type}</span></td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.von)}</td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:12}}>{fmtDE(e.bis)}</td>
                <td style={{...S.td,fontWeight:600,color:"#94a3b8"}}>{countWD(e.von,e.bis)}</td>
                <td style={S.td}><StBadge status={e.status}/></td>
                <td style={S.td}>
                  <div style={{display:"flex",gap:4}}>
                    {showAct&&e.status==="pending"&&<>
                      <button style={{...S.icnBtn,background:"#dcfce7",color:"#15803d",fontSize:14}} onClick={()=>onStatus(e.id,"confirmed")} title="Bestätigen">✓</button>
                      <button style={{...S.icnBtn,background:"rgba(248,113,113,0.15)",color:"#f87171",fontSize:14}} onClick={()=>onStatus(e.id,"rejected")} title="Ablehnen">✗</button>
                    </>}
                    <button style={S.icnBtn} onClick={()=>onEdit(e.user_id,e)}>✏️</button>
                    <button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>onDelete(e.id)}>🗑</button>
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
        <h2 style={S.pgT}>Alle Einträge</h2>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {profiles.map(u=><button key={u.id} style={{...S.addBtn,background:u.color||"#2563EB",fontSize:11,padding:"6px 10px"}} onClick={()=>onAdd(u.id)}>+ {u.vorname}</button>)}
        </div>
      </div>
      {pend.length>0&&<><div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>⏳ Ausstehend ({pend.length})</div><ETable rows={pend} showAct/></>}
      {rest.length>0&&<><div style={{fontSize:13,fontWeight:700,color:"#6a9e2f",marginBottom:8}}>📋 Alle ({rest.length})</div><ETable rows={rest}/></>}
      {rich.length===0&&<div style={{color:"#475569",fontSize:14,padding:24,textAlign:"center"}}>Noch keine Einträge.</div>}
    </div>
  );
}

// ─── Mein Urlaub ─────────────────────────────────────────────────────────────
function MeinUrlaub({user,onAdd,onEdit,onDelete}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const entries=user?.entries||[];
  const urlU=eDays(entries,"urlaub"),rstU=eDays(entries,"resturlaub"),ueU=eDays(entries,"ueberstunden");
  const rem=(user?.urlaubstage||30)-(urlU+rstU);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <h2 style={S.pgT}>Mein Urlaub</h2>
        <button style={{...S.addBtn,background:user?.color||"#2563EB"}} onClick={onAdd}>+ Urlaub beantragen</button>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[["📅","Urlaubstage",user?.urlaubstage||30,false],["✈️","Genommen",urlU+rstU,false],["✅","Verbleibend",rem,rem<0],...(rstU>0?[["↩","Resturlaub",rstU,false]]:[]),...((user?.ueberstunden||0)>0?[["⏱","Überstunden",`${ueU}/${user.ueberstunden}`,false]]:[])].map(([ic,lb,vl,warn])=>(
          <div key={lb} style={{background:"#fff",borderRadius:10,padding:"12px 16px",border:`1.5px solid ${warn?"#fca5a5":"#d4e6d8"}`,minWidth:90,boxShadow:"0 1px 4px rgba(61,122,79,0.06)"}}>
            <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
            <div style={{fontSize:20,fontWeight:800,color:warn?"#dc2626":"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{vl}</div>
            <div style={{fontSize:11,color:"#5a6b4a",fontWeight:600}}>{lb}</div>
          </div>
        ))}
      </div>
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
                <td style={{...S.td,fontWeight:600,color:"#94a3b8"}}>{countWD(e.von,e.bis)}</td>
                <td style={S.td}><StBadge status={e.status}/></td>
                <td style={S.td}>{e.status!=="confirmed"&&<div style={{display:"flex",gap:6}}><button style={S.icnBtn} onClick={()=>onEdit(e)}>✏️</button><button style={{...S.icnBtn,color:"#f87171"}} onClick={()=>onDelete(e.id)}>🗑</button></div>}</td>
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
        <div><h2 style={S.pgT}>Ferien & Feiertage {year}</h2><div style={{fontSize:13,color:"#64748b"}}>📍 {stateName}</div></div>
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
                <div style={{fontSize:11,color:"#8aaa5f",marginTop:3}}>{countWD(v,b)} Werktage</div>
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
function ProfView({user,onSave,onChangePw}){
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

  async function saveProfile(){
    setBusy(true);
    try{await onSave(user.id,{
      ...form,
      urlaubstage:parseInt(form.urlaubstage)||0,
      ueberstunden:parseInt(form.ueberstunden)||0,
    });}
    finally{setBusy(false);}
  }
  async function changePw(){
    if(!curPw){setPwMsg("Bitte aktuelles Passwort eingeben.");return;}
    if(npass.length<6){setPwMsg("Mindestens 6 Zeichen.");return;}
    if(npass!==npass2){setPwMsg("Passwörter stimmen nicht überein.");return;}
    setBusy(true);
    try{await onChangePw(curPw,npass);setCurPw("");setNpass("");setNpass2("");setPwMode(false);setPwMsg("");}
    catch(e){setPwMsg(e.message);}
    finally{setBusy(false);}
  }
  return(
    <div style={{maxWidth:580}}>
      <h2 style={{...S.pgT,marginBottom:20}}>Mein Profil</h2>
      <div style={S.card}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <div style={{...S.av,width:52,height:52,fontSize:20,background:form.color}}>{form.vorname?.[0]||"?"}</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{form.vorname} {form.nachname}</div>
            <div style={{fontSize:12,color:user?.role==="admin"?"#92400e":"#5a6b4a",fontWeight:600}}>{user?.role==="admin"?"Administrator":"Trainer"}</div>
            <div style={{fontSize:12,color:"#8aaa5f"}}>{user?.email}</div>
          </div>
        </div>

        {/* ── Stammdaten ── */}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
          {/* Zeile 1: Vorname + Nachname */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={S.lbl}>Vorname</label>
              <input style={S.inp} value={form.vorname} onChange={e=>setForm(f=>({...f,vorname:e.target.value}))}/>
            </div>
            <div><label style={S.lbl}>Nachname</label>
              <input style={S.inp} value={form.nachname} onChange={e=>setForm(f=>({...f,nachname:e.target.value}))}/>
            </div>
          </div>
          {/* Zeile 2: Geburtsdatum (schmal, fixe Breite) + Position */}
          <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:12}}>
            <div>
              <label style={S.lbl}>Geburtsdatum</label>
              <input style={{...S.inp,padding:"8px 8px"}} type="date" value={form.geburtsdatum}
                onChange={e=>setForm(f=>({...f,geburtsdatum:e.target.value}))}/>
            </div>
            <div><label style={S.lbl}>Position</label>
              <input style={S.inp} value={form.position}
                onChange={e=>setForm(f=>({...f,position:e.target.value}))}/>
            </div>
          </div>
          {/* Zeile 3: Urlaubstage + Überstunden */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={S.lbl}>Urlaubstage / Jahr</label>
              <input style={S.inp} type="text" inputMode="numeric" pattern="[0-9]*"
                value={form.urlaubstage}
                onChange={e=>setForm(f=>({...f,urlaubstage:e.target.value.replace(/[^0-9]/g,"")}))}
                onFocus={e=>e.target.select()}/>
            </div>
            <div><label style={S.lbl}>Überstunden (Tage)</label>
              <input style={S.inp} type="text" inputMode="numeric" pattern="[0-9]*"
                value={form.ueberstunden}
                onChange={e=>setForm(f=>({...f,ueberstunden:e.target.value.replace(/[^0-9]/g,"")}))}
                onFocus={e=>e.target.select()}/>
            </div>
          </div>
        </div>

        <div style={{marginBottom:16}}><label style={S.lbl}>Farbe</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {PRESET_COLORS.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:28,height:28,borderRadius:6,background:c,cursor:"pointer",outline:form.color===c?"3px solid #2d3a2e":"none",outlineOffset:2}}/>)}
            <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{width:32,height:32,border:"none",borderRadius:6,cursor:"pointer"}}/>
          </div>
        </div>
        <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={saveProfile} disabled={busy}>Profil speichern</button>
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
              {pwMsg&&<div style={{fontSize:12,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"8px 12px",borderRadius:6}}>{pwMsg}</div>}
              <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={changePw} disabled={busy}>Passwort ändern</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({title,initial,isAdmin,onSave,onClose,onResetPw}){
  const[f,setF]=useState({
    vorname:initial?.vorname||"",nachname:initial?.nachname||"",
    email:initial?.email||"",role:initial?.role||"trainer",
    color:initial?.color||PRESET_COLORS[0],position:initial?.position||"Trainer",
    geburtsdatum:initial?.geburtsdatum||"",
    urlaubstage:String(initial?.urlaubstage??30),
    ueberstunden:String(initial?.ueberstunden??0),
    resturlaub:String(initial?.resturlaub??0),
    ...(initial?{id:initial.id}:{})
  });
  // Für neuen User: Passwort
  const[newUserPw,setNewUserPw]=useState("");
  const[showPw,setShowPw]=useState(false);
  // Admin-Passwort-Reset für bestehenden User
  const[showPwReset,setShowPwReset]=useState(false);
  const[adminPw,setAdminPw]=useState("");
  const[adminPw2,setAdminPw2]=useState("");
  const[pwErr,setPwErr]=useState("");
  const[busy,setBusy]=useState(false);

  // Zahlenfeld: beim Fokus leeren damit man direkt tippen kann
  function numFocus(e){if(e.target.value==="0")e.target.select();}

  async function save(){
    if(!f.vorname||!f.email){alert("Vorname und E-Mail sind Pflicht.");return;}
    if(!initial&&!newUserPw){alert("Passwort für neuen Mitarbeiter erforderlich.");return;}
    setBusy(true);
    try{await onSave({...f,urlaubstage:parseInt(f.urlaubstage)||0,ueberstunden:parseInt(f.ueberstunden)||0,resturlaub:parseInt(f.resturlaub)||0,...(!initial?{password:newUserPw}:{})});}
    finally{setBusy(false);}
  }

  async function saveAdminPwReset(){
    if(adminPw.length<6){setPwErr("Mindestens 6 Zeichen.");return;}
    if(adminPw!==adminPw2){setPwErr("Passwörter stimmen nicht überein.");return;}
    setBusy(true);
    try{
      await onResetPw(initial.id,adminPw);
      setShowPwReset(false);setAdminPw("");setAdminPw2("");setPwErr("");
      alert("Passwort wurde zurückgesetzt.");
    }catch(e){setPwErr(e.message);}
    finally{setBusy(false);}
  }

  return(
    <div style={S.overlay}>
      <div style={{...S.modal,maxHeight:"92vh",overflowY:"auto",width:520}}>
        <div style={S.mHd}><span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{title}</span><button style={S.clsBtn} onClick={onClose}>✕</button></div>
        <div style={S.mBd}>

          {/* ── Stammdaten ── */}
          <div style={{fontSize:11,fontWeight:700,color:"#6a9e2f",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Stammdaten</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={S.lbl}>Vorname *</label><input style={S.inp} value={f.vorname} onChange={e=>setF(p=>({...p,vorname:e.target.value}))}/></div>
              <div><label style={S.lbl}>Nachname</label><input style={S.inp} value={f.nachname} onChange={e=>setF(p=>({...p,nachname:e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:12}}>
              <div><label style={S.lbl}>Geburtsdatum</label><input style={{...S.inp,padding:"8px 6px"}} type="date" value={f.geburtsdatum} onChange={e=>setF(p=>({...p,geburtsdatum:e.target.value}))}/></div>
              <div><label style={S.lbl}>Position</label><input style={S.inp} value={f.position} onChange={e=>setF(p=>({...p,position:e.target.value}))}/></div>
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
            {isAdmin&&<div><label style={S.lbl}>Rolle</label>
              <select style={S.inp} value={f.role} onChange={e=>setF(p=>({...p,role:e.target.value}))}>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>}
          </div>

          {/* ── Farbe ── */}
          <div style={{marginBottom:16}}><label style={S.lbl}>Farbe</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              {PRESET_COLORS.map(c=><div key={c} onClick={()=>setF(p=>({...p,color:c}))} style={{width:26,height:26,borderRadius:5,background:c,cursor:"pointer",outline:f.color===c?"3px solid #fff":"none",outlineOffset:2}}/>)}
              <input type="color" value={f.color} onChange={e=>setF(p=>({...p,color:e.target.value}))} style={{width:30,height:30,border:"none",borderRadius:5,cursor:"pointer"}}/>
            </div>
          </div>

          {/* ── Zugangsdaten (separater Bereich) ── */}
          <div style={{borderTop:"1px solid #334155",paddingTop:14,marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6a9e2f",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>🔐 Zugangsdaten</div>

            {/* E-Mail */}
            <div style={{marginBottom:12}}><label style={S.lbl}>E-Mail-Adresse *</label>
              <input style={S.inp} type="email" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/>
            </div>

            {/* Neuer User: Passwort */}
            {!initial&&(
              <div><label style={S.lbl}>Passwort *</label>
                <div style={{position:"relative"}}>
                  <input style={S.inp} type={showPw?"text":"password"} value={newUserPw} onChange={e=>setNewUserPw(e.target.value)}/>
                  <button onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:8,top:8,background:"none",border:"none",color:"#64748b",cursor:"pointer"}}>{showPw?"🙈":"👁"}</button>
                </div>
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
                    <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={saveAdminPwReset} disabled={busy}>Passwort jetzt zurücksetzen</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={S.mFt}>
          <button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={save} disabled={busy}>Speichern</button>
          <button style={S.canBtn} onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({title,year,isAdmin,initial,onSave,onClose}){
  const[type,setType]=useState(initial?.type||"urlaub");
  const[von,setVon]=useState(initial?.von||`${year}-01-01`);
  const[bis,setBis]=useState(initial?.bis||`${year}-01-07`);
  const[note,setNote]=useState(initial?.note||"");
  const[busy,setBusy]=useState(false);
  const wd=countWD(von,bis);
  async function save(){if(!von||!bis||bis<von){alert("Bitte gültige Daten wählen.");return;}setBusy(true);try{await onSave({type,von,bis,note});}finally{setBusy(false);}}
  return(
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.mHd}><span style={{fontWeight:800,fontSize:16,color:"#2d3a2e",fontFamily:"'Nunito',sans-serif"}}>{title}</span><button style={S.clsBtn} onClick={onClose}>✕</button></div>
        <div style={S.mBd}>
          <div style={{marginBottom:12}}><label style={S.lbl}>Typ</label><select style={S.inp} value={type} onChange={e=>setType(e.target.value)}><option value="urlaub">Urlaub</option><option value="resturlaub">Resturlaub (Vorjahr)</option><option value="ueberstunden">Überstunden abbauen</option></select></div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Von</label><input style={S.inp} type="date" value={von} onChange={e=>{setVon(e.target.value);if(e.target.value>bis)setBis(e.target.value);}}/></div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Bis</label><input style={S.inp} type="date" value={bis} min={von} onChange={e=>setBis(e.target.value)}/></div>
          <div style={{marginBottom:12}}><label style={S.lbl}>Hinweis (optional)</label><input style={S.inp} value={note} onChange={e=>setNote(e.target.value)} placeholder="z.B. Familienurlaub"/></div>
          <div style={{fontSize:13,color:"#94a3b8",padding:"8px 0",borderTop:"1px solid #334155"}}>Arbeitstage (Mo–Fr): <strong style={{color:"#f1f5f9"}}>{wd}</strong></div>
          {!isAdmin&&<div style={{fontSize:11,color:"#64748b",marginTop:6}}>Ihr Antrag wird dem Administrator zur Genehmigung vorgelegt.</div>}
        </div>
        <div style={S.mFt}><button style={{...S.savBtn,opacity:busy?0.6:1}} onClick={save} disabled={busy}>{isAdmin?"Speichern":"Beantragen"}</button><button style={S.canBtn} onClick={onClose}>Abbrechen</button></div>
      </div>
    </div>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
function PrintKal({year,entries,profiles,state,stateName}){
  const ps={wrap:{position:"fixed",inset:0,background:"#fff",color:"#111",fontFamily:"Arial,sans-serif",padding:7,zIndex:9999},grid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,height:"calc(100% - 40px)"},mo:{border:"1px solid #ccc",padding:3,display:"flex",flexDirection:"column"},mt:{fontSize:8,fontWeight:700,textAlign:"center",marginBottom:2,borderBottom:"1px solid #eee",paddingBottom:2},cg:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flex:1},dh:{fontSize:6,fontWeight:700,color:"#888",textAlign:"center"},dc:{textAlign:"center",fontSize:6,minHeight:11,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:1},leg:{marginTop:3,display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"},li:{display:"flex",alignItems:"center",gap:3,fontSize:6},dot:{width:6,height:6,borderRadius:"50%"}};
  return(
    <div className="pt" style={ps.wrap}>
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
function PrintList({year,users,stateName}){
  const TL={urlaub:"Urlaub",resturlaub:"Resturlaub",ueberstunden:"Überstunden"};
  const ps={wrap:{position:"fixed",inset:0,background:"#fff",color:"#111",fontFamily:"Arial,sans-serif",padding:14,zIndex:9999},t:{width:"100%",borderCollapse:"collapse",fontSize:10},th:{textAlign:"left",padding:"4px 8px",background:"#f1f5f9",borderBottom:"1px solid #e2e8f0",fontWeight:600},td:{padding:"4px 8px",borderBottom:"1px solid #f8fafc"}};
  return(
    <div className="pt" style={ps.wrap}>
      <div style={{fontSize:16,fontWeight:700,textAlign:"center",marginBottom:12}}>Urlaubsliste {year} · {stateName}</div>
      {users.map(u=>{const entries=u.entries||[];const urlU=eDays(entries,"urlaub")+eDays(entries,"resturlaub"),ueU=eDays(entries,"ueberstunden");return(
        <div key={u.id} style={{marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:12,padding:"5px 8px",background:"#f1f5f9",borderLeft:`3px solid ${u.color||"#2563EB"}`,marginBottom:4,display:"flex",justifyContent:"space-between"}}><span>{u.vorname} {u.nachname}</span><span style={{fontWeight:400,fontSize:10,color:"#555"}}>Urlaub: {urlU}/{u.urlaubstage||30} · ÜS: {ueU}/{u.ueberstunden||0}</span></div>
          <table style={ps.t}><thead><tr>{["Typ","Von","Bis","Tage","Status"].map(h=><th key={h} style={ps.th}>{h}</th>)}</tr></thead>
            <tbody>{[...entries].sort((a,b)=>a.von.localeCompare(b.von)).map(e=><tr key={e.id}><td style={ps.td}>{TL[e.type]||e.type}</td><td style={ps.td}>{fmtDE(e.von)}</td><td style={ps.td}>{fmtDE(e.bis)}</td><td style={ps.td}>{countWD(e.von,e.bis)}</td><td style={ps.td}>{e.status}</td></tr>)}</tbody>
          </table>
        </div>
      );})}
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
  legend:{marginLeft:"auto",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",paddingLeft:12},
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
  overlay:{position:"fixed",inset:0,background:"rgba(45,58,46,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1500,backdropFilter:"blur(4px)"},
  modal:{background:"#ffffff",borderRadius:16,width:500,maxWidth:"95vw",border:"1px solid #d5e8a0",boxShadow:"0 20px 60px rgba(61,122,79,0.18)"},
  mHd:{padding:"18px 22px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #edf5ee"},
  mBd:{padding:"18px 22px"},
  mFt:{padding:"14px 22px 18px",display:"flex",gap:10,borderTop:"1px solid #edf5ee"},
  inp:{width:"100%",background:"#f8faf0",border:"1.5px solid #c8d890",borderRadius:8,padding:"9px 12px",color:"#2d3a2e",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .15s"},
  lbl:{display:"block",fontSize:11,fontWeight:700,color:"#5a6b4a",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"},
  savBtn:{background:"#5a8a1f",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:"0 2px 6px rgba(61,122,79,0.25)"},
  canBtn:{background:"#f5f8ec",color:"#5a6b4a",border:"1px solid #d5e8a0",borderRadius:8,padding:"10px 20px",fontSize:13,cursor:"pointer",fontWeight:600},
  clsBtn:{background:"none",border:"none",color:"#8aaa5f",fontSize:20,lineHeight:1,padding:"2px 6px",cursor:"pointer"},
  tabTgl:{background:"none",border:"none",color:"#8aaa5f",padding:"7px 13px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"},
  tabTglAct:{background:"#e8f5eb",color:"#5a8a1f",fontWeight:700},
};
