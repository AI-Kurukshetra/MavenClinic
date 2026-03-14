import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type SeedRole = "patient" | "provider" | "employer_admin" | "clinic_admin" | "super_admin" | "partner";

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: SeedRole;
  onboardingComplete: boolean;
  employerDomain?: string;
  dateOfBirth?: string;
};

type ProviderSeed = SeedUser & {
  role: "provider";
  specialty: "ob_gyn" | "fertility" | "mental_health" | "nutrition" | "menopause";
  bio: string;
  languages: string[];
  consultationFeeCents: number;
  rating: number;
  totalReviews: number;
};

type EmployerSeed = {
  companyName: string;
  domain: string;
  employeeCount: number;
  planType: "standard" | "premium" | "enterprise";
  contractStart: string;
  contractEnd: string;
};

type AuthUserResult = {
  id: string;
  email: string;
  fullName: string;
  role: SeedRole;
  onboardingComplete: boolean;
  employerDomain?: string;
  dateOfBirth?: string;
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

const envPath = path.join(process.cwd(), ".env.local");
loadEnvFile(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local before running the seed script.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local before running the seed script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const employerSeed: EmployerSeed = {
  companyName: "Acme Corp",
  domain: "acme.com",
  employeeCount: 2500,
  planType: "enterprise",
  contractStart: "2026-01-01",
  contractEnd: "2026-12-31",
};

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

const demoUsers: SeedUser[] = [
  {
    email: "sarah.patient@mavenclinic.dev",
    password: "Patient123!",
    fullName: "Sarah Johnson",
    role: "patient",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
    dateOfBirth: "1994-08-14",
  },
  {
    email: "benefits@acme.com",
    password: "Employer123!",
    fullName: "Avery Brooks",
    role: "employer_admin",
    onboardingComplete: true,
    employerDomain: employerSeed.domain,
  },
  {
    email: "clinic.admin@mavenclinic.dev",
    password: "Clinic123!",
    fullName: "Naomi Ellis",
    role: "clinic_admin",
    onboardingComplete: true,
  },
  {
    email: "super.admin@mavenclinic.dev",
    password: "Super123!",
    fullName: "Morgan Lee",
    role: "super_admin",
    onboardingComplete: true,
  },
  {
    email: "partner.demo@mavenclinic.dev",
    password: "Partner123!",
    fullName: "Jordan Miller",
    role: "partner",
    onboardingComplete: true,
  },
];

const allSeedUsers: SeedUser[] = [...providers, ...demoUsers];

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
      console.log(`  = User already exists: ${seedUser.email}`);
      results.push({
        id: existing.id,
        email: seedUser.email,
        fullName: seedUser.fullName,
        role: seedUser.role,
        onboardingComplete: seedUser.onboardingComplete,
        employerDomain: seedUser.employerDomain,
        dateOfBirth: seedUser.dateOfBirth,
      });
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
    results.push({
      id: data.user.id,
      email: seedUser.email,
      fullName: seedUser.fullName,
      role: seedUser.role,
      onboardingComplete: seedUser.onboardingComplete,
      employerDomain: seedUser.employerDomain,
      dateOfBirth: seedUser.dateOfBirth,
    });
  }

  return results;
}

async function seedEmployer() {
  const { data: existing, error: existingError } = await supabase
    .from("employers")
    .select("id, company_name")
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
  const { error } = await supabase.from("profiles").upsert(
    users.map((user) => ({
      id: user.id,
      full_name: user.fullName,
      role: user.role,
      onboarding_complete: user.onboardingComplete,
      employer_id: user.employerDomain === employerSeed.domain ? employerId : null,
      date_of_birth: user.dateOfBirth ?? null,
    })),
  );

  if (error) {
    throw new Error(`Failed to upsert profiles: ${error.message}`);
  }

  console.log(`  + Upserted ${users.length} profiles`);
}

async function seedProviderRows(users: AuthUserResult[]) {
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
      console.log(`  = Updated provider: ${provider.fullName}`);
    } else {
      const { error } = await supabase.from("providers").insert(payload);
      if (error) {
        throw new Error(`Failed inserting provider ${provider.fullName}: ${error.message}`);
      }
      console.log(`  + Created provider: ${provider.fullName}`);
    }
  }
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
  await seedProviderRows(users);

  console.log("\nSeed complete.");
  printCredentials();
}

main().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});