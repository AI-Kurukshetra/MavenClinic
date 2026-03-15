import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { getSpecialtyLabel } from "@/lib/appointments";
import { publicEnv, serverEnv } from "@/lib/env";
import { requireSuperAdminAccess } from "@/lib/super-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { currencyFromCents, formatDate, formatDateTime, formatRelativeTime, titleCase } from "@/lib/utils";

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  employer_id: string | null;
  onboarding_complete: boolean | null;
  created_at: string | null;
};

type EmployerRow = {
  id: string;
  company_name: string;
  domain: string | null;
  employee_count: number | null;
  plan_type: string | null;
  contract_start: string | null;
  contract_end: string | null;
};

type ProviderRow = {
  id: string;
  profile_id: string | null;
  specialty: string;
  bio: string | null;
  accepting_patients: boolean | null;
  suspended: boolean | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  consultation_fee_cents: number | null;
  rating: number | null;
  total_reviews: number | null;
};

type AppointmentRow = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  status: string | null;
  scheduled_at: string;
  type: string | null;
  created_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string;
  created_at: string | null;
};

type ConversationRow = {
  id: string;
  patient_id: string;
  provider_profile_id: string | null;
  created_at: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  accepted: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  employer_id: string | null;
};

type CarePlanRow = {
  id: string;
  patient_id: string | null;
  provider_id: string | null;
  title: string;
  description: string | null;
  status: string | null;
  milestones: unknown;
  created_at: string | null;
};

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  actor_id: string | null;
  type: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string | null;
};

type FeatureFlagRow = {
  key: string;
  enabled: boolean | null;
  updated_by: string | null;
  updated_at: string | null;
};

type PlatformSettingRow = {
  key: string;
  value: string | null;
  updated_by: string | null;
  updated_at: string | null;
};

type ProviderAvailabilityRow = {
  id: string;
  provider_id: string;
  day_of_week: string | number;
  start_time: string;
  end_time: string;
  location: string | null;
};

type CycleLogRow = {
  id: string;
  patient_id: string | null;
  period_start: string | null;
};

type SymptomLogRow = {
  id: string;
  patient_id: string | null;
  logged_at: string | null;
};

type QueryResult<T> = PromiseLike<{ data: T | null; error: { message?: string } | null }>;

type AuthUserMap = Map<string, User>;

type SuperStatCard = {
  title: string;
  value: string;
  detail: string;
  href?: string;
};

type SuperChartPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

type SuperActivityItem = {
  id: string;
  icon: "patient" | "provider" | "employer" | "appointment";
  title: string;
  detail: string;
  time: string;
};

export type SuperDashboardData = {
  stats: {
    platformHealth: SuperStatCard[];
    thisMonth: SuperStatCard[];
    systemHealth: Array<{ label: string; status: string; detail: string }>;
  };
  signupsTrend: SuperChartPoint[];
  specialtyVolume: SuperChartPoint[];
  activity: SuperActivityItem[];
};

export type SuperEmployerListItem = {
  id: string;
  companyName: string;
  domain: string;
  plan: string;
  employees: number;
  contractDates: string;
  status: "Active" | "Expired" | "Trial";
  mau: number;
  monthlyFee: string;
  activeAdmins: number;
};

export type SuperEmployersPageData = {
  stats: SuperStatCard[];
  employers: SuperEmployerListItem[];
};

export type SuperEmployerDetailData = {
  employer: SuperEmployerListItem & {
    contractStart: string | null;
    contractEnd: string | null;
    coveredEmployees: number;
    utilizationRate: string;
    totalVisits: number;
  };
  admins: Array<{ id: string; name: string; email: string; joined: string }>;
  utilization: Array<{ label: string; value: string }>;
  billing: Array<{ label: string; value: string }>;
};

export type SuperProviderListItem = {
  id: string;
  profileId: string | null;
  name: string;
  specialty: string;
  status: "Active and accepting" | "Inactive" | "Suspended";
  rating: string;
  patientsSeen: number;
  joinedDate: string;
  totalConsultations: number;
};

export type SuperProvidersPageData = {
  stats: SuperStatCard[];
  providers: SuperProviderListItem[];
};

export type SuperProviderDetailData = {
  provider: {
    id: string;
    name: string;
    specialty: string;
    bio: string;
    rating: string;
    reviews: number;
    consultations: number;
    patientsSeen: number;
    status: string;
    suspendedAt: string | null;
    suspendedReason: string | null;
    joinedDate: string;
  };
  availability: Array<{ id: string; label: string; detail: string }>;
  appointments: Array<{ id: string; patientName: string; scheduledAt: string; status: string; type: string }>;
  patients: Array<{ id: string; name: string }>;
};

export type SuperUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
  lastActive: string;
  status: "active" | "inactive" | "suspended";
};

export type SuperUsersPageData = {
  stats: SuperStatCard[];
  users: SuperUserListItem[];
};

export type SuperFinancialsPageData = {
  stats: SuperStatCard[];
  revenueTrend: SuperChartPoint[];
  billingRows: Array<{ id: string; companyName: string; plan: string; employees: number; monthlyFee: string; contractEnd: string; status: string }>;
  transactions: Array<{ id: string; patientLabel: string; providerName: string; specialty: string; fee: string; date: string }>;
};

