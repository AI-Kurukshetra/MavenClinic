import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { addDays, addWeeks, set, subDays, subMonths } from "date-fns";
import { createClient } from "@supabase/supabase-js";

type SeedRole = "patient" | "provider" | "employer_admin" | "clinic_admin" | "super_admin" | "partner";
type ProviderSpecialty = "ob_gyn" | "fertility" | "mental_health" | "nutrition" | "menopause";

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: SeedRole;
  onboardingComplete: boolean;
  employerDomain?: string;
  dateOfBirth?: string;
  pronouns?: string;
  languagePreference?: string;
  healthGoals?: string[];
  conditions?: string[];
  medications?: string;
  insuranceCarrier?: string;
  memberId?: string;
  specialtyNeeded?: string;
  preferredLanguage?: string;
  genderPreference?: string;
};

type ProviderSeed = SeedUser & {
  role: "provider";
  specialty: ProviderSpecialty;
  bio: string;
  languages: string[];
  consultationFeeCents: number;
  rating: number;
  totalReviews: number;
};

type AuthUserResult = SeedUser & { id: string };

type AppointmentSeed = {
  key: string;
  patientEmail: string;
  providerEmail: string;
  scheduledAt: string;
  status: "scheduled" | "completed" | "cancelled";
  chiefComplaint: string;
  paymentMethod?: "insurance" | "direct_pay";
  notes?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancellationReason?: string | null;
};

type ConversationSeed = {
  key: string;
  patientEmail: string;
  providerEmail: string;
  createdAt: string;
};

type MessageSeed = {
  conversationKey: string;
  senderEmail: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
};

type NotificationSeed = {
  recipientEmail: string;
  actorEmail?: string;
  appointmentKey?: string;
  type: string;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  readAt?: string | null;
};

