-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- USERS (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  role text check (role in ('patient', 'provider', 'employer_admin', 'clinic_admin', 'super_admin', 'partner')) default 'patient',
  full_name text,
  date_of_birth date,
  pronouns text,
  language_preference text,
  health_goals text[] default array[]::text[],
  existing_conditions text[] default array[]::text[],
  current_medications text,
  insurance_carrier text,
  insurance_member_id text,
  specialty_needed text,
  preferred_language text,
  provider_gender_preference text,
  phone text,
  avatar_url text,
  onboarding_complete boolean default false,
  employer_id uuid,
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists language_preference text;
alter table public.profiles add column if not exists health_goals text[] default array[]::text[];
alter table public.profiles add column if not exists existing_conditions text[] default array[]::text[];
alter table public.profiles add column if not exists current_medications text;
alter table public.profiles add column if not exists insurance_carrier text;
alter table public.profiles add column if not exists insurance_member_id text;
alter table public.profiles add column if not exists specialty_needed text;
alter table public.profiles add column if not exists preferred_language text;
alter table public.profiles add column if not exists provider_gender_preference text;

-- PROVIDERS
create table if not exists public.providers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id),
  specialty text not null,
  license_number text,
  bio text,
  languages text[] default array['English'],
  accepting_patients boolean default true,
  suspended boolean default false,
  suspended_at timestamptz,
  suspended_reason text,
  consultation_fee_cents integer,
  rating numeric(3,2) default 5.0,
  total_reviews integer default 0
);

alter table public.providers
  add column if not exists approval_status text
  check (approval_status in ('pending','approved','rejected'))
  default 'approved';

alter table public.providers
  add column if not exists approved_at timestamptz;

alter table public.providers
  add column if not exists approved_by uuid
  references public.profiles(id);

alter table public.providers
  add column if not exists rejection_reason text;

alter table public.providers
  add column if not exists suspended boolean default false;
alter table public.providers add column if not exists suspended_at timestamptz;
alter table public.providers add column if not exists suspended_reason text;

-- PROVIDER AVAILABILITY
create table if not exists public.provider_availability (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references public.providers(id) not null,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  location text default 'Virtual',
  created_at timestamptz default now()
);

-- APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id),
  provider_id uuid references public.providers(id),
  scheduled_at timestamptz not null,
  duration_minutes integer default 30,
  type text check (type in ('video', 'messaging', 'async_review')) default 'video',
  status text check (status in ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')) default 'scheduled',
  chief_complaint text,
  video_room_url text,
  notes text,
  payment_method text check (payment_method in ('insurance', 'direct_pay')) default 'insurance',
  cancellation_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.appointments add column if not exists video_room_url text;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists payment_method text;
alter table public.appointments add column if not exists cancellation_reason text;
alter table public.appointments add column if not exists started_at timestamptz;
alter table public.appointments add column if not exists completed_at timestamptz;
alter table public.appointments add column if not exists updated_at timestamptz default now();

-- CONVERSATIONS
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  provider_profile_id uuid references public.profiles(id) not null,
  created_at timestamptz default now()
);

alter table public.conversations add column if not exists patient_id uuid references public.profiles(id);
alter table public.conversations add column if not exists provider_profile_id uuid references public.profiles(id);
alter table public.conversations add column if not exists created_at timestamptz default now();
create unique index if not exists conversations_patient_provider_unique on public.conversations (patient_id, provider_profile_id);

-- SYMPTOM LOGS
create table if not exists public.symptom_logs (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id),
  logged_at timestamptz default now(),
  symptoms jsonb not null default '{}'::jsonb,
  mood integer check (mood between 1 and 10),
  energy integer check (energy between 1 and 10),
  pain_level integer check (pain_level between 0 and 10),
  sleep_hours numeric(3,1),
  notes text,
  ai_insight text
);

alter table public.symptom_logs add column if not exists sleep_hours numeric(3,1);

-- CYCLE TRACKING
create table if not exists public.cycle_logs (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id),
  period_start date,
  period_end date,
  cycle_length integer,
  flow_intensity text check (flow_intensity in ('spotting', 'light', 'medium', 'heavy')),
  symptoms jsonb default '{}'::jsonb,
  ovulation_date date,
  fertile_window_start date,
  fertile_window_end date,
  notes text
);