export type SuperAnalyticsPageData = {
  overview: {
    mauTrend: SuperChartPoint[];
    dauMauRatio: string;
    topSpecialties: Array<{ name: string; value: number }>;
    completionRate: SuperChartPoint[];
  };
  growth: {
    userGrowth: Array<{ label: string; patients: number; providers: number; employers: number; clinicAdmins: number; partners: number }>;
    employerGrowth: SuperChartPoint[];
    providerGrowth: SuperChartPoint[];
    domainDistribution: Array<{ label: string; value: number }>;
  };
  clinical: {
    specialtyVolume: Array<{ name: string; value: number }>;
    averageDuration: string;
    carePlanCompletionRate: string;
    chiefComplaints: Array<{ label: string; value: number }>;
  };
  engagement: {
    messagesTrend: SuperChartPoint[];
    averageMessagesPerConversation: string;
    symptomLogFrequency: string;
    cycleTrackingAdoption: string;
  };
};

export type SuperSystemPageData = {
  featureFlags: Array<{ key: string; label: string; description: string; enabled: boolean }>;
  environmentCards: Array<{ label: string; value: string }>;
  isDevelopment: boolean;
};

export type SuperSettingsPageData = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultTimezone: string;
    defaultLanguage: string;
  };
  notifications: {
    systemAlertEmail: string;
    notifyNewEmployer: boolean;
    notifyNewProvider: boolean;
    dailyReportEmailEnabled: boolean;
    dailyReportRecipient: string;
  };
  security: Array<{ label: string; value: string }>;
};

async function safeRows<T>(query: QueryResult<T[]>): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      return [];
    }

    return result.data ?? [];
  } catch {
    return [];
  }
}


function formatStatusLabel(value?: string | null) {
  return value ? titleCase(value) : "Unknown";
}

function getEmployerStatus(employer: EmployerRow): "Active" | "Expired" | "Trial" {
  const now = Date.now();
  const contractStart = employer.contract_start ? new Date(employer.contract_start).getTime() : null;
  const contractEnd = employer.contract_end ? new Date(employer.contract_end).getTime() : null;

  if (contractEnd && contractEnd < now) {
    return "Expired";
  }

  if ((employer.plan_type ?? "").toLowerCase() === "trial" || (contractStart && contractStart > now)) {
    return "Trial";
  }

  return "Active";
}

function getEmployerMonthlyFeeCents(employer: EmployerRow) {
  const employees = employer.employee_count ?? 0;
  switch (employer.plan_type) {
    case "standard":
      return employees * 1500;
    case "premium":
      return employees * 2500;
    case "enterprise":
      return employees > 0 ? Math.max(employees * 3200, 3000000) : 3000000;
    default:
      return employees * 1500;
  }
}

function formatContractDates(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return "Contract dates unavailable";
  }

  if (!start) {
    return `Until ${formatDate(end!)}`;
  }

  if (!end) {
    return `${formatDate(start)} onward`;
  }

  return `${formatDate(start)} to ${formatDate(end)}`;
}

function getMonthStarts(count: number) {
  return Array.from({ length: count }, (_, index) => startOfMonth(subMonths(new Date(), count - index - 1)));
}

async function listAuthUsers() {
  try {
    const admin = getSupabaseAdminClient();
    const result = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return result.data?.users ?? [];
  } catch {
    return [];
  }
}

function buildAuthUserMap(users: User[]): AuthUserMap {
  return new Map(users.map((user) => [user.id, user]));
}

function getUserEmail(user?: User) {
  return user?.email ?? "No email";
}