type InvitationSeed = {
  email: string;
  role: "provider" | "employer_admin";
  accepted: boolean;
  expiresAt: string;
  createdAt: string;
  token: string;
};

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function isoAt(date: Date, hours: number, minutes: number) {
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString();
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local before running the seed script.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local before running the seed script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const employerSeed = {
  companyName: "Acme Corp",
  domain: "acme.com",
  employeeCount: 2500,
  planType: "enterprise",
  contractStart: "2026-01-01",
  contractEnd: "2026-12-31",
} as const;

const providers: ProviderSeed[] = [
  {
    email: "sarah.chen@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Sarah Chen",
    role: "provider",
    onboardingComplete: true,
    specialty: "ob_gyn",
    bio: "Board-certified OB/GYN with 12 years specializing in reproductive health and minimally invasive surgery.",
    languages: ["English", "Mandarin"],
    consultationFeeCents: 8500,
    rating: 4.9,
    totalReviews: 132,
  },
  {
    email: "amara.osei@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Amara Osei",
    role: "provider",
    onboardingComplete: true,
    specialty: "fertility",
    bio: "Reproductive endocrinologist focused on IVF, IUI, and natural fertility optimization.",
    languages: ["English", "French"],
    consultationFeeCents: 12000,
    rating: 4.8,
    totalReviews: 98,
  },
  {
    email: "maya.patel@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Maya Patel",
    role: "provider",
    onboardingComplete: true,
    specialty: "mental_health",
    bio: "Licensed therapist specializing in perinatal mental health, anxiety, and women's life transitions.",
    languages: ["English", "Hindi"],
    consultationFeeCents: 6500,
    rating: 4.9,
    totalReviews: 144,
  },
  {
    email: "elena.rodriguez@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Elena Rodriguez",
    role: "provider",
    onboardingComplete: true,
    specialty: "menopause",
    bio: "Certified menopause specialist and hormone therapy expert helping women navigate midlife health.",
    languages: ["English", "Spanish"],
    consultationFeeCents: 9500,
    rating: 4.7,
    totalReviews: 87,
  },
  {
    email: "priya.sharma@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Priya Sharma",
    role: "provider",
    onboardingComplete: true,
    specialty: "nutrition",
    bio: "Registered dietitian specializing in hormonal health, fertility nutrition, and prenatal care.",
    languages: ["English", "Hindi", "Gujarati"],
    consultationFeeCents: 5500,
    rating: 4.8,
    totalReviews: 119,
  },
];

const patientUsers: SeedUser[] = [
  {
    email: "sarah.patient@mavenclinic.dev",
    password: "Patient123!",
    fullName: "Sarah Johnson",
    role: "patient",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
    dateOfBirth: "1994-08-14",
    pronouns: "She/her",
    languagePreference: "English",
    healthGoals: ["Manage my cycle", "Start a family"],
    conditions: ["PCOS"],
    medications: "Metformin, prenatal vitamin",
    insuranceCarrier: "Aetna",
    memberId: "ACM-48291",
    specialtyNeeded: "OB/GYN",
    preferredLanguage: "English",
    genderPreference: "Female provider",
  },
  {
    email: "priya.patient@mavenclinic.dev",
    password: "Patient123!",
    fullName: "Priya Kapoor",
    role: "patient",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
    dateOfBirth: "1991-03-22",
    pronouns: "She/her",
    languagePreference: "English",
    healthGoals: ["Start a family"],
    conditions: ["None of these"],
    medications: "Prenatal vitamin",
    insuranceCarrier: "Cigna",
    memberId: "ACM-57302",
    specialtyNeeded: "Fertility",
    preferredLanguage: "English",
    genderPreference: "No preference",
  },
  {
    email: "maria.patient@mavenclinic.dev",
    password: "Patient123!",
    fullName: "Maria Santos",
    role: "patient",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
    dateOfBirth: "1978-11-09",
    pronouns: "She/her",
    languagePreference: "English",
    healthGoals: ["Menopause support", "General health"],
    conditions: ["Migraine"],
    medications: "Vitamin D",
    insuranceCarrier: "UnitedHealthcare",
    memberId: "ACM-18733",
    specialtyNeeded: "Menopause",
    preferredLanguage: "English",
    genderPreference: "Female provider",
  },
  {
    email: "emily.patient@mavenclinic.dev",
    password: "Patient123!",
    fullName: "Emily Carter",
    role: "patient",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
    dateOfBirth: "1988-05-17",
    pronouns: "She/her",
    languagePreference: "English",
    healthGoals: ["Mental wellness", "General health"],
    conditions: ["Anxiety"],
    medications: "Sertraline",
    insuranceCarrier: "Blue Cross",
    memberId: "ACM-91244",
    specialtyNeeded: "Mental Health",
    preferredLanguage: "English",
    genderPreference: "No preference",
  },
];

const roleUsers: SeedUser[] = [
  { email: "benefits@acme.com", password: "Employer123!", fullName: "Avery Brooks", role: "employer_admin", onboardingComplete: true, employerDomain: employerSeed.domain },
  { email: "clinic.admin@mavenclinic.dev", password: "Clinic123!", fullName: "Naomi Ellis", role: "clinic_admin", onboardingComplete: true },
  { email: "super.admin@mavenclinic.dev", password: "Super123!", fullName: "Morgan Lee", role: "super_admin", onboardingComplete: true },
  { email: "partner.demo@mavenclinic.dev", password: "Partner123!", fullName: "Jordan Miller", role: "partner", onboardingComplete: true },
];

const allSeedUsers: SeedUser[] = [...providers, ...patientUsers, ...roleUsers];
async function getAllAuthUsers() {
  const users: Array<{ id: string; email?: string | null }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    users.push(...data.users);
    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureAuthUsers(seedUsers: SeedUser[]) {
  const existingUsers = await getAllAuthUsers();
  const userByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
  const results: AuthUserResult[] = [];

  for (const seedUser of seedUsers) {
    const existing = userByEmail.get(seedUser.email.toLowerCase());

    if (existing?.id) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: seedUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: seedUser.fullName,
          onboardingComplete: seedUser.onboardingComplete,
        },
      });

      if (updateError) {
        throw new Error(`Failed updating auth user ${seedUser.email}: ${updateError.message}`);
      }

      console.log(`  = Updated user: ${seedUser.email}`);
      results.push({ id: existing.id, ...seedUser });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: seedUser.email,
      password: seedUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: seedUser.fullName,
        onboardingComplete: seedUser.onboardingComplete,
      },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create auth user ${seedUser.email}: ${error?.message ?? "Unknown error"}`);
    }

    console.log(`  + Created user: ${seedUser.email}`);
    results.push({ id: data.user.id, ...seedUser });
  }

  return results;
}

async function seedEmployer() {
  const { data: existing, error: existingError } = await supabase
    .from("employers")
    .select("id")
    .eq("domain", employerSeed.domain)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed checking employer seed: ${existingError.message}`);
  }

  const payload = {
    company_name: employerSeed.companyName,
    domain: employerSeed.domain,
    employee_count: employerSeed.employeeCount,
    plan_type: employerSeed.planType,
    contract_start: employerSeed.contractStart,
    contract_end: employerSeed.contractEnd,
  };

  if (existing?.id) {
    const { error } = await supabase.from("employers").update(payload).eq("id", existing.id);
    if (error) {
      throw new Error(`Failed updating employer seed: ${error.message}`);
    }
    console.log(`  = Updated employer: ${payload.company_name}`);
    return existing.id;
  }

  const { data, error } = await supabase.from("employers").insert(payload).select("id").single();
  if (error || !data?.id) {
    throw new Error(`Failed inserting employer seed: ${error?.message ?? "Unknown error"}`);
  }

  console.log(`  + Created employer: ${payload.company_name}`);
  return data.id;
}