-- FERTILITY DATA
create table if not exists public.fertility_data (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  date date not null,
  bbt_temp numeric(4,1),
  opk_result text check (opk_result in ('negative', 'high', 'peak')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fertility_data add column if not exists patient_id uuid references public.profiles(id);
alter table public.fertility_data add column if not exists date date;
alter table public.fertility_data add column if not exists bbt_temp numeric(4,1);
alter table public.fertility_data add column if not exists opk_result text;
alter table public.fertility_data add column if not exists created_at timestamptz default now();
alter table public.fertility_data add column if not exists updated_at timestamptz default now();
create unique index if not exists fertility_data_patient_date_unique on public.fertility_data (patient_id, date);
-- MESSAGES
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) not null,
  sender_id uuid references public.profiles(id),
  content text not null,
  message_type text default 'text',
  attachment_path text,
  attachment_name text,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages add column if not exists attachment_path text;
alter table public.messages add column if not exists attachment_name text;

-- CARE PLANS
create table if not exists public.care_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id),
  provider_id uuid references public.providers(id),
  title text not null,
  description text,
  milestones jsonb default '[]'::jsonb,
  status text default 'active',
  created_at timestamptz default now()
);

-- PRESCRIPTIONS
create table if not exists public.prescriptions (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  provider_id uuid references public.providers(id) not null,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  instructions text,
  status text check (status in ('active', 'completed', 'cancelled')) default 'active',
  refills_remaining integer default 0,
  prescribed_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.prescriptions add column if not exists patient_id uuid references public.profiles(id);
alter table public.prescriptions add column if not exists provider_id uuid references public.providers(id);
alter table public.prescriptions add column if not exists medication_name text;
alter table public.prescriptions add column if not exists dosage text;
alter table public.prescriptions add column if not exists frequency text;
alter table public.prescriptions add column if not exists instructions text;
alter table public.prescriptions add column if not exists status text;
alter table public.prescriptions add column if not exists refills_remaining integer default 0;
alter table public.prescriptions add column if not exists prescribed_at timestamptz default now();
alter table public.prescriptions add column if not exists expires_at timestamptz;
alter table public.prescriptions add column if not exists created_at timestamptz default now();

-- LAB RESULTS
create table if not exists public.lab_results (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  provider_id uuid references public.providers(id) not null,
  panel_name text not null,
  status text check (status in ('ordered', 'collected', 'resulted', 'reviewed')) default 'ordered',
  summary text,
  markers jsonb default '[]'::jsonb,
  ordered_at timestamptz default now(),
  resulted_at timestamptz,
  created_at timestamptz default now()
);

alter table public.lab_results add column if not exists patient_id uuid references public.profiles(id);
alter table public.lab_results add column if not exists provider_id uuid references public.providers(id);
alter table public.lab_results add column if not exists panel_name text;
alter table public.lab_results add column if not exists status text;
alter table public.lab_results add column if not exists summary text;
alter table public.lab_results add column if not exists markers jsonb default '[]'::jsonb;
alter table public.lab_results add column if not exists ordered_at timestamptz default now();
alter table public.lab_results add column if not exists resulted_at timestamptz;
alter table public.lab_results add column if not exists created_at timestamptz default now();

-- EMPLOYERS
create table if not exists public.employers (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  domain text unique,
  employee_count integer,
  plan_type text default 'standard',
  contract_start date,
  contract_end date
);

-- INVITATIONS
create table if not exists public.invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text check (role in ('provider', 'employer_admin', 'patient', 'partner', 'clinic_admin')), 
  token text unique default encode(gen_random_bytes(32), 'hex'),
  accepted boolean default false,
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now(),
  employer_id uuid references public.employers(id) on delete set null
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid references public.profiles(id) not null,
  actor_id uuid references public.profiles(id),
  appointment_id uuid references public.appointments(id),
  type text not null,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.notifications add column if not exists recipient_id uuid references public.profiles(id);
alter table public.notifications add column if not exists actor_id uuid references public.profiles(id);
alter table public.notifications add column if not exists appointment_id uuid references public.appointments(id);
alter table public.notifications add column if not exists type text;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists body text;
alter table public.notifications add column if not exists link text;
alter table public.notifications add column if not exists read_at timestamptz;
alter table public.notifications add column if not exists created_at timestamptz default now();

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.cycle_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.conversations enable row level security;
alter table public.notifications enable row level security;
alter table public.invitations enable row level security;
alter table public.provider_availability enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Patients own symptom logs" on public.symptom_logs;
create policy "Patients own symptom logs" on public.symptom_logs for all using (auth.uid() = patient_id);

drop policy if exists "Patients own cycle logs" on public.cycle_logs;
create policy "Patients own cycle logs" on public.cycle_logs for all using (auth.uid() = patient_id);

drop policy if exists "Patients manage own appointments" on public.appointments;
create policy "Patients manage own appointments" on public.appointments for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists "Providers read assigned appointments" on public.appointments;
create policy "Providers read assigned appointments" on public.appointments for select using (
  exists (
    select 1
    from public.providers own_provider
    where own_provider.id = appointments.provider_id
      and own_provider.profile_id = auth.uid()
  )
);

drop policy if exists "Users read provider profiles" on public.profiles;
create policy "Users read provider profiles" on public.profiles for select using (
  exists (
    select 1 from public.providers provider_profile
    where provider_profile.profile_id = profiles.id
  )
);

drop policy if exists "Providers read assigned patient profiles" on public.profiles;
create policy "Providers read assigned patient profiles" on public.profiles for select using (
  exists (
    select 1
    from public.providers own_provider
    join public.appointments appointment on appointment.provider_id = own_provider.id
    where own_provider.profile_id = auth.uid()
      and appointment.patient_id = profiles.id
  )
);

drop policy if exists "Providers manage own availability" on public.provider_availability;
create policy "Providers manage own availability" on public.provider_availability for all using (
  exists (
    select 1 from public.providers own_provider
    where own_provider.id = provider_availability.provider_id
      and own_provider.profile_id = auth.uid()
  )
);

drop policy if exists "Conversation participants only" on public.conversations;
create policy "Conversation participants only" on public.conversations for select using (
  auth.uid() = patient_id or auth.uid() = provider_profile_id
);

drop policy if exists "Conversation participants insert" on public.conversations;
create policy "Conversation participants insert" on public.conversations for insert with check (
  auth.uid() = patient_id or auth.uid() = provider_profile_id
);

drop policy if exists "Message participants only" on public.messages;
create policy "Message participants only" on public.messages for all using (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.conversations conversation
    where conversation.id = messages.conversation_id
      and (conversation.patient_id = auth.uid() or conversation.provider_profile_id = auth.uid())
  )
) with check (
  auth.uid() = sender_id
  or exists (
    select 1
    from public.conversations conversation
    where conversation.id = messages.conversation_id
      and (conversation.patient_id = auth.uid() or conversation.provider_profile_id = auth.uid())
  )
);

insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users upload message attachments" on storage.objects;
create policy "Authenticated users upload message attachments" on storage.objects for insert with check (
  bucket_id = 'message-attachments' and auth.role() = 'authenticated'
);

drop policy if exists "Authenticated users read message attachments" on storage.objects;
create policy "Authenticated users read message attachments" on storage.objects for select using (
  bucket_id = 'message-attachments' and auth.role() = 'authenticated'
);

drop policy if exists "Authenticated users update message attachments" on storage.objects;
create policy "Authenticated users update message attachments" on storage.objects for update using (
  bucket_id = 'message-attachments' and auth.role() = 'authenticated'
) with check (
  bucket_id = 'message-attachments' and auth.role() = 'authenticated'
);
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = recipient_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = recipient_id);

drop policy if exists "Actors create notifications" on public.notifications;
create policy "Actors create notifications" on public.notifications for insert with check (auth.uid() = actor_id);
-- SECURITY HARDENING POLICIES (2026-03-14)
alter table public.providers enable row level security;
alter table public.provider_availability enable row level security;
alter table public.fertility_data enable row level security;
alter table public.care_plans enable row level security;
alter table public.prescriptions enable row level security;
alter table public.lab_results enable row level security;
alter table public.employers enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users read provider profiles" on public.profiles;
drop policy if exists "Providers read assigned patient profiles" on public.profiles;
drop policy if exists "users_read_own_profile" on public.profiles;
drop policy if exists "users_update_own_profile" on public.profiles;
drop policy if exists "users_insert_own_profile" on public.profiles;
drop policy if exists "admins_read_all_profiles" on public.profiles;
drop policy if exists "admins_manage_profiles" on public.profiles;
drop policy if exists "public_read_active_provider_profiles" on public.profiles;
drop policy if exists "providers_read_assigned_patient_profiles" on public.profiles;
create policy "users_read_own_profile" on public.profiles
  for select using (auth.uid() = id);
