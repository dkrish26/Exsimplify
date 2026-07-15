/* ============================================================
   ExSimplify — Categories & smart reminder configuration
   ------------------------------------------------------------
   Edit this file to add/change expense types without touching
   app logic.

   Each category:
     id      unique key (never change once items exist!)
     tab     which bottom tab it lives in: subs | bills | renewals | car
     label   shown in the Type dropdown
     emoji   shown on item rows
     freq    default repeat cycle
     lead    default "remind me N days before" (per-item overridable)
     vehicle true → shows the Vehicle field (used to match
             car insurance ↔ registration for the lapse warning)
   ============================================================ */

export const CATEGORIES = [
  // ---- Subs ----
  { id: "streaming",        tab: "subs", label: "Streaming (Netflix, Apple TV…)", emoji: "📺", freq: "monthly", lead: 3 },
  { id: "cloud_apps",       tab: "subs", label: "Cloud & apps (Google One, iCloud…)", emoji: "☁️", freq: "monthly", lead: 3 },
  { id: "ai_tools",         tab: "subs", label: "AI tools (Claude, ChatGPT…)", emoji: "🤖", freq: "monthly", lead: 3 },
  { id: "gym",              tab: "subs", label: "Gym & fitness", emoji: "💪", freq: "monthly", lead: 5 },
  { id: "other_sub",        tab: "subs", label: "Other subscription", emoji: "📱", freq: "monthly", lead: 3 },

  // ---- Bills ----
  { id: "mobile_plan",      tab: "bills", label: "Mobile plan (du, Etisalat…)", emoji: "📶", freq: "monthly", lead: 3 },
  { id: "internet",         tab: "bills", label: "Home internet / WiFi", emoji: "🌐", freq: "monthly", lead: 3 },
  { id: "utilities",        tab: "bills", label: "DEWA / FEWA / SEWA", emoji: "⚡", freq: "monthly", lead: 3 },
  { id: "rent",             tab: "bills", label: "Rent (cheque)", emoji: "🏠", freq: "yearly", lead: 30 },
  { id: "school",           tab: "bills", label: "School fees", emoji: "🎒", freq: "quarterly", lead: 15 },
  { id: "other_bill",       tab: "bills", label: "Other bill", emoji: "🧾", freq: "monthly", lead: 3 },

  // ---- Renewals ----
  { id: "passport",         tab: "renewals", label: "Passport", emoji: "🛂", freq: "fiveyear", lead: 180 },
  { id: "visa",             tab: "renewals", label: "Residence visa", emoji: "🪪", freq: "twoyear", lead: 30 },
  { id: "emirates_id",      tab: "renewals", label: "Emirates ID", emoji: "🆔", freq: "twoyear", lead: 30 },
  { id: "health_insurance", tab: "renewals", label: "Health insurance", emoji: "🏥", freq: "yearly", lead: 30 },
  { id: "tenancy",          tab: "renewals", label: "Tenancy / Ejari", emoji: "📄", freq: "yearly", lead: 45 },
  { id: "trade_license",    tab: "renewals", label: "Trade license", emoji: "📜", freq: "yearly", lead: 30 },
  { id: "other_renewal",    tab: "renewals", label: "Other renewal", emoji: "📌", freq: "yearly", lead: 30 },

  // ---- Car ----
  { id: "car_registration", tab: "car", label: "Car registration (Mulkiya)", emoji: "🚗", freq: "yearly", lead: 15, vehicle: true },
  { id: "car_insurance",    tab: "car", label: "Car insurance", emoji: "🛡️", freq: "yearly", lead: 30, vehicle: true },
  { id: "car_loan",         tab: "car", label: "Car loan EMI", emoji: "🚙", freq: "monthly", lead: 3, vehicle: true },
  { id: "salik",            tab: "car", label: "Salik / parking", emoji: "🛣️", freq: "monthly", lead: 3 },
];

export const TABS = {
  home:     { title: "Home" },
  subs:     { title: "Subscriptions", hint: "Netflix, Apple TV, Google One, Claude…" },
  bills:    { title: "Bills", hint: "Mobile, WiFi, DEWA/FEWA, rent cheques, school fees." },
  renewals: { title: "Renewals", hint: "Passport, visa, Emirates ID, health insurance, Ejari." },
  car:      { title: "Car", hint: "Registration (Mulkiya), insurance, Salik, loan." },
};

export const FREQ_MONTHS = { monthly: 1, quarterly: 3, yearly: 12, twoyear: 24, threeyear: 36, fiveyear: 60, tenyear: 120, onetime: null };

export const FREQ_LABEL = { monthly: "monthly", quarterly: "quarterly", yearly: "yearly", twoyear: "every 2 yrs", threeyear: "every 3 yrs", fiveyear: "every 5 yrs", tenyear: "every 10 yrs", onetime: "one-time" };