async function seedProfiles(users: AuthUserResult[], employerId: string) {
  const rows = users.map((user) => ({
    id: user.id,
    full_name: user.fullName,
    role: user.role,
    onboarding_complete: user.onboardingComplete,
    employer_id: user.employerDomain === employerSeed.domain ? employerId : null,
    date_of_birth: user.dateOfBirth ?? null,
    pronouns: user.pronouns ?? null,
    language_preference: user.languagePreference ?? null,
    health_goals: user.healthGoals ?? [],
    existing_conditions: user.conditions ?? [],
    current_medications: user.medications ?? null,
    insurance_carrier: user.insuranceCarrier ?? null,
    insurance_member_id: user.memberId ?? null,
    specialty_needed: user.specialtyNeeded ?? null,
    preferred_language: user.preferredLanguage ?? null,
    provider_gender_preference: user.genderPreference ?? null,
  }));

  const { error } = await supabase.from("profiles").upsert(rows);
  if (error) {
    throw new Error(`Failed to upsert profiles: ${error.message}`);
  }

  console.log(`  + Upserted ${rows.length} profiles`);
}

async function seedProviderRows(users: AuthUserResult[]) {
  const providerIdByEmail = new Map<string, string>();

  for (const provider of providers) {
    const user = users.find((entry) => entry.email === provider.email);
    if (!user) {
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("providers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed checking provider ${provider.fullName}: ${existingError.message}`);
    }

    const payload = {
      profile_id: user.id,
      specialty: provider.specialty,
      bio: provider.bio,
      languages: provider.languages,
      accepting_patients: true,
      consultation_fee_cents: provider.consultationFeeCents,
      rating: provider.rating,
      total_reviews: provider.totalReviews,
    };

    if (existing?.id) {
      const { error } = await supabase.from("providers").update(payload).eq("id", existing.id);
      if (error) {
        throw new Error(`Failed updating provider ${provider.fullName}: ${error.message}`);
      }
      providerIdByEmail.set(provider.email, existing.id);
      console.log(`  = Updated provider: ${provider.fullName}`);
    } else {
      const { data, error } = await supabase.from("providers").insert(payload).select("id").single();
      if (error || !data?.id) {
        throw new Error(`Failed inserting provider ${provider.fullName}: ${error?.message ?? "Unknown error"}`);
      }
      providerIdByEmail.set(provider.email, data.id);
      console.log(`  + Created provider: ${provider.fullName}`);
    }
  }

  return providerIdByEmail;
}

async function clearDemoWorkspace(patientIds: string[], demoUserIds: string[], providerIds: string[], invitationEmails: string[]) {
  const [{ data: appointmentRowsByPatient }, { data: appointmentRowsByProvider }, { data: conversationsByPatient }, { data: conversationsByProvider }] = await Promise.all([
    patientIds.length ? supabase.from("appointments").select("id").in("patient_id", patientIds) : Promise.resolve({ data: [] as Array<{ id: string }> }),
    providerIds.length ? supabase.from("appointments").select("id").in("provider_id", providerIds) : Promise.resolve({ data: [] as Array<{ id: string }> }),
    patientIds.length ? supabase.from("conversations").select("id").in("patient_id", patientIds) : Promise.resolve({ data: [] as Array<{ id: string }> }),
    demoUserIds.length ? supabase.from("conversations").select("id").in("provider_profile_id", demoUserIds) : Promise.resolve({ data: [] as Array<{ id: string }> }),
  ]);

  const appointmentIds = Array.from(new Set([...(appointmentRowsByPatient ?? []), ...(appointmentRowsByProvider ?? [])].map((row) => row.id)));
  const conversationIds = Array.from(new Set([...(conversationsByPatient ?? []), ...(conversationsByProvider ?? [])].map((row) => row.id)));

  if (appointmentIds.length) {
    await supabase.from("notifications").delete().in("appointment_id", appointmentIds);
  }

  await supabase.from("notifications").delete().in("recipient_id", demoUserIds);
  await supabase.from("notifications").delete().in("actor_id", demoUserIds);

  if (conversationIds.length) {
    await supabase.from("messages").delete().in("conversation_id", conversationIds);
    await supabase.from("conversations").delete().in("id", conversationIds);
  }

  if (patientIds.length) {
    await supabase.from("care_plans").delete().in("patient_id", patientIds);
    await supabase.from("symptom_logs").delete().in("patient_id", patientIds);
    await supabase.from("cycle_logs").delete().in("patient_id", patientIds);
    await supabase.from("fertility_data").delete().in("patient_id", patientIds);
  }

  if (providerIds.length) {
    await supabase.from("care_plans").delete().in("provider_id", providerIds);
    await supabase.from("provider_availability").delete().in("provider_id", providerIds);
  }

  if (appointmentIds.length) {
    await supabase.from("appointments").delete().in("id", appointmentIds);
  }

  if (invitationEmails.length) {
    await supabase.from("invitations").delete().in("email", invitationEmails);
  }
}

async function seedProviderAvailability(providerIdByEmail: Map<string, string>) {
  const windows = [
    { email: "sarah.chen@mavenclinic.dev", day: 1, start: "09:00", end: "16:00" },
    { email: "sarah.chen@mavenclinic.dev", day: 3, start: "10:00", end: "17:00" },
    { email: "sarah.chen@mavenclinic.dev", day: 5, start: "09:30", end: "14:30" },
    { email: "amara.osei@mavenclinic.dev", day: 2, start: "09:00", end: "15:00" },
    { email: "amara.osei@mavenclinic.dev", day: 4, start: "11:00", end: "18:00" },
    { email: "maya.patel@mavenclinic.dev", day: 1, start: "12:00", end: "19:00" },
    { email: "maya.patel@mavenclinic.dev", day: 4, start: "09:00", end: "16:00" },
    { email: "elena.rodriguez@mavenclinic.dev", day: 2, start: "08:30", end: "15:30" },
    { email: "elena.rodriguez@mavenclinic.dev", day: 5, start: "10:00", end: "16:00" },
    { email: "priya.sharma@mavenclinic.dev", day: 3, start: "08:00", end: "13:00" },
    { email: "priya.sharma@mavenclinic.dev", day: 6, start: "09:00", end: "12:00" },
  ];

  const rows = windows.flatMap((window) => {
    const providerId = providerIdByEmail.get(window.email);
    return providerId ? [{ provider_id: providerId, day_of_week: window.day, start_time: window.start, end_time: window.end }] : [];
  });

  const { error } = await supabase.from("provider_availability").insert(rows);
  if (error) {
    throw new Error(`Failed seeding provider availability: ${error.message}`);
  }

  console.log(`  + Seeded ${rows.length} provider availability windows`);
}
async function seedDemoDataset(users: AuthUserResult[], providerIdByEmail: Map<string, string>) {
  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const providerProfileIdByEmail = new Map(providers.map((provider) => [provider.email, userIdByEmail.get(provider.email) ?? ""]));
  const now = new Date();

  const appointments: AppointmentSeed[] = [
    { key: "sarah-upcoming-obgyn", patientEmail: "sarah.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", scheduledAt: isoAt(addDays(now, 1), 10, 30), status: "scheduled", chiefComplaint: "PCOS follow-up and worsening cycle pain over the past two months." },
    { key: "sarah-completed-obgyn", patientEmail: "sarah.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", scheduledAt: isoAt(subDays(now, 18), 9, 0), status: "completed", chiefComplaint: "Review recent labs and discuss irregular periods.", notes: "Reviewed cycle trends and adjusted follow-up plan.", startedAt: isoAt(subDays(now, 18), 9, 2), completedAt: isoAt(subDays(now, 18), 9, 36) },
    { key: "sarah-completed-fertility", patientEmail: "sarah.patient@mavenclinic.dev", providerEmail: "amara.osei@mavenclinic.dev", scheduledAt: isoAt(subMonths(now, 2), 11, 0), status: "completed", chiefComplaint: "Fertility intake and ovulation pattern review.", notes: "Discussed fertile window timing and three-month plan.", startedAt: isoAt(subMonths(now, 2), 11, 5), completedAt: isoAt(subMonths(now, 2), 11, 45) },
    { key: "priya-completed-fertility", patientEmail: "priya.patient@mavenclinic.dev", providerEmail: "amara.osei@mavenclinic.dev", scheduledAt: isoAt(subDays(now, 12), 14, 0), status: "completed", chiefComplaint: "Trying to conceive for six months with irregular fertile window tracking.", notes: "Outlined cycle optimization next steps.", startedAt: isoAt(subDays(now, 12), 14, 3), completedAt: isoAt(subDays(now, 12), 14, 47) },
    { key: "priya-upcoming-therapy", patientEmail: "priya.patient@mavenclinic.dev", providerEmail: "maya.patel@mavenclinic.dev", scheduledAt: isoAt(addDays(now, 3), 16, 0), status: "scheduled", chiefComplaint: "Anxiety support during fertility treatment planning." },
    { key: "maria-today-menopause", patientEmail: "maria.patient@mavenclinic.dev", providerEmail: "elena.rodriguez@mavenclinic.dev", scheduledAt: isoAt(now, 15, 0), status: "scheduled", chiefComplaint: "Perimenopause symptom management and sleep disruption review." },
    { key: "maria-completed-nutrition", patientEmail: "maria.patient@mavenclinic.dev", providerEmail: "priya.sharma@mavenclinic.dev", scheduledAt: isoAt(subMonths(now, 3), 10, 30), status: "completed", chiefComplaint: "Nutrition support for migraine prevention and energy stability.", paymentMethod: "direct_pay", notes: "Shared anti-inflammatory meal plan.", startedAt: isoAt(subMonths(now, 3), 10, 32), completedAt: isoAt(subMonths(now, 3), 11, 5) },
    { key: "emily-today-obgyn", patientEmail: "emily.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", scheduledAt: isoAt(now, 13, 30), status: "scheduled", chiefComplaint: "Postpartum check-in and incision healing review." },
    { key: "emily-cancelled-therapy", patientEmail: "emily.patient@mavenclinic.dev", providerEmail: "maya.patel@mavenclinic.dev", scheduledAt: isoAt(subDays(now, 4), 9, 30), status: "cancelled", chiefComplaint: "Postpartum anxiety support session.", cancellationReason: "schedule_conflict" },
    { key: "emily-completed-obgyn", patientEmail: "emily.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", scheduledAt: isoAt(subMonths(now, 1), 11, 15), status: "completed", chiefComplaint: "Six-week postpartum follow-up.", notes: "Cleared for gradual exercise and ongoing pelvic floor support.", startedAt: isoAt(subMonths(now, 1), 11, 17), completedAt: isoAt(subMonths(now, 1), 11, 52) },
  ];

  const appointmentIdByKey = new Map<string, string>();
  for (const appointment of appointments) {
    const patientId = userIdByEmail.get(appointment.patientEmail);
    const providerId = providerIdByEmail.get(appointment.providerEmail);
    if (!patientId || !providerId) {
      continue;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        provider_id: providerId,
        scheduled_at: appointment.scheduledAt,
        duration_minutes: 30,
        type: "video",
        status: appointment.status,
        chief_complaint: appointment.chiefComplaint,
        payment_method: appointment.paymentMethod ?? "insurance",
        notes: appointment.notes ?? null,
        started_at: appointment.startedAt ?? null,
        completed_at: appointment.completedAt ?? null,
        cancellation_reason: appointment.cancellationReason ?? null,
        updated_at: appointment.completedAt ?? appointment.startedAt ?? appointment.scheduledAt,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(`Failed seeding appointment ${appointment.key}: ${error?.message ?? "Unknown error"}`);
    }

    appointmentIdByKey.set(appointment.key, data.id);
  }
  console.log(`  + Seeded ${appointmentIdByKey.size} appointments`);

  const conversations: ConversationSeed[] = [
    { key: "sarah-chen", patientEmail: "sarah.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", createdAt: isoAt(subDays(now, 18), 8, 45) },
    { key: "sarah-osei", patientEmail: "sarah.patient@mavenclinic.dev", providerEmail: "amara.osei@mavenclinic.dev", createdAt: isoAt(subMonths(now, 2), 10, 30) },
    { key: "priya-osei", patientEmail: "priya.patient@mavenclinic.dev", providerEmail: "amara.osei@mavenclinic.dev", createdAt: isoAt(subDays(now, 13), 13, 35) },
    { key: "priya-maya", patientEmail: "priya.patient@mavenclinic.dev", providerEmail: "maya.patel@mavenclinic.dev", createdAt: isoAt(subDays(now, 1), 17, 0) },
    { key: "maria-elena", patientEmail: "maria.patient@mavenclinic.dev", providerEmail: "elena.rodriguez@mavenclinic.dev", createdAt: isoAt(subDays(now, 2), 9, 10) },
    { key: "emily-chen", patientEmail: "emily.patient@mavenclinic.dev", providerEmail: "sarah.chen@mavenclinic.dev", createdAt: isoAt(subDays(now, 7), 12, 10) },
  ];

  const conversationIdByKey = new Map<string, string>();
  for (const conversation of conversations) {
    const patientId = userIdByEmail.get(conversation.patientEmail);
    const providerProfileId = providerProfileIdByEmail.get(conversation.providerEmail);
    if (!patientId || !providerProfileId) {
      continue;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({ patient_id: patientId, provider_profile_id: providerProfileId, created_at: conversation.createdAt })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(`Failed seeding conversation ${conversation.key}: ${error?.message ?? "Unknown error"}`);
    }

    conversationIdByKey.set(conversation.key, data.id);
  }
  console.log(`  + Seeded ${conversationIdByKey.size} conversations`);

  const messages: MessageSeed[] = [
    { conversationKey: "sarah-chen", senderEmail: "sarah.patient@mavenclinic.dev", content: "I uploaded my symptom notes before tomorrow's visit.", createdAt: isoAt(subDays(now, 1), 18, 15), readAt: isoAt(subDays(now, 1), 18, 20) },
    { conversationKey: "sarah-chen", senderEmail: "sarah.chen@mavenclinic.dev", content: "I reviewed them. We will go through your cycle pain pattern and next-step options in detail.", createdAt: isoAt(subDays(now, 1), 19, 5) },
    { conversationKey: "sarah-osei", senderEmail: "amara.osei@mavenclinic.dev", content: "Your fertile window looks like it starts in two days based on the timing you shared.", createdAt: isoAt(subMonths(now, 2), 12, 20), readAt: isoAt(subMonths(now, 2), 12, 44) },
    { conversationKey: "priya-osei", senderEmail: "priya.patient@mavenclinic.dev", content: "Thank you. I started the supplement plan this week.", createdAt: isoAt(subDays(now, 9), 8, 30), readAt: isoAt(subDays(now, 9), 8, 42) },
    { conversationKey: "priya-osei", senderEmail: "amara.osei@mavenclinic.dev", content: "Great. Keep tracking ovulation test results for the next cycle.", createdAt: isoAt(subDays(now, 9), 9, 10), readAt: isoAt(subDays(now, 9), 9, 40) },
    { conversationKey: "priya-maya", senderEmail: "maya.patel@mavenclinic.dev", content: "We can use next week's visit to build a steadier anxiety support plan around treatment decisions.", createdAt: isoAt(subDays(now, 1), 17, 10) },
    { conversationKey: "maria-elena", senderEmail: "maria.patient@mavenclinic.dev", content: "Night sweats have been more frequent this month.", createdAt: isoAt(subDays(now, 2), 9, 15), readAt: isoAt(subDays(now, 2), 9, 40) },
    { conversationKey: "maria-elena", senderEmail: "elena.rodriguez@mavenclinic.dev", content: "We will review options for sleep disruption and hormone support at today's visit.", createdAt: isoAt(subDays(now, 1), 16, 30) },
    { conversationKey: "emily-chen", senderEmail: "sarah.chen@mavenclinic.dev", content: "How has your recovery been this week?", createdAt: isoAt(subDays(now, 6), 13, 0), readAt: isoAt(subDays(now, 6), 13, 25) },
    { conversationKey: "emily-chen", senderEmail: "emily.patient@mavenclinic.dev", content: "Much better overall, but I still have some tenderness after longer walks.", createdAt: isoAt(subDays(now, 1), 8, 20) },
  ];

  const messageRows = messages.flatMap((message) => {
    const conversationId = conversationIdByKey.get(message.conversationKey);
    const senderId = userIdByEmail.get(message.senderEmail);
    return conversationId && senderId
      ? [{ conversation_id: conversationId, sender_id: senderId, content: message.content, message_type: "text", created_at: message.createdAt, read_at: message.readAt ?? null }]
      : [];
  });

  if (messageRows.length) {
    const { error } = await supabase.from("messages").insert(messageRows);
    if (error) {
      throw new Error(`Failed seeding messages: ${error.message}`);
    }
  }
  console.log(`  + Seeded ${messageRows.length} messages`);

  const carePlans = [
    {
      patientEmail: "sarah.patient@mavenclinic.dev",
      providerEmail: "sarah.chen@mavenclinic.dev",
      title: "Cycle balance plan",
      description: "Reduce pain spikes, support ovulation timing, and make symptom patterns easier to explain in visits.",
      milestones: [
        { title: "Daily symptom tracking", description: "Log mood, energy, pain, and sleep each day.", targetDate: addDays(now, 3).toISOString(), completed: true, category: "tracking" },
        { title: "Nutrition consistency", description: "Pair protein and fiber at breakfast four days this week.", targetDate: addDays(now, 5).toISOString(), completed: false, category: "nutrition" },
        { title: "Pain management review", description: "Bring your top pain triggers to the next visit.", targetDate: addDays(now, 7).toISOString(), completed: false, category: "care" },
      ],
    },
    {
      patientEmail: "priya.patient@mavenclinic.dev",
      providerEmail: "amara.osei@mavenclinic.dev",
      title: "Fertility readiness plan",
      description: "Clarify the fertile window and remove uncertainty around next-cycle timing.",
      milestones: [
        { title: "Track OPK daily", description: "Use LH strips for the next 10 days.", targetDate: addDays(now, 4).toISOString(), completed: true, category: "tracking" },
        { title: "Partner timing plan", description: "Align conception timing with the projected window.", targetDate: addDays(now, 6).toISOString(), completed: false, category: "planning" },
        { title: "Follow-up consult", description: "Review cycle optimization progress with Dr. Osei.", targetDate: addWeeks(now, 2).toISOString(), completed: false, category: "care" },
      ],
    },
  ];

  const carePlanRows = carePlans.flatMap((plan) => {
    const patientId = userIdByEmail.get(plan.patientEmail);
    const providerId = providerIdByEmail.get(plan.providerEmail);
    return patientId && providerId
      ? [{ patient_id: patientId, provider_id: providerId, title: plan.title, description: plan.description, status: "active", milestones: plan.milestones }]
      : [];
  });

  if (carePlanRows.length) {
    const { error } = await supabase.from("care_plans").insert(carePlanRows);
    if (error) {
      throw new Error(`Failed seeding care plans: ${error.message}`);
    }
  }
  console.log(`  + Seeded ${carePlanRows.length} care plans`);

  const sarahId = userIdByEmail.get("sarah.patient@mavenclinic.dev");
  if (sarahId) {
    const symptomRows = [
      { patient_id: sarahId, logged_at: isoAt(subDays(now, 12), 20, 0), symptoms: { selected: ["Cramps", "Bloating", "Fatigue"] }, mood: 5, energy: 4, pain_level: 7, sleep_hours: 6.0, notes: "Pain flared after a stressful week.", ai_insight: null },
      { patient_id: sarahId, logged_at: isoAt(subDays(now, 9), 20, 0), symptoms: { selected: ["Headache", "Fatigue"] }, mood: 6, energy: 5, pain_level: 4, sleep_hours: 6.5, notes: "Hydration was better and pain eased.", ai_insight: null },
      { patient_id: sarahId, logged_at: isoAt(subDays(now, 6), 20, 0), symptoms: { selected: ["Mood swings", "Anxiety", "Bloating"] }, mood: 4, energy: 5, pain_level: 3, sleep_hours: 5.5, notes: "Mood dipped before the week started.", ai_insight: null },
      { patient_id: sarahId, logged_at: isoAt(subDays(now, 3), 20, 0), symptoms: { selected: ["Cramps", "Fatigue"] }, mood: 6, energy: 6, pain_level: 5, sleep_hours: 7.0, notes: "Less severe than last week.", ai_insight: null },
      { patient_id: sarahId, logged_at: isoAt(subDays(now, 1), 20, 0), symptoms: { selected: ["Cramps", "Bloating", "Headache"] }, mood: 5, energy: 4, pain_level: 6, sleep_hours: 6.0, notes: "Cramping is building again ahead of the visit.", ai_insight: "Your recent logs show recurring pain and energy dips before your cycle. That pattern can be useful to bring into care planning, especially alongside PCOS management. Keep logging timing, hydration, and symptom intensity so your provider can compare trends over the next two cycles." },
    ];

    const cycleRows = [
      { patient_id: sarahId, period_start: subMonths(now, 4).toISOString().slice(0, 10), period_end: subDays(subMonths(now, 4), -4).toISOString().slice(0, 10), cycle_length: 31, flow_intensity: "heavy", symptoms: { selected: ["Cramps", "Fatigue"] }, ovulation_date: subDays(subMonths(now, 4), -16).toISOString().slice(0, 10), fertile_window_start: subDays(subMonths(now, 4), -12).toISOString().slice(0, 10), fertile_window_end: subDays(subMonths(now, 4), -17).toISOString().slice(0, 10), notes: "Longer cycle with heavy first two days." },
      { patient_id: sarahId, period_start: subMonths(now, 3).toISOString().slice(0, 10), period_end: subDays(subMonths(now, 3), -4).toISOString().slice(0, 10), cycle_length: 29, flow_intensity: "medium", symptoms: { selected: ["Cramps", "Bloating"] }, ovulation_date: subDays(subMonths(now, 3), -14).toISOString().slice(0, 10), fertile_window_start: subDays(subMonths(now, 3), -11).toISOString().slice(0, 10), fertile_window_end: subDays(subMonths(now, 3), -16).toISOString().slice(0, 10), notes: "Improved cycle length." },
      { patient_id: sarahId, period_start: subMonths(now, 2).toISOString().slice(0, 10), period_end: subDays(subMonths(now, 2), -4).toISOString().slice(0, 10), cycle_length: 30, flow_intensity: "medium", symptoms: { selected: ["Mood swings", "Cramps"] }, ovulation_date: subDays(subMonths(now, 2), -15).toISOString().slice(0, 10), fertile_window_start: subDays(subMonths(now, 2), -12).toISOString().slice(0, 10), fertile_window_end: subDays(subMonths(now, 2), -17).toISOString().slice(0, 10), notes: "Mood symptoms clustered pre-period." },
      { patient_id: sarahId, period_start: subDays(now, 20).toISOString().slice(0, 10), period_end: subDays(now, 16).toISOString().slice(0, 10), cycle_length: 28, flow_intensity: "light", symptoms: { selected: ["Cramps", "Headache"] }, ovulation_date: subDays(now, 6).toISOString().slice(0, 10), fertile_window_start: subDays(now, 9).toISOString().slice(0, 10), fertile_window_end: subDays(now, 4).toISOString().slice(0, 10), notes: "Most recent cycle with lighter flow." },
    ];

    const fertilityRow = { patient_id: sarahId, date: now.toISOString().slice(0, 10), bbt_temp: 97.9 };

    const [symptomResult, cycleResult, fertilityResult] = await Promise.all([
      supabase.from("symptom_logs").insert(symptomRows),
      supabase.from("cycle_logs").insert(cycleRows),
      supabase.from("fertility_data").insert(fertilityRow),
    ]);

    if (symptomResult.error) {
      throw new Error(`Failed seeding symptom logs: ${symptomResult.error.message}`);
    }

    if (cycleResult.error) {
      throw new Error(`Failed seeding cycle logs: ${cycleResult.error.message}`);
    }

    if (fertilityResult.error) {
      throw new Error(`Failed seeding fertility data: ${fertilityResult.error.message}`);
    }
  }
  console.log("  + Seeded patient health tracking data");
  const notifications: NotificationSeed[] = [
    { recipientEmail: "sarah.patient@mavenclinic.dev", actorEmail: "sarah.chen@mavenclinic.dev", appointmentKey: "sarah-upcoming-obgyn", type: "message_received", title: "Dr. Sarah Chen sent a message", body: "Your provider reviewed your symptom notes before tomorrow's visit.", link: "/messages", createdAt: isoAt(subDays(now, 1), 19, 10) },
    { recipientEmail: "sarah.chen@mavenclinic.dev", actorEmail: "emily.patient@mavenclinic.dev", appointmentKey: "emily-today-obgyn", type: "patient_message", title: "New patient message", body: "Emily Carter sent an unread recovery update.", link: "/provider/messages", createdAt: isoAt(subDays(now, 1), 8, 21) },
    { recipientEmail: "benefits@acme.com", actorEmail: "super.admin@mavenclinic.dev", type: "employer_report_ready", title: "Monthly utilization report ready", body: "Acme Corp utilization and care plan metrics have been refreshed.", link: "/employer/analytics", createdAt: isoAt(subDays(now, 2), 9, 0), readAt: isoAt(subDays(now, 2), 10, 0) },
    { recipientEmail: "clinic.admin@mavenclinic.dev", actorEmail: "sarah.chen@mavenclinic.dev", type: "provider_review", title: "Provider roster updated", body: "Dr. Sarah Chen opened two new same-day slots for this week.", link: "/clinic/dashboard", createdAt: isoAt(subDays(now, 1), 12, 15) },
    { recipientEmail: "clinic.admin@mavenclinic.dev", actorEmail: "amara.osei@mavenclinic.dev", type: "invite_status", title: "Provider invite accepted", body: "An invited fertility specialist completed registration.", link: "/clinic/dashboard", createdAt: isoAt(subDays(now, 4), 11, 0) },
    { recipientEmail: "super.admin@mavenclinic.dev", actorEmail: "clinic.admin@mavenclinic.dev", type: "compliance_review", title: "Weekly clinic operations summary", body: "Conversation volume and provider activity are within expected range.", link: "/super/system", createdAt: isoAt(subDays(now, 3), 8, 30) },
    { recipientEmail: "maria.patient@mavenclinic.dev", actorEmail: "elena.rodriguez@mavenclinic.dev", appointmentKey: "maria-today-menopause", type: "appointment_reminder", title: "Appointment today", body: "Your menopause support visit starts at 3:00 PM.", link: "/appointments", createdAt: isoAt(now, 8, 0) },
    { recipientEmail: "priya.patient@mavenclinic.dev", actorEmail: "maya.patel@mavenclinic.dev", appointmentKey: "priya-upcoming-therapy", type: "visit_preparation", title: "Visit prep note", body: "Bring the top three moments when anxiety felt most disruptive this week.", link: "/messages", createdAt: isoAt(now, 7, 45) },
  ];

  const notificationRows = notifications.flatMap((notification) => {
    const recipientId = userIdByEmail.get(notification.recipientEmail);
    const actorId = notification.actorEmail ? userIdByEmail.get(notification.actorEmail) ?? null : null;
    const appointmentId = notification.appointmentKey ? appointmentIdByKey.get(notification.appointmentKey) ?? null : null;
    return recipientId
      ? [{ recipient_id: recipientId, actor_id: actorId, appointment_id: appointmentId, type: notification.type, title: notification.title, body: notification.body, link: notification.link, created_at: notification.createdAt, read_at: notification.readAt ?? null }]
      : [];
  });

  if (notificationRows.length) {
    const { error } = await supabase.from("notifications").insert(notificationRows);
    if (error) {
      throw new Error(`Failed seeding notifications: ${error.message}`);
    }
  }
  console.log(`  + Seeded ${notificationRows.length} notifications`);

  const invitations: InvitationSeed[] = [
    { email: "nina.thompson@mavenclinic.dev", role: "provider", accepted: false, expiresAt: addDays(now, 5).toISOString(), createdAt: subDays(now, 2).toISOString(), token: "demo-provider-pending-token" },
    { email: "rachel.kim@mavenclinic.dev", role: "provider", accepted: true, expiresAt: addDays(now, 2).toISOString(), createdAt: subDays(now, 6).toISOString(), token: "demo-provider-accepted-token" },
    { email: "olivia.green@mavenclinic.dev", role: "provider", accepted: false, expiresAt: subDays(now, 1).toISOString(), createdAt: subDays(now, 10).toISOString(), token: "demo-provider-expired-token" },
  ];

  const { error: invitationError } = await supabase.from("invitations").insert(
    invitations.map((invitation) => ({
      email: invitation.email,
      role: invitation.role,
      accepted: invitation.accepted,
      expires_at: invitation.expiresAt,
      created_at: invitation.createdAt,
      token: invitation.token,
    })),
  );

  if (invitationError) {
    throw new Error(`Failed seeding invitations: ${invitationError.message}`);
  }
  console.log(`  + Seeded ${invitations.length} invitations`);
}

function printCredentials() {
  console.log("\nDemo credentials by role:");
  for (const user of allSeedUsers) {
    console.log(`  [${user.role}] ${user.email} / ${user.password}`);
  }
}

async function main() {
  console.log("Seeding Maven Clinic database...");
  const employerId = await seedEmployer();
  const users = await ensureAuthUsers(allSeedUsers);
  await seedProfiles(users, employerId);
  const providerIdByEmail = await seedProviderRows(users);

  const patientIds = users.filter((user) => user.role === "patient").map((user) => user.id);
  const demoUserIds = users.map((user) => user.id);
  const providerIds = Array.from(providerIdByEmail.values());
  const invitationEmails = ["nina.thompson@mavenclinic.dev", "rachel.kim@mavenclinic.dev", "olivia.green@mavenclinic.dev"];

  await clearDemoWorkspace(patientIds, demoUserIds, providerIds, invitationEmails);
  await seedProviderAvailability(providerIdByEmail);
  await seedDemoDataset(users, providerIdByEmail);

  console.log("\nSeed complete.");
  printCredentials();
}

main().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