create policy "users_update_own_profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "users_insert_own_profile" on public.profiles
  for insert with check (
    auth.uid() = id
    and coalesce(role, 'patient') = 'patient'
  );
create policy "admins_read_all_profiles" on public.profiles
  for select using (
    coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('clinic_admin', 'super_admin')
  );
create policy "admins_manage_profiles" on public.profiles
  for update using (
    coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('clinic_admin', 'super_admin')
  )
  with check (
    coalesce(auth.jwt()->'user_metadata'->>'role', '') in ('clinic_admin', 'super_admin')
  );
create policy "public_read_active_provider_profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.providers provider_profile
      where provider_profile.profile_id = profiles.id
        and provider_profile.accepting_patients = true
        and coalesce(provider_profile.suspended, false) = false
    )
  );
create policy "providers_read_assigned_patient_profiles" on public.profiles
  for select using (
    exists (
      select 1
      from public.providers own_provider
      join public.appointments appointment on appointment.provider_id = own_provider.id
      where own_provider.profile_id = auth.uid()
        and appointment.patient_id = profiles.id
    )
  );

drop policy if exists "public_read_active_providers" on public.providers;
drop policy if exists "providers_read_own_record" on public.providers;
drop policy if exists "providers_update_own_record" on public.providers;
drop policy if exists "admins_manage_providers" on public.providers;
create policy "public_read_active_providers" on public.providers
  for select using ((accepting_patients = true and coalesce(suspended, false) = false) or profile_id = auth.uid());
create policy "providers_read_own_record" on public.providers
  for select using (profile_id = auth.uid());
create policy "providers_update_own_record" on public.providers
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy "admins_manage_providers" on public.providers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinic_admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinic_admin', 'super_admin')
    )
  );

drop policy if exists "Providers manage own availability" on public.provider_availability;
drop policy if exists "public_read_active_provider_availability" on public.provider_availability;
drop policy if exists "providers_manage_own_availability" on public.provider_availability;
create policy "public_read_active_provider_availability" on public.provider_availability
  for select using (
    exists (
      select 1 from public.providers p
      where p.id = provider_availability.provider_id
        and p.accepting_patients = true
        and coalesce(p.suspended, false) = false
    )
  );
create policy "providers_manage_own_availability" on public.provider_availability
  for all using (
    exists (
      select 1 from public.providers p
      where p.id = provider_availability.provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_availability.provider_id
        and p.profile_id = auth.uid()
    )
  );

drop policy if exists "Patients manage own appointments" on public.appointments;
drop policy if exists "Providers read assigned appointments" on public.appointments;
drop policy if exists "patients_own_appointments" on public.appointments;
drop policy if exists "providers_see_assigned_appointments" on public.appointments;
drop policy if exists "patients_create_own_appointments" on public.appointments;
drop policy if exists "patients_manage_own_appointments" on public.appointments;
drop policy if exists "providers_update_assigned_appointments" on public.appointments;
drop policy if exists "admins_read_all_appointments" on public.appointments;
create policy "patients_own_appointments" on public.appointments
  for select using (patient_id = auth.uid());
create policy "providers_see_assigned_appointments" on public.appointments
  for select using (
    exists (
      select 1 from public.providers p
      where p.id = appointments.provider_id
        and p.profile_id = auth.uid()
    )
  );
create policy "patients_create_own_appointments" on public.appointments
  for insert with check (patient_id = auth.uid());
create policy "patients_manage_own_appointments" on public.appointments
  for update using (patient_id = auth.uid())
  with check (patient_id = auth.uid());
create policy "providers_update_assigned_appointments" on public.appointments
  for update using (
    exists (
      select 1 from public.providers p
      where p.id = appointments.provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = appointments.provider_id
        and p.profile_id = auth.uid()
    )
  );
