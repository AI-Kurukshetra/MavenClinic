import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

type DemoRole = "patient" | "provider" | "employer_admin" | "clinic_admin" | "super_admin" | "partner";

type DemoAccount = {
  email: string;
  password: string;
  fullName: string;
  role: DemoRole;
  onboardingComplete: boolean;
  employerDomain?: string;
};

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
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

loadEnvFile(path.join(process.cwd(), ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const employerConfig = {
  companyName: "Acme Corp",
  domain: "acme.com",
  employeeCount: 2500,
} as const;

const demoAccounts: DemoAccount[] = [
  { email: "sarah.patient@mavenclinic.dev", password: "Patient123!", fullName: "Sarah Johnson", role: "patient", onboardingComplete: true, employerDomain: employerConfig.domain },
  { email: "priya.patient@mavenclinic.dev", password: "Patient123!", fullName: "Priya Kapoor", role: "patient", onboardingComplete: true, employerDomain: employerConfig.domain },
  { email: "maria.patient@mavenclinic.dev", password: "Patient123!", fullName: "Maria Santos", role: "patient", onboardingComplete: true, employerDomain: employerConfig.domain },
  { email: "emily.patient@mavenclinic.dev", password: "Patient123!", fullName: "Emily Carter", role: "patient", onboardingComplete: true, employerDomain: employerConfig.domain },
  { email: "sarah.chen@mavenclinic.dev", password: "Provider123!", fullName: "Dr. Sarah Chen", role: "provider", onboardingComplete: true },
  { email: "amara.osei@mavenclinic.dev", password: "Provider123!", fullName: "Dr. Amara Osei", role: "provider", onboardingComplete: true },
  { email: "maya.patel@mavenclinic.dev", password: "Provider123!", fullName: "Dr. Maya Patel", role: "provider", onboardingComplete: true },
  { email: "elena.rodriguez@mavenclinic.dev", password: "Provider123!", fullName: "Dr. Elena Rodriguez", role: "provider", onboardingComplete: true },
  { email: "priya.sharma@mavenclinic.dev", password: "Provider123!", fullName: "Dr. Priya Sharma", role: "provider", onboardingComplete: true },
  { email: "benefits@acme.com", password: "Employer123!", fullName: "Avery Brooks", role: "employer_admin", onboardingComplete: true, employerDomain: employerConfig.domain },
  { email: "clinic.admin@mavenclinic.dev", password: "Clinic123!", fullName: "Naomi Ellis", role: "clinic_admin", onboardingComplete: true },
  { email: "super.admin@mavenclinic.dev", password: "Super123!", fullName: "Morgan Lee", role: "super_admin", onboardingComplete: true },
  { email: "partner.demo@mavenclinic.dev", password: "Partner123!", fullName: "Jordan Miller", role: "partner", onboardingComplete: true },
];

async function listAllUsers() {
  const users: AuthUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    users.push(...(data.users as AuthUser[]));
    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }

  return users;
}

async function getAccountSnapshot() {
  const users = await listAllUsers();
  const userByEmail = new Map(users.map((user) => [user.email?.toLowerCase(), user]));
  const ids = demoAccounts
    .map((account) => userByEmail.get(account.email.toLowerCase())?.id)
    .filter((value): value is string => Boolean(value));

  const { data: profiles, error } = ids.length
    ? await supabase.from("profiles").select("id, role, full_name, onboarding_complete, employer_id").in("id", ids)
    : { data: [], error: null };

  if (error) {
    throw error;
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return demoAccounts.map((account) => {
    const authUser = userByEmail.get(account.email.toLowerCase()) ?? null;
    const profile = authUser?.id ? profileById.get(authUser.id) ?? null : null;
    return {
      email: account.email,
      authUser,
      profile,
      exists: Boolean(authUser && profile),
    };
  });
}

function printSnapshot(label: string, snapshot: Awaited<ReturnType<typeof getAccountSnapshot>>) {
  console.log(`\n${label}`);
  for (const entry of snapshot) {
    console.log(`  ${entry.exists ? "EXISTS " : "MISSING"} ${entry.email}`);
  }
}

function runBaseSeed() {
  const result = spawnSync("npx", ["ts-node", "scripts/seed.ts"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`Base seed failed with exit code ${result.status ?? 1}.`);
  }
}

async function syncMetadataAndRepairs() {
  const users = await listAllUsers();
  const userByEmail = new Map(users.map((user) => [user.email?.toLowerCase(), user]));
  const employerResult = await supabase.from("employers").select("id, employee_count").eq("domain", employerConfig.domain).maybeSingle();
  if (employerResult.error || !employerResult.data?.id) {
    throw new Error(`Employer ${employerConfig.companyName} not found.`);
  }
  const employerId = employerResult.data.id as string;

  await supabase.from("employers").update({ employee_count: employerConfig.employeeCount }).eq("id", employerId);

  for (const account of demoAccounts) {
    const authUser = userByEmail.get(account.email.toLowerCase());
    if (!authUser?.id) {
      continue;
    }

    const profilePayload: Record<string, unknown> = {
      id: authUser.id,
      full_name: account.fullName,
      role: account.role,
      onboarding_complete: account.onboardingComplete,
    };

    if (account.employerDomain === employerConfig.domain) {
      profilePayload.employer_id = employerId;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(profilePayload);
    if (profileError) {
      throw new Error(`Failed to upsert profile for ${account.email}: ${profileError.message}`);
    }

    const { error: metadataError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: account.password,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        full_name: account.fullName,
        role: account.role,
        onboardingComplete: account.onboardingComplete,
      },
    });

    if (metadataError) {
      throw new Error(`Failed to sync metadata for ${account.email}: ${metadataError.message}`);
    }
  }

  const providerEmails = demoAccounts.filter((account) => account.role === "provider").map((account) => account.email.toLowerCase());
  const providerProfileIds = providerEmails
    .map((email) => userByEmail.get(email)?.id)
    .filter((value): value is string => Boolean(value));

  if (providerProfileIds.length) {
    const { data: providerRows, error: providerError } = await supabase
      .from("providers")
      .select("id, profile_id")
      .in("profile_id", providerProfileIds);

    if (providerError) {
      throw new Error(`Failed to verify provider rows: ${providerError.message}`);
    }

    const nowIso = new Date().toISOString();
    for (const row of providerRows ?? []) {
      const { error } = await supabase
        .from("providers")
        .update({
          approval_status: "approved",
          suspended: false,
          suspended_at: null,
          suspended_reason: null,
          accepting_patients: true,
          approved_at: nowIso,
        })
        .eq("id", row.id);

      if (error) {
        throw new Error(`Failed to repair provider row ${row.id}: ${error.message}`);
      }
    }
  }

  const sarahUserId = userByEmail.get("sarah.patient@mavenclinic.dev")?.id;
  const partnerUserId = userByEmail.get("partner.demo@mavenclinic.dev")?.id;
  if (sarahUserId && partnerUserId) {
    const { error: deleteError } = await supabase
      .from("partner_access")
      .delete()
      .eq("patient_id", sarahUserId)
      .eq("partner_id", partnerUserId);

    if (deleteError) {
      throw new Error(`Failed to clear partner access: ${deleteError.message}`);
    }

    const { error } = await supabase.from("partner_access").insert({
      patient_id: sarahUserId,
      partner_id: partnerUserId,
      access_level: "full",
      revoked_at: null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to ensure partner access: ${error.message}`);
    }
  }
}

async function verifyAllReady() {
  const snapshot = await getAccountSnapshot();
  const missing = snapshot.filter((entry) => !entry.exists).map((entry) => entry.email);

  const users = await listAllUsers();
  const userByEmail = new Map(users.map((user) => [user.email?.toLowerCase(), user]));
  const providerProfileIds = demoAccounts
    .filter((account) => account.role === "provider")
    .map((account) => userByEmail.get(account.email.toLowerCase())?.id)
    .filter((value): value is string => Boolean(value));

  const { data: providerRows, error: providerError } = providerProfileIds.length
    ? await supabase.from("providers").select("id, profile_id, approval_status, suspended, accepting_patients").in("profile_id", providerProfileIds)
    : { data: [], error: null };

  if (providerError) {
    throw providerError;
  }

  const providerByProfile = new Map((providerRows ?? []).map((row) => [row.profile_id, row]));
  const providerIssues: string[] = [];
  for (const profileId of providerProfileIds) {
    const row = providerByProfile.get(profileId);
    if (!row) {
      providerIssues.push(`Missing provider row for profile ${profileId}`);
      continue;
    }
    if (row.approval_status !== "approved" || row.suspended === true || row.accepting_patients !== true) {
      providerIssues.push(`Provider row misconfigured for profile ${profileId}`);
    }
  }

  const employerUserId = userByEmail.get("benefits@acme.com")?.id;
  const employerProfile = employerUserId
    ? await supabase.from("profiles").select("employer_id").eq("id", employerUserId).maybeSingle()
    : { data: null, error: null };
  if (employerProfile.error) {
    throw employerProfile.error;
  }

  const partnerUserId = userByEmail.get("partner.demo@mavenclinic.dev")?.id;
  const sarahUserId = userByEmail.get("sarah.patient@mavenclinic.dev")?.id;
  const partnerAccess = partnerUserId && sarahUserId
    ? await supabase
        .from("partner_access")
        .select("id, access_level, revoked_at")
        .eq("partner_id", partnerUserId)
        .eq("patient_id", sarahUserId)
        .is("revoked_at", null)
    : { data: [], error: null };

  if (partnerAccess.error) {
    throw partnerAccess.error;
  }

  return {
    snapshot,
    missing,
    providerIssues,
    employerLinked: Boolean(employerProfile.data?.employer_id),
    partnerLinked: Boolean((partnerAccess.data ?? [])[0]?.id),
  };
}

async function main() {
  const before = await getAccountSnapshot();
  printSnapshot("Before demo seed", before);

  runBaseSeed();
  await syncMetadataAndRepairs();

  const after = await verifyAllReady();
  printSnapshot("After demo seed", after.snapshot);

  const created = after.snapshot
    .filter((entry) => !before.find((beforeEntry) => beforeEntry.email === entry.email)?.exists && entry.exists)
    .map((entry) => entry.email);
  const alreadyExisted = before.filter((entry) => entry.exists).map((entry) => entry.email);

  console.log("\nSummary");
  console.log(`  Created accounts: ${created.length ? created.join(", ") : "none"}`);
  console.log(`  Already existed: ${alreadyExisted.length ? alreadyExisted.join(", ") : "none"}`);
  console.log(`  Missing after run: ${after.missing.length ? after.missing.join(", ") : "none"}`);
  console.log(`  Provider issues: ${after.providerIssues.length ? after.providerIssues.join("; ") : "none"}`);
  console.log(`  Employer admin linked: ${after.employerLinked ? "yes" : "no"}`);
  console.log(`  Partner access linked: ${after.partnerLinked ? "yes" : "no"}`);

  if (after.missing.length || after.providerIssues.length || !after.employerLinked || !after.partnerLinked) {
    throw new Error("Demo seed completed with remaining verification issues.");
  }

  console.log("\nAll 13 demo accounts are ready.");
}

main().catch((error) => {
  console.error("\nDemo seed failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

