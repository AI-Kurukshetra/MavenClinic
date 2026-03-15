import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

type AdminDatabase = {
  public: {
    Tables: {
      invitations: {
        Row: {
          id: string;
          email: string;
          role: string;
          token: string;
          accepted: boolean | null;
          expires_at: string | null;
          created_at: string | null;
          employer_id: string | null;
          invited_by: string | null;
          metadata: unknown;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          token?: string;
          accepted?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
          employer_id?: string | null;
          invited_by?: string | null;
          metadata?: unknown;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          token?: string;
          accepted?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
          employer_id?: string | null;
          invited_by?: string | null;
          metadata?: unknown;
        };
        Relationships: [];
      };
      employers: {
        Row: {
          id: string;
          company_name: string;
          domain: string | null;
          employee_count: number | null;
          plan_type: string | null;
          contract_start: string | null;
          contract_end: string | null;
        };
        Insert: {
          id?: string;
          company_name: string;
          domain?: string | null;
          employee_count?: number | null;
          plan_type?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
        };
        Update: {
          id?: string;
          company_name?: string;
          domain?: string | null;
          employee_count?: number | null;
          plan_type?: string | null;
          contract_start?: string | null;
          contract_end?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string | null;
          provider_id: string | null;
          status: string | null;
          scheduled_at: string;
          type: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: string | null;
          scheduled_at: string;
          type?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: string | null;
          scheduled_at?: string;
          type?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      care_plans: {
        Row: {
          id: string;
          patient_id: string | null;
          provider_id: string | null;
          title: string;
          description: string | null;
          milestones: unknown;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          title?: string;
          description?: string | null;
          milestones?: unknown;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          title?: string;
          description?: string | null;
          milestones?: unknown;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          patient_id: string | null;
          referring_provider_id: string | null;
          referred_to_provider_id: string | null;
          referred_to_specialty: string | null;
          reason: string | null;
          urgency: string | null;
          status: string | null;
          clinical_notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          referring_provider_id?: string | null;
          referred_to_provider_id?: string | null;
          referred_to_specialty?: string | null;
          reason?: string | null;
          urgency?: string | null;
          status?: string | null;
          clinical_notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          referring_provider_id?: string | null;
          referred_to_provider_id?: string | null;
          referred_to_specialty?: string | null;
          reason?: string | null;
          urgency?: string | null;
          status?: string | null;
          clinical_notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };      feature_flags: {
        Row: {
          key: string;
          enabled: boolean | null;
          updated_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          enabled?: boolean | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          enabled?: boolean | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: string | null;
          updated_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      educational_content: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          category: string | null;
          life_stage: string | null;
          published: boolean | null;
          author_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content?: string | null;
          category?: string | null;
          life_stage?: string | null;
          published?: boolean | null;
          author_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string | null;
          category?: string | null;
          life_stage?: string | null;
          published?: boolean | null;
          author_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          patient_id: string;
          provider_profile_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          provider_profile_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          provider_profile_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cycle_logs: {
        Row: {
          id: string;
          patient_id: string | null;
          period_start: string | null;
          period_end: string | null;
          cycle_length: number | null;
          flow_intensity: string | null;
          symptoms: unknown;
          ovulation_date: string | null;
          fertile_window_start: string | null;
          fertile_window_end: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          cycle_length?: number | null;
          flow_intensity?: string | null;
          symptoms?: unknown;
          ovulation_date?: string | null;
          fertile_window_start?: string | null;
          fertile_window_end?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          cycle_length?: number | null;
          flow_intensity?: string | null;
          symptoms?: unknown;
          ovulation_date?: string | null;
          fertile_window_start?: string | null;
          fertile_window_end?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };      notifications: {
        Row: {
          id: string;
          recipient_id: string | null;
          actor_id: string | null;
          appointment_id: string | null;
          type: string | null;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_id?: string | null;
          actor_id?: string | null;
          appointment_id?: string | null;
          type?: string | null;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          recipient_id?: string | null;
          actor_id?: string | null;
          appointment_id?: string | null;
          type?: string | null;
          title?: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          message_type: string | null;
          read_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id?: string | null;
          content: string;
          message_type?: string | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          message_type?: string | null;
          read_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      partner_access: {
        Row: {
          id: string;
          patient_id: string;
          partner_id: string;
          access_level: string;
          created_at: string | null;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          partner_id: string;
          access_level: string;
          created_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          partner_id?: string;
          access_level?: string;
          created_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      pregnancy_records: {
        Row: {
          id: string;
          patient_id: string;
          partner_id: string | null;
          status: string | null;
          current_week: number | null;
          due_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          partner_id?: string | null;
          status?: string | null;
          current_week?: number | null;
          due_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          partner_id?: string | null;
          status?: string | null;
          current_week?: number | null;
          due_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: string | null;
          full_name: string | null;
          date_of_birth: string | null;
          phone: string | null;
          avatar_url: string | null;
          onboarding_complete: boolean | null;
          employer_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          role?: string | null;
          full_name?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean | null;
          employer_id?: string | null;
          invited_by?: string | null;
          metadata?: unknown;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          role?: string | null;
          full_name?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          onboarding_complete?: boolean | null;
          employer_id?: string | null;
          invited_by?: string | null;
          metadata?: unknown;
          created_at?: string | null;
        };
        Relationships: [];
      };
      provider_availability: {
        Row: {
          id: string;
          provider_id: string;
          day_of_week: string | number;
          start_time: string;
          end_time: string;
          location: string | null;
        };
        Insert: {
          id?: string;
          provider_id: string;
          day_of_week: string | number;
          start_time: string;
          end_time: string;
          location?: string | null;
        };
        Update: {
          id?: string;
          provider_id?: string;
          day_of_week?: string | number;
          start_time?: string;
          end_time?: string;
          location?: string | null;
        };
        Relationships: [];
      };
      providers: {
        Row: {
          id: string;
          profile_id: string | null;
          specialty: string;
          license_number: string | null;
          bio: string | null;
          languages: string[] | null;
          accepting_patients: boolean | null;
          suspended: boolean | null;
          suspended_at: string | null;
          suspended_reason: string | null;
          consultation_fee_cents: number | null;
          rating: number | null;
          total_reviews: number | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          specialty: string;
          license_number?: string | null;
          bio?: string | null;
          languages?: string[] | null;
          accepting_patients?: boolean | null;
          suspended?: boolean | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          consultation_fee_cents?: number | null;
          rating?: number | null;
          total_reviews?: number | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          specialty?: string;
          license_number?: string | null;
          bio?: string | null;
          languages?: string[] | null;
          accepting_patients?: boolean | null;
          suspended?: boolean | null;
          suspended_at?: string | null;
          suspended_reason?: string | null;
          consultation_fee_cents?: number | null;
          rating?: number | null;
          total_reviews?: number | null;
        };
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string | null;
          provider_id: string | null;
          medication_name: string;
          dosage: string;
          frequency: string;
          instructions: string | null;
          status: string | null;
          refills_remaining: number | null;
          prescribed_at: string | null;
          expires_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          medication_name: string;
          dosage: string;
          frequency: string;
          instructions?: string | null;
          status?: string | null;
          refills_remaining?: number | null;
          prescribed_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          medication_name?: string;
          dosage?: string;
          frequency?: string;
          instructions?: string | null;
          status?: string | null;
          refills_remaining?: number | null;
          prescribed_at?: string | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      lab_results: {
        Row: {
          id: string;
          patient_id: string | null;
          provider_id: string | null;
          panel_name: string;
          status: string | null;
          summary: string | null;
          markers: unknown;
          ordered_at: string | null;
          resulted_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          panel_name: string;
          status?: string | null;
          summary?: string | null;
          markers?: unknown;
          ordered_at?: string | null;
          resulted_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          panel_name?: string;
          status?: string | null;
          summary?: string | null;
          markers?: unknown;
          ordered_at?: string | null;
          resulted_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      symptom_logs: {
        Row: {
          id: string;
          patient_id: string | null;
          logged_at: string | null;
          symptoms: unknown;
          mood: number | null;
          energy: number | null;
          pain_level: number | null;
          sleep_hours: number | null;
          notes: string | null;
          ai_insight: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          logged_at?: string | null;
          symptoms?: unknown;
          mood?: number | null;
          energy?: number | null;
          pain_level?: number | null;
          sleep_hours?: number | null;
          notes?: string | null;
          ai_insight?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          logged_at?: string | null;
          symptoms?: unknown;
          mood?: number | null;
          energy?: number | null;
          pain_level?: number | null;
          sleep_hours?: number | null;
          notes?: string | null;
          ai_insight?: string | null;
        };
        Relationships: [];
      };      support_group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      insurance_claims: {
        Row: {
          id: string;
          patient_id: string;
          provider_id: string | null;
          service_name: string;
          amount_cents: number | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          provider_id?: string | null;
          service_name: string;
          amount_cents?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          provider_id?: string | null;
          service_name?: string;
          amount_cents?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      wellness_assessments: {
        Row: {
          id: string;
          patient_id: string;
          assessment_type: string;
          answers: unknown;
          score: number | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          assessment_type: string;
          answers?: unknown;
          score?: number | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          assessment_type?: string;
          answers?: unknown;
          score?: number | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };      support_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          moderator_id: string | null;
          active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          moderator_id?: string | null;
          active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          moderator_id?: string | null;
          active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let adminClient: ReturnType<typeof createClient<AdminDatabase>> | undefined;

export function getSupabaseAdminClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!adminClient) {
    adminClient = createClient<AdminDatabase>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}





