import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

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
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          token?: string;
          accepted?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          token?: string;
          accepted?: boolean | null;
          expires_at?: string | null;
          created_at?: string | null;
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
      };      appointments: {
        Row: {
          id: string;
          patient_id: string | null;
          provider_id: string | null;
          status: string | null;
          scheduled_at: string;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: string | null;
          scheduled_at: string;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          provider_id?: string | null;
          status?: string | null;
          scheduled_at?: string;
        };
        Relationships: [];
      };
      care_plans: {
        Row: {
          id: string;
          patient_id: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          patient_id?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string | null;
          status?: string | null;
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
      notifications: {
        Row: {
          id: string;
          type: string | null;
          title: string;
          created_at: string | null;
          actor_id: string | null;
        };
        Insert: {
          id?: string;
          type?: string | null;
          title: string;
          created_at?: string | null;
          actor_id?: string | null;
        };
        Update: {
          id?: string;
          type?: string | null;
          title?: string;
          created_at?: string | null;
          actor_id?: string | null;
        };
        Relationships: [];
      };      messages: {
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
          created_at?: string | null;
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
          consultation_fee_cents?: number | null;
          rating?: number | null;
          total_reviews?: number | null;
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
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!adminClient) {
    adminClient = createClient<AdminDatabase>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}