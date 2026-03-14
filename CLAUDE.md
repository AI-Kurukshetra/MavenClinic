# Maven Clinic ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Complete Project Context for Codex CLI

> Place this file in your project root. Codex CLI reads it automatically on every command.
> Last updated: March 2026 | Stack: Next.js 14 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Supabase ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Tailwind CSS ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Claude AI

---

## What This Product Is

**Maven Clinic** is a production-grade virtual women's health and fertility platform. It connects patients with specialized healthcare providers (OB/GYN, fertility, mental health, nutrition, menopause) through video consultations, secure messaging, and AI-powered health insights. Employers sponsor access as a workforce benefit. The platform covers the complete women's health journey from adolescence through menopause.

This is a real product ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â not a prototype. Every feature must be production quality, HIPAA-conscious, mobile-first, and accessible.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router, TypeScript |
| Styling | Tailwind CSS (custom design tokens) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Video | WebRTC / Daily.co |
| Payments | Stripe |

---

## Design System

**Color Tokens** (defined in tailwind.config.ts):
- rose-400: #F5A3B7 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ primary CTAs, active states, period tracking
- rose-500: #E87D9B ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ hover states
- rose-600: #D4587B ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ pressed states
- teal-400: #3DBFAD ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ AI insights, fertility, success states
- teal-500: #2EA898 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ hover states
- slate-50: #F8F7F5 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ page backgrounds
- slate-100: #F0EEE9 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ card borders
- gray-800: #2D2D2D ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ primary text

**Typography**:
- UI font: DM Sans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â all body, labels, navigation
- Display font: Playfair Display ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â hero headings only, use sparingly

**Component Rules**:
- Cards: bg-white rounded-2xl shadow-sm border border-slate-100
- Primary button: bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-6 py-3
- Secondary button: border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl px-6 py-3
- Health chips: pill-shaped toggles for symptom/goal selection
- Input fields: border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-300
- Always use Suspense with skeleton loaders for async data
- Every empty state needs a friendly message + CTA
- Mobile-first: design for 375px, enhance for desktop

**Tone**: Warm, trustworthy, empowering. Medical-grade reliability with personal care. Never cold, never clinical.

---

## User Roles ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Complete Architecture

There are 6 roles in the system defined in profiles.role:
patient | provider | employer_admin | clinic_admin | super_admin | partner

### 1. patient (default)
Women using the platform for health management.
- Register via public /signup page
- Complete 5-step health onboarding
- Book appointments, track symptoms, cycle, fertility
- Video consultations + secure messaging
- View lab results, prescriptions, care plans
- Access educational content + support groups
- Invite partner for shared access
- Manage insurance + payments

### 2. provider
Doctors and specialists on the platform.
- Invited by clinic_admin via invitation token
- Register via /register/provider?token=xxx
- Specialties: ob_gyn, fertility, mental_health, nutrition, menopause, lactation, general
- Manage schedule + availability
- Conduct video consultations
- Write prescriptions, order labs, create care plans
- Manage patient queue + messages + referrals

### 3. employer_admin
HR/benefits managers at sponsoring companies.
- Invited by clinic_admin or super_admin
- Register via /register/employer?token=xxx
- Manage employee benefits + invitations
- View anonymized utilization analytics
- Track aggregated health outcomes (never individual)
- Manage subscription + billing + ROI reports

### 4. clinic_admin
Maven Clinic internal operations team.
- Created by super_admin only
- Approve/reject/suspend providers + verify licenses
- Manage provider matching algorithm config
- Publish educational content + moderate support groups
- Oversee insurance verification + lab partners
- Handle referral networks + emergency resources
- Monitor AI insight quality + HIPAA compliance reports

### 5. super_admin
Platform owner ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â full system access.
- All clinic_admin capabilities
- Manage employer accounts + contracts
- Financial reporting + revenue analytics
- System configuration + feature flags + API key management