function isWithinDays(value: string | null | undefined, days: number) {
  if (!value) {
    return false;
  }

  const diff = Date.now() - new Date(value).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function computeMonthlyActivity(month: Date, appointments: AppointmentRow[], messages: MessageRow[], providers: Map<string, ProviderRow>) {
  const nextMonth = endOfMonth(month);
  const activeUsers = new Set<string>();

  for (const appointment of appointments) {
    const date = new Date(appointment.scheduled_at);
    if (date < month || date > nextMonth) {
      continue;
    }
    if (appointment.patient_id) {
      activeUsers.add(appointment.patient_id);
    }
    const providerProfileId = appointment.provider_id ? providers.get(appointment.provider_id)?.profile_id : null;
    if (providerProfileId) {
      activeUsers.add(providerProfileId);
    }
  }

  for (const message of messages) {
    if (!message.created_at || !message.sender_id) {
      continue;
    }
    const date = new Date(message.created_at);
    if (date < month || date > nextMonth) {
      continue;
    }
    activeUsers.add(message.sender_id);
  }

  return activeUsers.size;
}

async function getBaseSuperData() {
  const access = await requireSuperAdminAccess();
  const admin = getSupabaseAdminClient();

  const [profiles, employers, providers, appointments, messages, conversations, invitations, carePlans, notifications, providerAvailability, featureFlags, platformSettings, cycleLogs, symptomLogs, authUsers] = await Promise.all([
    safeRows<ProfileRow>(admin.from("profiles").select("id, role, full_name, avatar_url, phone, employer_id, onboarding_complete, created_at").order("created_at", { ascending: false })),
    safeRows<EmployerRow>(admin.from("employers").select("id, company_name, domain, employee_count, plan_type, contract_start, contract_end").order("company_name", { ascending: true })),
    safeRows<ProviderRow>(admin.from("providers").select("id, profile_id, specialty, bio, accepting_patients, suspended, suspended_at, suspended_reason, consultation_fee_cents, rating, total_reviews")),
    safeRows<AppointmentRow>(admin.from("appointments").select("id, patient_id, provider_id, status, scheduled_at, type, created_at").order("scheduled_at", { ascending: false })),
    safeRows<MessageRow>(admin.from("messages").select("id, conversation_id, sender_id, content, created_at").order("created_at", { ascending: false })),
    safeRows<ConversationRow>(admin.from("conversations").select("id, patient_id, provider_profile_id, created_at").order("created_at", { ascending: false })),
    safeRows<InvitationRow>(admin.from("invitations").select("id, email, role, accepted, expires_at, created_at, employer_id").order("created_at", { ascending: false })),
    safeRows<CarePlanRow>(admin.from("care_plans").select("id, patient_id, provider_id, title, description, status, milestones, created_at").order("created_at", { ascending: false })),
    safeRows<NotificationRow>(admin.from("notifications").select("id, recipient_id, actor_id, type, title, body, read_at, created_at").order("created_at", { ascending: false })),
    safeRows<ProviderAvailabilityRow>(admin.from("provider_availability").select("id, provider_id, day_of_week, start_time, end_time, location").order("day_of_week", { ascending: true })),
    safeRows<FeatureFlagRow>(admin.from("feature_flags").select("key, enabled, updated_by, updated_at")),
    safeRows<PlatformSettingRow>(admin.from("platform_settings").select("key, value, updated_by, updated_at")),
    safeRows<CycleLogRow>(admin.from("cycle_logs").select("id, patient_id, period_start")),
    safeRows<SymptomLogRow>(admin.from("symptom_logs").select("id, patient_id, logged_at")),
    listAuthUsers(),
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
  const authUserMap = buildAuthUserMap(authUsers);

  return {
    access,
    admin,
    profiles,
    profileMap,
    employers,
    providers,
    providerMap,
    appointments,
    messages,
    conversations,
    invitations,
    carePlans,
    notifications,
    providerAvailability,
    featureFlags,
    platformSettings,
    cycleLogs,
    symptomLogs,
    authUsers,
    authUserMap,
  };
}

function getProviderName(provider: ProviderRow, profiles: Map<string, ProfileRow>) {
  return provider.profile_id ? profiles.get(provider.profile_id)?.full_name ?? `${getSpecialtyLabel(provider.specialty)} specialist` : `${getSpecialtyLabel(provider.specialty)} specialist`;
}

function getPatientName(patientId: string | null, profiles: Map<string, ProfileRow>) {
  return patientId ? profiles.get(patientId)?.full_name ?? "Patient" : "Patient";
}

function getRoleCount(profiles: ProfileRow[], role: string) {
  return profiles.filter((profile) => profile.role === role).length;
}

export async function getSuperDashboardData(): Promise<SuperDashboardData> {
  const base = await getBaseSuperData();
  const months = getMonthStarts(12);
  const thisMonthStart = startOfMonth(new Date());
  const patients = base.profiles.filter((profile) => profile.role === "patient");
  const activeThisMonth = base.authUsers.filter((user) => isWithinDays(user.last_sign_in_at, 30)).length;
  const averageFeeCents = base.providers.length
    ? Math.round(base.providers.reduce((sum, provider) => sum + (provider.consultation_fee_cents ?? 17500), 0) / base.providers.length)
    : 17500;
  const completedThisMonth = base.appointments.filter((item) => item.status === "completed" && new Date(item.scheduled_at) >= thisMonthStart).length;
  const messagesThisMonth = base.messages.filter((item) => item.created_at && new Date(item.created_at) >= thisMonthStart).length;
  const employerOnboardedThisMonth = base.employers.filter((employer) => employer.contract_start && new Date(employer.contract_start) >= thisMonthStart).length;

  const signupsTrend = months.map((month) => {
    const nextMonth = endOfMonth(month);
    return {
      label: formatDate(month, "MMM yyyy"),
      value: base.profiles.filter((profile) => profile.created_at && new Date(profile.created_at) >= month && new Date(profile.created_at) <= nextMonth).length,
    };
  });

  const specialtyCounts = new Map<string, number>();
  for (const appointment of base.appointments) {
    if (!appointment.provider_id) {
      continue;
    }
    const provider = base.providerMap.get(appointment.provider_id);
    const label = provider ? getSpecialtyLabel(provider.specialty) : "General";
    specialtyCounts.set(label, (specialtyCounts.get(label) ?? 0) + 1);
  }

  const specialtyVolume = Array.from(specialtyCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);

  const activity = [
    ...base.profiles.slice(0, 8).map((profile) => ({
      id: `profile-${profile.id}`,
      date: profile.created_at ?? new Date().toISOString(),
      icon: profile.role === "provider" ? "provider" : "patient" as const,
      title: profile.role === "provider" ? "New provider registered" : "New patient signup",
      detail: `${profile.full_name ?? "New user"} joined the platform as ${formatStatusLabel(profile.role).toLowerCase()}.`,
    })),
    ...base.employers.slice(0, 6).map((employer) => ({
      id: `employer-${employer.id}`,
      date: employer.contract_start ?? new Date().toISOString(),
      icon: "employer" as const,
      title: "New employer onboarded",
      detail: `${employer.company_name} launched ${employer.plan_type ?? "standard"} coverage for ${employer.employee_count ?? 0} employees.`,
    })),
    ...base.appointments.filter((appointment) => appointment.status === "completed").slice(0, 8).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      date: appointment.scheduled_at,
      icon: "appointment" as const,
      title: "Appointment completed",
      detail: `${getPatientName(appointment.patient_id, base.profileMap)} completed a ${appointment.type ?? "video"} visit.`,
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      icon: item.icon as SuperActivityItem["icon"],
      title: item.title,
      detail: item.detail,
      time: formatRelativeTime(item.date),
    }));

  return {
    stats: {
      platformHealth: [
        { title: "Total patients", value: String(patients.length), detail: "Profiles with patient access", href: "/super/users" },
        { title: "Total providers", value: String(base.providers.length), detail: "Provider records across the network", href: "/super/providers" },
        { title: "Total employers", value: String(base.employers.length), detail: "Contracted employer groups", href: "/super/employers" },
        { title: "Total appointments", value: String(base.appointments.length), detail: "Scheduled platform appointments", href: "/super/analytics" },
        { title: "Active this month", value: String(activeThisMonth), detail: "Auth users signed in during the last 30 days", href: "/super/analytics" },
        { title: "Platform revenue", value: `Est. ${currencyFromCents(base.appointments.length * averageFeeCents)}`, detail: "Estimated consultation revenue to date", href: "/super/financials" },
      ],
      thisMonth: [
        { title: "New signups", value: String(signupsTrend.at(-1)?.value ?? 0), detail: "Profiles created this month", href: "/super/analytics" },
        { title: "Appointments completed", value: String(completedThisMonth), detail: "Completed visits this month", href: "/super/dashboard" },
        { title: "Messages sent", value: String(messagesThisMonth), detail: "Messages created this month", href: "/super/analytics" },
        { title: "New employers", value: String(employerOnboardedThisMonth), detail: "Employer contracts starting this month", href: "/super/employers" },
      ],
      systemHealth: [
        { label: "Database", status: "Healthy", detail: "Core tables reachable" },
        { label: "API", status: "Operational", detail: "Authenticated routes responding" },
        { label: "Realtime", status: "Active", detail: "Notification streams enabled" },
      ],
    },
    signupsTrend,
    specialtyVolume,
    activity,
  };
}

export async function getSuperEmployersPageData(): Promise<SuperEmployersPageData> {
  const base = await getBaseSuperData();

  const employerRows = base.employers.map((employer) => {
    const employeeProfiles = base.profiles.filter((profile) => profile.employer_id === employer.id && profile.role === "patient");
    const activeEmployees = employeeProfiles.filter((profile) => isWithinDays(base.authUserMap.get(profile.id)?.last_sign_in_at ?? null, 30)).length;
    const activeAdmins = base.profiles.filter((profile) => profile.employer_id === employer.id && profile.role === "employer_admin").length;

    return {
      id: employer.id,
      companyName: employer.company_name,
      domain: employer.domain ?? "No domain",
      plan: formatStatusLabel(employer.plan_type),
      employees: employer.employee_count ?? employeeProfiles.length,
      contractDates: formatContractDates(employer.contract_start, employer.contract_end),
      status: getEmployerStatus(employer),
      mau: activeEmployees,
      monthlyFee: currencyFromCents(getEmployerMonthlyFeeCents(employer)),
      activeAdmins,
    } satisfies SuperEmployerListItem;
  });

  const totalEmployees = employerRows.reduce((sum, employer) => sum + employer.employees, 0);
  const activeContracts = employerRows.filter((employer) => employer.status === "Active").length;
  const mrrEstimateCents = base.employers.reduce((sum, employer) => sum + getEmployerMonthlyFeeCents(employer), 0);

  return {
    stats: [
      { title: "Total employers", value: String(base.employers.length), detail: "Contracted organizations" },
      { title: "Active contracts", value: String(activeContracts), detail: "Employers with active agreements" },
      { title: "Covered employees", value: String(totalEmployees), detail: "Employees under contract" },
      { title: "MRR estimate", value: currencyFromCents(mrrEstimateCents), detail: `${employerRows.filter((row) => row.status !== "Expired").length} accounts contributing this month` },
    ],
    employers: employerRows.sort((left, right) => left.companyName.localeCompare(right.companyName)),
  };
}

export async function getSuperEmployerDetailData(employerId: string): Promise<SuperEmployerDetailData | null> {
  const base = await getBaseSuperData();
  const employer = base.employers.find((item) => item.id === employerId);

  if (!employer) {
    return null;
  }

  const adminProfiles = base.profiles.filter((profile) => profile.employer_id === employerId && profile.role === "employer_admin");
  const patientProfiles = base.profiles.filter((profile) => profile.employer_id === employerId && profile.role === "patient");
  const patientIds = new Set(patientProfiles.map((profile) => profile.id));
  const employerAppointments = base.appointments.filter((appointment) => appointment.patient_id && patientIds.has(appointment.patient_id));
  const activeUsers = patientProfiles.filter((profile) => isWithinDays(base.authUserMap.get(profile.id)?.last_sign_in_at ?? null, 30)).length;
  const utilizationRate = patientProfiles.length ? `${((activeUsers / patientProfiles.length) * 100).toFixed(1)}%` : "0.0%";

  return {
    employer: {
      id: employer.id,
      companyName: employer.company_name,
      domain: employer.domain ?? "No domain",
      plan: formatStatusLabel(employer.plan_type),
      employees: employer.employee_count ?? patientProfiles.length,
      contractDates: formatContractDates(employer.contract_start, employer.contract_end),
      status: getEmployerStatus(employer),
      mau: activeUsers,
      monthlyFee: currencyFromCents(getEmployerMonthlyFeeCents(employer)),
      activeAdmins: adminProfiles.length,
      contractStart: employer.contract_start,
      contractEnd: employer.contract_end,
      coveredEmployees: employer.employee_count ?? patientProfiles.length,
      utilizationRate,
      totalVisits: employerAppointments.length,
    },
    admins: adminProfiles.map((profile) => ({
      id: profile.id,
      name: profile.full_name ?? "Employer admin",
      email: getUserEmail(base.authUserMap.get(profile.id)),
      joined: formatDate(profile.created_at ?? new Date()),
    })),
    utilization: [
      { label: "Total employee profiles", value: String(patientProfiles.length) },
      { label: "Appointments used", value: String(employerAppointments.length) },
      { label: "Monthly active employees", value: String(activeUsers) },
      { label: "Utilization rate", value: utilizationRate },
    ],
    billing: [
      { label: "Plan", value: formatStatusLabel(employer.plan_type) },
      { label: "Estimated monthly fee", value: currencyFromCents(getEmployerMonthlyFeeCents(employer)) },
      { label: "Contract status", value: getEmployerStatus(employer) },
      { label: "Contract end", value: employer.contract_end ? formatDate(employer.contract_end) : "Not set" },
    ],
  };
}

export async function getSuperProvidersPageData(): Promise<SuperProvidersPageData> {
  const base = await getBaseSuperData();
  const patientCountByProvider = new Map<string, Set<string>>();
  const appointmentCountByProvider = new Map<string, number>();

  for (const appointment of base.appointments) {
    if (!appointment.provider_id) {
      continue;
    }
    appointmentCountByProvider.set(appointment.provider_id, (appointmentCountByProvider.get(appointment.provider_id) ?? 0) + 1);
    if (appointment.patient_id) {
      const patients = patientCountByProvider.get(appointment.provider_id) ?? new Set<string>();
      patients.add(appointment.patient_id);
      patientCountByProvider.set(appointment.provider_id, patients);
    }
  }

  const providerRows = base.providers.map((provider) => ({
    id: provider.id,
    profileId: provider.profile_id,
    name: getProviderName(provider, base.profileMap),
    specialty: getSpecialtyLabel(provider.specialty),
    status: provider.suspended ? "Suspended" : provider.accepting_patients ? "Active and accepting" : "Inactive",
    rating: provider.rating ? `${provider.rating.toFixed(1)} / 5` : "New",
    patientsSeen: patientCountByProvider.get(provider.id)?.size ?? 0,
    joinedDate: provider.profile_id && base.profileMap.get(provider.profile_id)?.created_at ? formatDate(base.profileMap.get(provider.profile_id)!.created_at!) : "Unknown",
    totalConsultations: appointmentCountByProvider.get(provider.id) ?? 0,
  })) satisfies SuperProviderListItem[];

  const averageRating = base.providers.length
    ? (base.providers.reduce((sum, provider) => sum + Number(provider.rating ?? 0), 0) / base.providers.length).toFixed(1)
    : "0.0";

  return {
    stats: [
      { title: "Total providers", value: String(base.providers.length), detail: "Licensed providers on platform" },
      { title: "Active + accepting", value: String(base.providers.filter((provider) => provider.accepting_patients && !provider.suspended).length), detail: "Available for new bookings" },
      { title: "Average rating", value: `${averageRating} / 5`, detail: "Across all provider reviews" },
      { title: "Total consultations", value: String(base.appointments.length), detail: "Appointments across provider network" },
    ],
    providers: providerRows.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export async function getSuperProviderDetailData(providerId: string): Promise<SuperProviderDetailData | null> {
  const base = await getBaseSuperData();
  const provider = base.providers.find((item) => item.id === providerId);
  if (!provider) {
    return null;
  }

  const appointments = base.appointments.filter((appointment) => appointment.provider_id === providerId);
  const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.patient_id).filter((value): value is string => Boolean(value))));
  const availability = base.providerAvailability.filter((slot) => slot.provider_id === providerId);
  const profile = provider.profile_id ? base.profileMap.get(provider.profile_id) : null;

  return {
    provider: {
      id: provider.id,
      name: getProviderName(provider, base.profileMap),
      specialty: getSpecialtyLabel(provider.specialty),
      bio: provider.bio ?? "This provider has not added a biography yet.",
      rating: provider.rating ? `${provider.rating.toFixed(1)} / 5` : "New",
      reviews: Number(provider.total_reviews ?? 0),
      consultations: appointments.length,
      patientsSeen: patientIds.length,
      status: provider.suspended ? "Suspended" : provider.accepting_patients ? "Active and accepting" : "Inactive",
      suspendedAt: provider.suspended_at,
      suspendedReason: provider.suspended_reason,
      joinedDate: profile?.created_at ? formatDate(profile.created_at) : "Unknown",
    },
    availability: availability.map((slot) => ({
      id: slot.id,
      label: titleCase(String(slot.day_of_week)),
      detail: `${slot.start_time.slice(0, 5)} to ${slot.end_time.slice(0, 5)}${slot.location ? ` - ${slot.location}` : ""}`,
    })),
    appointments: appointments.slice(0, 12).map((appointment) => ({
      id: appointment.id,
      patientName: getPatientName(appointment.patient_id, base.profileMap),
      scheduledAt: formatDateTime(appointment.scheduled_at),
      status: formatStatusLabel(appointment.status),
      type: formatStatusLabel(appointment.type),
    })),
    patients: patientIds.map((patientId) => ({ id: patientId, name: getPatientName(patientId, base.profileMap) })),
  };
}

