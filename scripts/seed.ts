import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

type ProviderSeed = {
  email: string;
  password: string;
  fullName: string;
  specialty: "ob_gyn" | "fertility" | "mental_health" | "nutrition" | "menopause";
  bio: string;
  languages: string[];
  consultationFeeCents: number;
  rating: number;
  totalReviews: number;
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

const providers: ProviderSeed[] = [
  {
    email: "sarah.chen@mavenclinic.dev",
    password: "Provider123!",
    fullName: "Dr. Sarah Chen",
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
    specialty: "nutrition",
    bio: "Registered dietitian specializing in hormonal health, fertility nutrition, and prenatal care.",
    languages: ["English", "Hindi", "Gujarati"],
    consultationFeeCents: 5500,
    rating: 4.8,
    totalReviews: 119,
  },
];

async function getAllAuthUsers() {
  const users: Array<{ id: string; email?: string | null; user_metadata?: { full_name?: string } }> = [];
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

async function ensureProviderUsers() {
  const existingUsers = await getAllAuthUsers();
  const userByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
  const results: Array<{ id: string; email: string; fullName: string }> = [];

  for (const provider of providers) {
    const existing = userByEmail.get(provider.email.toLowerCase());
    if (existing?.id) {
      console.log(`  = User already exists: ${provider.email}`);
      results.push({ id: existing.id, email: provider.email, fullName: provider.fullName });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: provider.email,
      password: provider.password,
      email_confirm: true,
      user_metadata: { full_name: provider.fullName },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create auth user ${provider.email}: ${error?.message ?? "Unknown error"}`);
    }

    console.log(`  + Created user: ${provider.email}`);
    results.push({ id: data.user.id, email: provider.email, fullName: provider.fullName });
  }

  return results;
}

async function seedProfiles(users: Array<{ id: string; email: string; fullName: string }>) {
  const { error } = await supabase.from("profiles").upsert(
    users.map((user) => ({
      id: user.id,
      full_name: user.fullName,
      role: "provider",
      onboarding_complete: true,
    })),
  );

  if (error) {
    throw new Error(`Failed to upsert provider profiles: ${error.message}`);
  }

  console.log(`  + Upserted ${users.length} provider profiles`);
}

async function seedProviderRows(users: Array<{ id: string; email: string; fullName: string }>) {
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

async function seedEmployer() {
  const { data: existing, error: existingError } = await supabase
    .from("employers")
    .select("id, company_name")
    .eq("domain", "acme.com")
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed checking employer seed: ${existingError.message}`);
  }

  const payload = {
    company_name: "Acme Corp",
    domain: "acme.com",
    employee_count: 2500,
    plan_type: "enterprise",
    contract_start: "2026-01-01",
    contract_end: "2026-12-31",
  };

  if (existing?.id) {
    const { error } = await supabase.from("employers").update(payload).eq("id", existing.id);
    if (error) {
      throw new Error(`Failed updating employer seed: ${error.message}`);
    }
    console.log(`  = Updated employer: ${payload.company_name}`);
    return;
  }

  const { error } = await supabase.from("employers").insert(payload);
  if (error) {
    throw new Error(`Failed inserting employer seed: ${error.message}`);
  }
  console.log(`  + Created employer: ${payload.company_name}`);
}

async function main() {
  console.log("Seeding Maven Clinic database...");
  const users = await ensureProviderUsers();
  await seedProfiles(users);
  await seedProviderRows(users);
  await seedEmployer();

  console.log("\nSeed complete.");
  console.log("\nDemo provider credentials:");
  providers.forEach((provider) => console.log(`  ${provider.email} / ${provider.password}`));
}

main().catch((error) => {
  console.error("\nSeed failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