### 6. partner
Family member or partner with limited patient-controlled access.
- Invited by patient from their settings
- Access levels: view_appointments | view_pregnancy | view_fertility | full
- Cannot message providers directly
- Emergency contact role

---

## Project Structure

```
/app
  /(auth)
    /login
    /signup                        ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Patient public registration
    /onboarding                    ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 5-step health profile wizard
    /register/provider             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Provider invite token registration
    /register/employer             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Employer admin invite registration
    /register/partner              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Partner invite registration

  /(patient)
    /dashboard                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Home: next appt, cycle widget, AI insight, check-in
    /appointments                  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Upcoming + book new
    /consultations/[id]            ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Live video room
    /symptoms                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Daily tracker + 30-day trends
    /cycle                         ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Menstrual + fertility calendar
    /fertility                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â BBT, OPK, conception mode
    /pregnancy                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Pregnancy milestone tracker
    /records                       ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Lab results, prescriptions, medical records
    /messages                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Secure messaging (Realtime)
    /care-plans                    ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Active care plans + milestones
    /education                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Content library by life stage
    /support-groups                ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Community groups
    /wellness                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Assessments + holistic score
    /referrals                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â View referrals from providers
    /insurance                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Claims + verification
    /partner                       ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Manage partner access
    /settings                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Profile, notifications, security

  /(provider)
    /provider/dashboard            ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Schedule + patient queue + stats
    /provider/patients             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Patient list + search
    /provider/patients/[id]        ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Individual patient view
    /provider/appointments         ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Calendar + schedule management
    /provider/availability         ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Set weekly availability
    /provider/messages             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Patient messaging
    /provider/prescriptions        ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Write + track prescriptions
    /provider/labs                 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Order + review lab results
    /provider/referrals            ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Manage referrals
    /provider/care-plans           ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Create + manage care plans
    /provider/earnings             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Billing + payouts

  /(clinic-admin)
    /admin/dashboard               ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Operations overview
    /admin/providers               ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Approve/manage providers
    /admin/invitations             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Send + manage invitations
    /admin/content                 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Educational content CMS
    /admin/support-groups          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Moderate communities
    /admin/compliance              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â HIPAA reports + audit logs
    /admin/care-templates          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Care plan template library
    /admin/analytics               ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Platform-wide analytics

  /(employer)
    /employer/dashboard            ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Utilization + outcomes analytics
    /employer/employees            ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Employee management + invitations
    /employer/benefits             ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Benefits configuration
    /employer/reports              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ROI + health outcome reports
    /employer/billing              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Subscription management

  /(super-admin)
    /super/dashboard               ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Full platform overview
    /super/employers               ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â All employer accounts
    /super/financials              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Revenue + billing
    /super/system                  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Config + feature flags

  /api
    /api/ai                        ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Claude API endpoint
    /api/auth                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Auth helpers
    /api/webhooks                  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Stripe + external webhooks

/components
  /ui                              ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Button, Card, Badge, Avatar, HealthChip,
                                     StatCard, ProgressRing, SkeletonLoader,
                                     EmptyState, Modal, Toast
  /health                          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ProviderCard, AppointmentCard, CycleCalendar,
                                     SymptomChips, AIInsightCard, CareplanProgress,
                                     LabResultCard, PrescriptionCard
  /forms                           ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â OnboardingWizard, SymptomLogForm,
                                     CycleLogForm, AppointmentBookingForm
  /layouts                         ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â PatientLayout, ProviderLayout, AdminLayout

/lib
  /supabase
    client.ts                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Browser Supabase client
    server.ts                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Server Supabase client (cookies)
    middleware.ts                  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Auth + role-based route protection
  /ai
    insights.ts                    ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Claude API wrappers
    prompts.ts                     ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â All AI prompt templates
  /hooks                           ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â useUser, useProfile, useRealtime,
                                     useAppointments
  /utils                           ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â dates.ts, cycle.ts, formatting.ts

/scripts
  seed.ts                          ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Database seeder

/types
  database.ts                      ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Supabase generated types
  index.ts                         ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Shared TypeScript types
```