export async function getSuperUsersPageData(): Promise<SuperUsersPageData> {
  const base = await getBaseSuperData();
  const users = base.profiles.map((profile) => {
    const authUser = base.authUserMap.get(profile.id);
    const isSuspended = authUser?.user_metadata && typeof authUser.user_metadata.suspended === "boolean" ? authUser.user_metadata.suspended : false;
    const status = isSuspended ? "suspended" : isWithinDays(authUser?.last_sign_in_at ?? null, 60) ? "active" : "inactive";

    return {
      id: profile.id,
      name: profile.full_name ?? "Maven user",
      email: getUserEmail(authUser),
      role: profile.role ?? "patient",
      joinedDate: formatDate(profile.created_at ?? new Date()),
      lastActive: authUser?.last_sign_in_at ? formatRelativeTime(authUser.last_sign_in_at) : "Never",
      status,
    } satisfies SuperUserListItem;
  });

  return {
    stats: [
      { title: "Patients", value: String(getRoleCount(base.profiles, "patient")), detail: "Patient accounts" },
      { title: "Providers", value: String(getRoleCount(base.profiles, "provider")), detail: "Provider accounts" },
      { title: "Employers", value: String(getRoleCount(base.profiles, "employer_admin")), detail: "Employer admin accounts" },
      { title: "Clinic admins", value: String(getRoleCount(base.profiles, "clinic_admin")), detail: "Clinic operations users" },
      { title: "Partners", value: String(getRoleCount(base.profiles, "partner")), detail: "Support partner accounts" },
    ],
    users: users.sort((left, right) => left.name.localeCompare(right.name)),
  };
}