create policy "admins_read_all_appointments" on public.appointments
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinic_admin', 'super_admin')
    )
  );

drop policy if exists "Conversation participants only" on public.conversations;
drop policy if exists "Conversation participants insert" on public.conversations;
drop policy if exists "patients_own_conversations" on public.conversations;
drop policy if exists "providers_own_conversations" on public.conversations;
drop policy if exists "patients_create_conversations" on public.conversations;
create policy "patients_own_conversations" on public.conversations
  for select using (patient_id = auth.uid());
create policy "providers_own_conversations" on public.conversations
  for select using (provider_profile_id = auth.uid());
create policy "patients_create_conversations" on public.conversations
  for insert with check (patient_id = auth.uid());

drop policy if exists "Message participants only" on public.messages;
drop policy if exists "participants_read_messages" on public.messages;
drop policy if exists "participants_send_messages" on public.messages;
drop policy if exists "recipients_mark_read" on public.messages;
create policy "participants_read_messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.patient_id = auth.uid() or c.provider_profile_id = auth.uid())
    )
  );
create policy "participants_send_messages" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.patient_id = auth.uid() or c.provider_profile_id = auth.uid())
    )
  );
create policy "recipients_mark_read" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.patient_id = auth.uid() or c.provider_profile_id = auth.uid())
    )
    and sender_id <> auth.uid()
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.patient_id = auth.uid() or c.provider_profile_id = auth.uid())
    )
    and sender_id <> auth.uid()
    and read_at is not null
  );

drop policy if exists "Patients own symptom logs" on public.symptom_logs;
drop policy if exists "patients_manage_own_symptom_logs" on public.symptom_logs;
create policy "patients_manage_own_symptom_logs" on public.symptom_logs
  for all using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "Patients own cycle logs" on public.cycle_logs;
drop policy if exists "patients_manage_own_cycle_logs" on public.cycle_logs;
create policy "patients_manage_own_cycle_logs" on public.cycle_logs
  for all using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "patients_manage_own_fertility_data" on public.fertility_data;
create policy "patients_manage_own_fertility_data" on public.fertility_data
  for all using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "patients_read_own_care_plans" on public.care_plans;
drop policy if exists "providers_manage_care_plans" on public.care_plans;
create policy "patients_read_own_care_plans" on public.care_plans
  for select using (patient_id = auth.uid());
create policy "providers_manage_care_plans" on public.care_plans
  for all using (
    exists (
      select 1 from public.providers p
      where p.id = care_plans.provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = care_plans.provider_id
        and p.profile_id = auth.uid()
    )
  );

drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Actors create notifications" on public.notifications;
drop policy if exists "users_own_notifications" on public.notifications;
drop policy if exists "users_update_own_notifications" on public.notifications;
create policy "users_own_notifications" on public.notifications
  for select using (recipient_id = auth.uid());
create policy "users_update_own_notifications" on public.notifications
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());


drop policy if exists "patients_read_own_referrals" on public.referrals;
drop policy if exists "providers_manage_referrals" on public.referrals;
drop policy if exists "referred_providers_read_referrals" on public.referrals;
create policy "patients_read_own_referrals" on public.referrals
  for select using (patient_id = auth.uid());
create policy "providers_manage_referrals" on public.referrals
  for all using (
    exists (
      select 1 from public.providers p
      where p.id = referrals.referring_provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = referrals.referring_provider_id
        and p.profile_id = auth.uid()
    )
  );
create policy "referred_providers_read_referrals" on public.referrals
  for select using (
    exists (
      select 1 from public.providers p
      where p.id = referrals.referred_to_provider_id
        and p.profile_id = auth.uid()
    )
  );
drop policy if exists "patients_read_own_prescriptions" on public.prescriptions;
drop policy if exists "providers_manage_prescriptions" on public.prescriptions;
create policy "patients_read_own_prescriptions" on public.prescriptions
  for select using (patient_id = auth.uid());
create policy "providers_manage_prescriptions" on public.prescriptions
  for all using (
    exists (
      select 1 from public.providers p
      where p.id = prescriptions.provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = prescriptions.provider_id
        and p.profile_id = auth.uid()
    )
  );