---

## Complete Database ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â All 24 Tables

### Core Tables
- profiles ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â all 6 roles, extends auth.users
- providers ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â specialty, bio, fee, rating, availability
- employers ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â B2B clients + contracts
- invitations ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â role-based invite tokens

### Patient Health Tables
- symptom_logs ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â daily symptoms, mood, energy, pain
- cycle_logs ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â period tracking, flow, ovulation
- fertility_data ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â BBT, LH surge, cervical mucus, OPK
- pregnancy_records ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â milestones, due date, partner link
- wellness_assessments ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â questionnaires + scores

### Clinical Tables
- appointments ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â consultations with full status lifecycle
- conversations ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â message threads patient + provider
- messages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â individual messages (Realtime enabled)
- care_plans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â treatment plans with milestones
- medical_records ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â lab results, prescriptions, notes
- prescriptions ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â electronic Rx with pharmacy tracking
- lab_results ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ordered tests + results
- referrals ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â provider-to-provider referrals
- insurance_claims ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â claims processing + status

### Platform Tables
- notifications ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â smart alerts (Realtime enabled)
- educational_content ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â articles/videos by clinic_admin
- support_groups ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â moderated community groups
- support_group_members ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â group membership
- partner_access ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â patient-controlled partner permissions
- provider_availability ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â weekly schedule slots

---

## Supabase Patterns

### Server Component
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
```

### Client Component
```typescript
'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient()
```

### Role-Based Middleware
```typescript
const roleRoutes: Record<string, string[]> = {
  '/patient': ['patient'],
  '/provider': ['provider'],
  '/admin': ['clinic_admin', 'super_admin'],
  '/employer': ['employer_admin'],
  '/super': ['super_admin'],
}
```

### Realtime ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Messages
```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => setMessages(prev => [...prev, payload.new]))
  .subscribe()

return () => supabase.removeChannel(channel)
```

### Realtime ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Notifications
```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    setNotifications(prev => [payload.new, ...prev])
    setUnreadCount(prev => prev + 1)
  })
  .subscribe()
```

### Realtime ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Appointment Status
```typescript
const channel = supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'appointments',
    filter: `patient_id=eq.${userId}`
  }, (payload) => {
    if (payload.new.status === 'in_progress') {
      router.push(`/consultations/${payload.new.id}`)
    }
  })
  .subscribe()
```

---

## AI Integration ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Claude API

### Endpoint
POST /api/ai
Body: { type: string, data: object }

### Insight Types
- symptom_insight ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â analyze recent logs, return actionable tip
- cycle_prediction ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â predict next period, fertile window, ovulation
- care_plan_suggestion ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â generate personalized milestone plan
- fertility_optimization ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â conception recommendations
- wellness_score ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â holistic health score + improvement areas
- risk_flag ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â flag symptoms that need provider attention

### Claude Call Pattern
```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()
const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 500,
  messages: [{ role: 'user', content: prompt }]
})
return message.content[0].text
```

### Critical AI Rules ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Never Violate
1. Never diagnose any medical condition
2. Never recommend specific medications or dosages
3. Always suggest consulting a provider for concerning patterns
4. Warm and supportive tone only ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never alarming
5. Max 3 sentences for dashboard insight cards
6. Always end risk flags with "Please consult your provider"

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
DAILY_API_KEY=
```

---

## Seed Data (scripts/seed.ts)

Run: npx ts-node scripts/seed.ts

Providers seeded:
- Dr. Sarah Chen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ob_gyn ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â English, Mandarin
- Dr. Amara Osei ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â fertility ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â English, French, Twi
- Dr. Maya Patel ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â mental_health ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â English, Hindi, Gujarati
- Dr. Elena Rodriguez ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â menopause ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â English, Spanish
- Dr. Priya Sharma ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â nutrition ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â English, Hindi