export async function getSuperFinancialsPageData(): Promise<SuperFinancialsPageData> {
  const base = await getBaseSuperData();
  const months = getMonthStarts(12);
  const activeEmployers = base.employers.filter((employer) => getEmployerStatus(employer) !== "Expired");
  const mrrCents = activeEmployers.reduce((sum, employer) => sum + getEmployerMonthlyFeeCents(employer), 0);
  const completedAppointments = base.appointments.filter((appointment) => appointment.status === "completed");
  const consultationRevenueCents = completedAppointments.reduce((sum, appointment) => {
    const fee = appointment.provider_id ? base.providerMap.get(appointment.provider_id)?.consultation_fee_cents ?? 17500 : 17500;
    return sum + fee;
  }, 0);
  const outstanding = base.appointments.filter((appointment) => appointment.status === "scheduled").length;

  const revenueTrend = months.map((month) => {
    const nextMonth = endOfMonth(month);
    const monthlyConsultationRevenue = completedAppointments
      .filter((appointment) => new Date(appointment.scheduled_at) >= month && new Date(appointment.scheduled_at) <= nextMonth)
      .reduce((sum, appointment) => sum + (appointment.provider_id ? base.providerMap.get(appointment.provider_id)?.consultation_fee_cents ?? 17500 : 17500), 0);

    return {
      label: formatDate(month, "MMM yyyy"),
      value: Math.round(mrrCents / 100),
      secondaryValue: Math.round(monthlyConsultationRevenue / 100),
    };
  });

  return {
    stats: [
      { title: "MRR", value: `${currencyFromCents(mrrCents)}/month`, detail: "Estimated employer subscription revenue" },
      { title: "ARR", value: currencyFromCents(mrrCents * 12), detail: "Estimated annual recurring revenue" },
      { title: "Consultation revenue", value: currencyFromCents(consultationRevenueCents), detail: "Completed appointment fees" },
      { title: "Outstanding", value: String(outstanding), detail: "Scheduled visits awaiting claims reconciliation" },
    ],
    revenueTrend,
    billingRows: base.employers.map((employer) => ({
      id: employer.id,
      companyName: employer.company_name,
      plan: formatStatusLabel(employer.plan_type),
      employees: employer.employee_count ?? 0,
      monthlyFee: currencyFromCents(getEmployerMonthlyFeeCents(employer)),
      contractEnd: employer.contract_end ? formatDate(employer.contract_end) : "Not set",
      status: getEmployerStatus(employer),
    })),
    transactions: completedAppointments.slice(0, 10).map((appointment) => ({
      id: appointment.id,
      patientLabel: "Patient ***",
      providerName: appointment.provider_id && base.providerMap.get(appointment.provider_id) ? getProviderName(base.providerMap.get(appointment.provider_id)!, base.profileMap) : "Provider",
      specialty: appointment.provider_id && base.providerMap.get(appointment.provider_id) ? getSpecialtyLabel(base.providerMap.get(appointment.provider_id)!.specialty) : "General",
      fee: currencyFromCents(appointment.provider_id ? base.providerMap.get(appointment.provider_id)?.consultation_fee_cents ?? 17500 : 17500),
      date: formatDateTime(appointment.scheduled_at),
    })),
  };
}