drop policy if exists "patients_read_resulted_labs" on public.lab_results;
drop policy if exists "providers_manage_labs" on public.lab_results;
create policy "patients_read_resulted_labs" on public.lab_results
  for select using (
    patient_id = auth.uid()
    and status in ('resulted', 'reviewed')
  );
create policy "providers_manage_labs" on public.lab_results
  for all using (
    exists (
      select 1 from public.providers p
      where p.id = lab_results.provider_id
        and p.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = lab_results.provider_id
        and p.profile_id = auth.uid()
    )
  );

drop policy if exists "employer_admin_own_data" on public.employers;
create policy "employer_admin_own_data" on public.employers
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.employer_id = employers.id
        and p.role = 'employer_admin'
    )
  );

drop policy if exists "admins_manage_invitations" on public.invitations;
create policy "admins_manage_invitations" on public.invitations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinic_admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinic_admin', 'super_admin')
    )
  );

-- PARTNER ACCESS
create table if not exists public.partner_access (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  partner_id uuid references public.profiles(id) not null,
  access_level text check (access_level in ('view_appointments', 'view_pregnancy', 'view_fertility', 'full')) not null default 'view_appointments',
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists public.pregnancy_records (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) not null,
  partner_id uuid references public.profiles(id),
  status text check (status in ('active', 'tracking', 'complete', 'loss')) default 'active',
  current_week integer,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partner_access enable row level security;
alter table public.pregnancy_records enable row level security;

drop policy if exists "patients_manage_partner_access" on public.partner_access;
create policy "patients_manage_partner_access" on public.partner_access
  for all
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "partners_view_granted_access" on public.partner_access;
create policy "partners_view_granted_access" on public.partner_access
  for select
  using (partner_id = auth.uid() or patient_id = auth.uid());

drop policy if exists "patients_manage_own_pregnancy_records" on public.pregnancy_records;
create policy "patients_manage_own_pregnancy_records" on public.pregnancy_records
  for all
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "partners_read_shared_pregnancy_records" on public.pregnancy_records;
create policy "partners_read_shared_pregnancy_records" on public.pregnancy_records
  for select
  using (
    partner_id = auth.uid()
    and exists (
      select 1
      from public.partner_access access_row
      where access_row.patient_id = pregnancy_records.patient_id
        and access_row.partner_id = auth.uid()
        and access_row.revoked_at is null
        and access_row.access_level in ('view_pregnancy', 'full')
    )
  );

-- SUPER ADMIN CONFIGURATION
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

alter table public.feature_flags enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "admins_manage_feature_flags" on public.feature_flags;
create policy "admins_manage_feature_flags" on public.feature_flags
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

drop policy if exists "admins_manage_platform_settings" on public.platform_settings;
create policy "admins_manage_platform_settings" on public.platform_settings
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_current_user_role() to authenticated;




alter table public.invitations add column if not exists invited_by uuid references public.profiles(id) on delete set null;
alter table public.invitations add column if not exists metadata jsonb default '{}'::jsonb;



alter table public.profiles add column if not exists insurance_group_number text;

create table if not exists public.support_group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.support_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);
create unique index if not exists support_group_members_group_user_unique on public.support_group_members (group_id, user_id);

create table if not exists public.insurance_claims (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  provider_id uuid references public.providers(id) on delete set null,
  service_name text not null,
  amount_cents integer default 0,
  status text check (status in ('pending', 'submitted', 'approved', 'denied', 'paid')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.wellness_assessments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  assessment_type text not null,
  answers jsonb default '[]'::jsonb,
  score integer,
  completed_at timestamptz default now()
);

alter table public.support_group_members enable row level security;
alter table public.insurance_claims enable row level security;
alter table public.wellness_assessments enable row level security;

drop policy if exists "patients_manage_support_group_memberships" on public.support_group_members;
create policy "patients_manage_support_group_memberships" on public.support_group_members
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "patients_read_own_insurance_claims" on public.insurance_claims;
create policy "patients_read_own_insurance_claims" on public.insurance_claims
  for select using (patient_id = auth.uid());

drop policy if exists "patients_manage_own_wellness_assessments" on public.wellness_assessments;
create policy "patients_manage_own_wellness_assessments" on public.wellness_assessments
  for all using (patient_id = auth.uid())
  with check (patient_id = auth.uid());