Employer seeded:
- Acme Corp ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Enterprise ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 2500 employees

---

## Build Phases

### Phase 1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Core Platform (Current Focus)
- Auth + role-based routing + middleware
- Patient onboarding wizard (5 steps)
- Patient dashboard
- Provider registration via invite token
- Appointment booking + video consultation
- Symptom + cycle tracking
- Secure messaging with Realtime
- AI health insights (Claude API)
- Notification system

### Phase 2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Clinical Workflows
- Prescription management
- Lab test ordering + results
- Referral management
- Insurance verification + claims
- Care plan templates
- clinic_admin dashboard
- Provider availability management
- Emergency resources

### Phase 3 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Employer + Partner
- Employer analytics dashboard
- Employee invitation + benefits config
- ROI reporting
- Partner portal with permission controls
- Wellness assessments + holistic score

### Phase 4 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Advanced Features
- AI provider matching algorithm
- Fertility optimization engine
- Wearable device integration (Apple HealthKit, Google Fit)
- Support groups + moderation
- Educational content library CMS
- Clinical trial matching
- Predictive risk modeling

### Phase 5 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Integrations + Scale
- EHR integration (Epic/Cerner FHIR)
- Pharmacy API integration
- Lab partner APIs (LabCorp/Quest)
- Insurance API integration
- Multi-language AI translator
- HIPAA compliance audit
- super_admin platform controls

---

## Non-Negotiable Production Rules

- All health data is PHI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never console.log patient data
- Use Server Components by default ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â use client only for interactivity
- Supabase RLS is the security layer ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never bypass it
- Role checks must happen server-side in middleware
- Never trust client-only role checks
- Partner access must always be verified against partner_access table
- clinic_admin and super_admin routes must have double role verification
- Never show individual patient data in employer dashboards ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â always aggregated
- Every list needs empty state: icon + friendly message + CTA
- Every async operation needs a loading skeleton
- All forms need Zod validation before submission
- Stripe handles all payments ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â never store card data

## Implementation Notes - March 2026