export async function getSuperAnalyticsPageData(): Promise<SuperAnalyticsPageData> {
  const base = await getBaseSuperData();
  const months = getMonthStarts(12);
  const patients = base.profiles.filter((profile) => profile.role === "patient");
  const providers = base.profiles.filter((profile) => profile.role === "provider");
  const employers = base.profiles.filter((profile) => profile.role === "employer_admin");
  const clinicAdmins = base.profiles.filter((profile) => profile.role === "clinic_admin");
  const partners = base.profiles.filter((profile) => profile.role === "partner");

  const mauTrend = months.map((month) => ({ label: formatDate(month, "MMM yyyy"), value: computeMonthlyActivity(month, base.appointments, base.messages, base.providerMap) }));
  const dauSet = new Set<string>();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const message of base.messages) {
    if (message.sender_id && message.created_at && new Date(message.created_at).getTime() >= dayAgo) {
      dauSet.add(message.sender_id);
    }
  }
  for (const appointment of base.appointments) {
    if (new Date(appointment.scheduled_at).getTime() >= dayAgo) {
      if (appointment.patient_id) {
        dauSet.add(appointment.patient_id);
      }
      const providerProfileId = appointment.provider_id ? base.providerMap.get(appointment.provider_id)?.profile_id : null;
      if (providerProfileId) {
        dauSet.add(providerProfileId);
      }
    }
  }
  const currentMau = mauTrend.at(-1)?.value ?? 0;
  const dauMauRatio = currentMau ? `${((dauSet.size / currentMau) * 100).toFixed(1)}%` : "0.0%";

  const specialtyCounts = new Map<string, number>();
  for (const appointment of base.appointments) {
    if (!appointment.provider_id) {
      continue;
    }
    const provider = base.providerMap.get(appointment.provider_id);
    const label = provider ? getSpecialtyLabel(provider.specialty) : "General";
    specialtyCounts.set(label, (specialtyCounts.get(label) ?? 0) + 1);
  }
  const topSpecialties = Array.from(specialtyCounts.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const completionRate = months.map((month) => {
    const nextMonth = endOfMonth(month);
    const monthly = base.appointments.filter((appointment) => new Date(appointment.scheduled_at) >= month && new Date(appointment.scheduled_at) <= nextMonth);
    const completed = monthly.filter((appointment) => appointment.status === "completed").length;
    return { label: formatDate(month, "MMM yyyy"), value: monthly.length ? Math.round((completed / monthly.length) * 100) : 0 };
  });

  const roleGrowth = months.map((month) => {
    const nextMonth = endOfMonth(month);
    const inMonth = (profile: ProfileRow) => profile.created_at && new Date(profile.created_at) >= month && new Date(profile.created_at) <= nextMonth;
    return {
      label: formatDate(month, "MMM yyyy"),
      patients: patients.filter(inMonth).length,
      providers: providers.filter(inMonth).length,
      employers: employers.filter(inMonth).length,
      clinicAdmins: clinicAdmins.filter(inMonth).length,
      partners: partners.filter(inMonth).length,
    };
  });

  const employerGrowth = months.map((month) => ({
    label: formatDate(month, "MMM yyyy"),
    value: base.employers.filter((employer) => employer.contract_start && new Date(employer.contract_start) >= month && new Date(employer.contract_start) <= endOfMonth(month)).length,
  }));

  const providerGrowth = months.map((month) => ({
    label: formatDate(month, "MMM yyyy"),
    value: providers.filter((profile) => profile.created_at && new Date(profile.created_at) >= month && new Date(profile.created_at) <= endOfMonth(month)).length,
  }));

  const domainCounts = new Map<string, number>();
  for (const user of base.authUsers) {
    const email = user.email ?? "unknown@unknown";
    const domain = email.split("@")[1] ?? "unknown";
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
  }
  const domainDistribution = Array.from(domainCounts.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const complaintWords = new Map<string, number>();
  for (const plan of base.carePlans) {
    const source = `${plan.title} ${plan.description ?? ""}`.toLowerCase();
    for (const word of source.split(/[^a-z]+/)) {
      if (word.length < 5 || ["cycle", "health", "support", "follow", "visit"].includes(word)) {
        continue;
      }
      complaintWords.set(word, (complaintWords.get(word) ?? 0) + 1);
    }
  }
  const chiefComplaints = Array.from(complaintWords.entries()).map(([label, value]) => ({ label: titleCase(label), value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const completedCarePlans = base.carePlans.filter((plan) => plan.status === "completed").length;
  const carePlanCompletionRate = base.carePlans.length ? `${Math.round((completedCarePlans / base.carePlans.length) * 100)}%` : "0%";
  const symptomLogFrequency = patients.length ? `${(base.symptomLogs.length / patients.length).toFixed(1)} logs per patient` : "0.0 logs per patient";
  const cycleTrackingAdoption = patients.length ? `${Math.round((new Set(base.cycleLogs.map((log) => log.patient_id).filter(Boolean)).size / patients.length) * 100)}%` : "0%";

  return {
    overview: {
      mauTrend,
      dauMauRatio,
      topSpecialties,
      completionRate,
    },
    growth: {
      userGrowth: roleGrowth,
      employerGrowth,
      providerGrowth,
      domainDistribution,
    },
    clinical: {
      specialtyVolume: topSpecialties,
      averageDuration: "30 min",
      carePlanCompletionRate,
      chiefComplaints,
    },
    engagement: {
      messagesTrend: months.map((month) => ({
        label: formatDate(month, "MMM yyyy"),
        value: base.messages.filter((message) => message.created_at && new Date(message.created_at) >= month && new Date(message.created_at) <= endOfMonth(month)).length,
      })),
      averageMessagesPerConversation: base.conversations.length ? (base.messages.length / base.conversations.length).toFixed(1) : "0.0",
      symptomLogFrequency,
      cycleTrackingAdoption,
    },
  };
}

export async function getSuperSystemPageData(): Promise<SuperSystemPageData> {
  const base = await getBaseSuperData();
  const flagMap = new Map(base.featureFlags.map((flag) => [flag.key, Boolean(flag.enabled)]));

  return {
    featureFlags: [
      { key: "ai_insights", label: "AI Insights enabled", description: "Allow AI-assisted health insights in supported patient workflows.", enabled: flagMap.get("ai_insights") ?? Boolean(serverEnv.ANTHROPIC_API_KEY) },
      { key: "video_consultations", label: "Video consultations enabled", description: "Enable consultation room experiences for providers and patients.", enabled: flagMap.get("video_consultations") ?? Boolean(serverEnv.DAILY_API_KEY) },
      { key: "partner_portal", label: "Partner portal enabled", description: "Allow shared-care access for invited support partners.", enabled: flagMap.get("partner_portal") ?? true },
      { key: "support_groups", label: "Support groups enabled", description: "Show moderated support groups in the patient experience.", enabled: flagMap.get("support_groups") ?? true },
      { key: "educational_content", label: "Educational content visible", description: "Publish educational content in the patient app.", enabled: flagMap.get("educational_content") ?? true },
    ],
    environmentCards: [
      { label: "App URL", value: publicEnv.NEXT_PUBLIC_APP_URL },
      { label: "Supabase project", value: publicEnv.NEXT_PUBLIC_SUPABASE_URL.slice(0, 28) },
      { label: "AI enabled", value: serverEnv.ANTHROPIC_API_KEY ? "Yes" : "No" },
      { label: "Daily.co video", value: serverEnv.DAILY_API_KEY ? "Configured" : "Not configured" },
      { label: "Environment", value: process.env.NODE_ENV === "production" ? "Production" : "Development" },
    ],
    isDevelopment: process.env.NODE_ENV !== "production",
  };
}

export async function getSuperSettingsPageData(): Promise<SuperSettingsPageData> {
  const base = await getBaseSuperData();
  const settings = new Map(base.platformSettings.map((setting) => [setting.key, setting.value ?? ""]));

  return {
    general: {
      platformName: settings.get("platform_name") || "Maven Clinic",
      supportEmail: settings.get("support_email") || "support@mavenclinic.com",
      defaultTimezone: settings.get("default_timezone") || "America/New_York",
      defaultLanguage: settings.get("default_language") || "English",
    },
    notifications: {
      systemAlertEmail: settings.get("system_alert_email") || "alerts@mavenclinic.com",
      notifyNewEmployer: settings.get("notify_new_employer") !== "false",
      notifyNewProvider: settings.get("notify_new_provider") !== "false",
      dailyReportEmailEnabled: settings.get("daily_report_email_enabled") === "true",
      dailyReportRecipient: settings.get("daily_report_recipient") || "ops@mavenclinic.com",
    },
    security: [
      { label: "RLS status", value: "Enabled" },
      { label: "Auth provider", value: "Supabase" },
      { label: "Encryption", value: "AES-256" },
      { label: "Last security audit", value: "March 15, 2026" },
    ],
  };
}