- Middleware now enforces server-side auth and role protection for all six roles in `profiles.role`: `patient`, `provider`, `employer_admin`, `clinic_admin`, `super_admin`, and `partner`.
- Current protected route prefixes are `/dashboard`, `/appointments`, `/consultations`, `/symptoms`, `/cycle`, `/records`, `/messages`, `/education`, `/provider`, `/employer`, `/clinic`, `/super`, and `/partner`.
- `/clinic/*` is available to both `clinic_admin` and `super_admin`; `/admin/*` remains reserved in middleware for the same role pair.
- The app now includes protected landing routes for `super_admin` at `/super/dashboard` and `partner` at `/partner` so middleware redirects resolve to real pages.
- Patient onboarding now persists all 5-step fields directly on `profiles` using shared Zod validation. Do not store onboarding detail fields in auth metadata; keep them in `profiles` columns like `pronouns`, `health_goals`, `existing_conditions`, `insurance_carrier`, `specialty_needed`, and `provider_gender_preference`.
- Patient dashboard data must come from live Supabase reads: next scheduled appointment, latest cycle log, symptom logs from the last 14 days for AI insight generation, the latest active care plan, and message unread counts derived from `read_at is null` and `sender_id != user.id`. Do not reintroduce mock fallback data in `getPatientDashboardData()`.
- Provider dashboard data must use the server Supabase client with live queries: todayÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½s appointments from `appointments`, distinct patients from provider appointments joined to `profiles`, unread message counts from `messages`, and availability from `provider_availability`. Do not reintroduce mock provider dashboard data.
- Middleware-protected patient routes now exist for `/fertility`, `/pregnancy`, `/care-plans`, `/support-groups`, `/wellness`, `/referrals`, `/insurance`, and `/settings`, each with a real patient-shell page and coming-soon state.
- `/admin` and `/admin/dashboard` now resolve for `clinic_admin` and `super_admin` and redirect into `/clinic/dashboard`.
- `super_admin` now has a basic workflow tree at `/super/dashboard`, `/super/employers`, and `/super/system`.
- `partner` now has a basic workflow tree at `/partner`, `/partner/appointments`, and `/partner/pregnancy`.
- Patient dashboard conversations should come from a dedicated `conversations` table keyed by `patient_id` and `provider_profile_id`. Do not infer dashboard threads from `messages` alone. Empty dashboard message/AI states should return `[]` or `null`, not fake content strings like `Care team` or generated placeholder insights.
- `/appointments` is now a production patient flow with two tabs: live upcoming appointments from `appointments` and a 4-step booking flow backed by real `providers`, `profiles`, `provider_availability`, and `appointments` queries. Booking inserts a scheduled appointment, creates or reuses a `conversations` row for the patient/provider pair, and inserts `notifications` rows for both patient and provider.
- Appointment mutations now live at `/api/appointments/[id]` and support patient reschedule, cancellation with reason, and consultation completion. Reschedule uses the same live slot generation logic as booking and provider notifications are inserted for reschedule and cancellation events.
- `/consultations/[id]` now verifies patient ownership of the appointment, redirects invalid or too-early joins back to `/appointments`, marks scheduled visits as `in_progress` on load, and renders a full consultation room with realtime chat, notes/info side panel, status subscription, and a Daily iframe only when `DAILY_API_KEY` and `video_room_url` are present.
- The Supabase schema for this flow now requires `appointments` consultation columns (`video_room_url`, `notes`) plus lifecycle columns (`payment_method`, `cancellation_reason`, `started_at`, `completed_at`, `updated_at`), a `notifications` table, `messages.conversation_id` referencing `conversations(id)`, and RLS policies for patient-owned appointments, participant-created conversations, and recipient-scoped notifications. Apply the latest `supabase/schema.sql` before testing booking or consultations against an existing database.
- Consultation rooms are now provisioned through `/api/consultations/create-room`. Booking fires this API in the background after the appointment row is created; the route verifies appointment ownership, creates a private Daily room when `DAILY_API_KEY` is configured, stores the resulting `appointments.video_room_url`, and falls back to a demo URL (`/consultations/{appointmentId}/demo`) when Daily is not configured.
- `/consultations/[id]` also self-heals missing room URLs on load by creating the Daily/demo room server-side before rendering. Only `https://` room URLs are embedded as Daily iframes; demo URLs keep the existing UI shell.
- Consultation elapsed time must be calculated from `appointments.started_at`, not `scheduled_at`. Whenever a scheduled appointment is moved to `in_progress`, persist `started_at` with the same update so the timer is accurate across refreshes.
- The consultation room client must decide embed mode strictly from `appointment.videoRoomUrl`: embed Daily only when it starts with `https://`; otherwise render the demo shell. Do not rely on `DAILY_API_KEY` in client components.
- Consultation timers must be based on `appointments.started_at` whenever it exists. Only fall back to `scheduled_at` if `started_at` is still null.
- The appointment and consultation flows now use a shared `Toast` component for booking, reschedule, cancellation, and consultation completion feedback. Booking slot UIs should show the detected browser timezone, and patients can save personal consultation notes back to `appointments.notes` from the consultation side panel.
- The legacy `page-toast` component has been removed. Appointment booking should show an inline success confirmation on Step 4 for roughly 1.5 seconds before redirecting back to `/appointments`, while the shared `Toast` component remains the standard transient feedback surface elsewhere.
- `/consultations/[id]` now performs a page-level fallback room creation step: if the fetched appointment has no `videoRoomUrl`, call `/api/consultations/create-room`, then refetch the appointment before rendering the room.
