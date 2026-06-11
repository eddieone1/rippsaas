export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      gyms: {
        Row: {
          id: string;
          name: string;
          owner_email: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
          sender_name: string | null;
          sender_email: string | null;
          sms_from_number: string | null;
          resend_api_key: string | null;
          twilio_account_sid: string | null;
          twilio_auth_token: string | null;
          auto_interventions_enabled: boolean;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          postcode: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          trial_reminder_7d_sent_at: string | null;
          trial_reminder_3d_sent_at: string | null;
          trial_reminder_1d_sent_at: string | null;
          plan_id: 'free_audit' | 'starter_49' | 'growth_79' | null;
          nurture_subscribe_3d_sent_at: string | null;
          nurture_subscribe_7d_sent_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          owner_email: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          sender_name?: string | null;
          sender_email?: string | null;
          sms_from_number?: string | null;
          resend_api_key?: string | null;
          twilio_account_sid?: string | null;
          twilio_auth_token?: string | null;
          auto_interventions_enabled?: boolean;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          postcode?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          trial_reminder_7d_sent_at?: string | null;
          trial_reminder_3d_sent_at?: string | null;
          trial_reminder_1d_sent_at?: string | null;
          plan_id?: 'free_audit' | 'starter_49' | 'growth_79' | null;
          nurture_subscribe_3d_sent_at?: string | null;
          nurture_subscribe_7d_sent_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          owner_email?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          sender_name?: string | null;
          sender_email?: string | null;
          sms_from_number?: string | null;
          resend_api_key?: string | null;
          twilio_account_sid?: string | null;
          twilio_auth_token?: string | null;
          auto_interventions_enabled?: boolean;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          postcode?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          trial_reminder_7d_sent_at?: string | null;
          trial_reminder_3d_sent_at?: string | null;
          trial_reminder_1d_sent_at?: string | null;
          plan_id?: 'free_audit' | 'starter_49' | 'growth_79' | null;
          nurture_subscribe_3d_sent_at?: string | null;
          nurture_subscribe_7d_sent_at?: string | null;
        };
      };
      audit_requests: {
        Row: {
          id: string;
          gym_name: string;
          contact_name: string;
          email: string;
          active_members: string;
          gym_software: string;
          created_at: string;
          nurture_day1_sent_at: string | null;
          csv_storage_path: string | null;
          csv_original_filename: string | null;
        };
        Insert: {
          id?: string;
          gym_name: string;
          contact_name: string;
          email: string;
          active_members: string;
          gym_software: string;
          created_at?: string;
          nurture_day1_sent_at?: string | null;
          csv_storage_path?: string | null;
          csv_original_filename?: string | null;
        };
        Update: {
          id?: string;
          gym_name?: string;
          contact_name?: string;
          email?: string;
          active_members?: string;
          gym_software?: string;
          created_at?: string;
          nurture_day1_sent_at?: string | null;
          csv_storage_path?: string | null;
          csv_original_filename?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          gym_id: string;
          email: string;
          full_name: string;
          role: 'owner' | 'admin' | 'coach';
          created_at: string;
          has_completed_tour?: boolean;
          onboarding_completed_at?: string | null;
        };
        Insert: {
          id: string;
          gym_id: string;
          email: string;
          full_name: string;
          role?: 'owner' | 'admin' | 'coach';
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          email?: string;
          full_name?: string;
          role?: 'owner' | 'admin' | 'coach';
          created_at?: string;
        };
      };
      members: {
        Row: {
          id: string;
          gym_id: string;
          email: string | null;
          phone: string | null;
          first_name: string;
          last_name: string;
          joined_date: string;
          last_visit_date: string | null;
          status: 'active' | 'inactive' | 'cancelled';
          churn_risk_score: number;
          churn_risk_level: 'none' | 'low' | 'medium' | 'high';
          last_risk_calculated_at: string | null;
          created_at: string;
          updated_at: string;
          date_of_birth: string | null;
          distance_from_gym_km: number | null;
          billing_address_line1: string | null;
          billing_address_line2: string | null;
          billing_city: string | null;
          billing_postcode: string | null;
          billing_country: string | null;
          latitude: number | null;
          longitude: number | null;
        };
        Insert: {
          id?: string;
          gym_id: string;
          email?: string | null;
          phone?: string | null;
          first_name: string;
          last_name: string;
          joined_date: string;
          last_visit_date?: string | null;
          status?: 'active' | 'inactive' | 'cancelled';
          churn_risk_score?: number;
          churn_risk_level?: 'none' | 'low' | 'medium' | 'high';
          last_risk_calculated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          date_of_birth?: string | null;
          distance_from_gym_km?: number | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_postcode?: string | null;
          billing_country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          id?: string;
          gym_id?: string;
          email?: string | null;
          phone?: string | null;
          first_name?: string;
          last_name?: string;
          joined_date?: string;
          last_visit_date?: string | null;
          status?: 'active' | 'inactive' | 'cancelled';
          churn_risk_score?: number;
          churn_risk_level?: 'none' | 'low' | 'medium' | 'high';
          last_risk_calculated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          date_of_birth?: string | null;
          distance_from_gym_km?: number | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_postcode?: string | null;
          billing_country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
      };
      member_activities: {
        Row: {
          id: string;
          member_id: string;
          activity_date: string;
          activity_type: 'visit' | 'check_in';
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          activity_date: string;
          activity_type: 'visit' | 'check_in';
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          activity_date?: string;
          activity_type?: 'visit' | 'check_in';
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          trigger_type: 'inactivity_threshold';
          trigger_days: number;
          channel: 'email' | 'sms';
          template_id: string;
          status: 'active' | 'paused';
          created_at: string;
          target_segment: string | null;
          include_cancelled: boolean | null;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          trigger_type: 'inactivity_threshold';
          trigger_days: number;
          channel: 'email' | 'sms';
          template_id: string;
          status?: 'active' | 'paused';
          created_at?: string;
          target_segment?: string | null;
          include_cancelled?: boolean | null;
        };
        Update: {
          id?: string;
          gym_id?: string;
          name?: string;
          trigger_type?: 'inactivity_threshold';
          trigger_days?: number;
          channel?: 'email' | 'sms';
          template_id?: string;
          status?: 'active' | 'paused';
          created_at?: string;
          target_segment?: string | null;
          include_cancelled?: boolean | null;
        };
      };
      campaign_templates: {
        Row: {
          id: string;
          gym_id: string | null;
          name: string;
          subject: string;
          body: string;
          channel: 'email' | 'sms';
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id?: string | null;
          name: string;
          subject: string;
          body: string;
          channel: 'email' | 'sms';
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string | null;
          name?: string;
          subject?: string;
          body?: string;
          channel?: 'email' | 'sms';
          created_at?: string;
        };
      };
      member_coaches: {
        Row: {
          id: string;
          member_id: string;
          coach_id: string;
          gym_id: string;
          assigned_at: string;
          assigned_by: string | null;
          saved: boolean;
        };
        Insert: {
          id?: string;
          member_id: string;
          coach_id: string;
          gym_id: string;
          assigned_at?: string;
          assigned_by?: string | null;
          saved?: boolean;
        };
        Update: {
          id?: string;
          member_id?: string;
          coach_id?: string;
          gym_id?: string;
          assigned_at?: string;
          assigned_by?: string | null;
          saved?: boolean;
        };
      };
      coach_touches: {
        Row: {
          id: string;
          member_id: string;
          coach_id: string;
          gym_id: string;
          channel: 'call' | 'sms' | 'email' | 'in_person' | 'dm' | 'play_launch' | 'auto_sms';
          type: 'coach' | 'system';
          outcome: 'replied' | 'booked' | 'no_response' | 'follow_up' | 'declined';
          notes: string | null;
          play_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          coach_id: string;
          gym_id: string;
          channel: 'call' | 'sms' | 'email' | 'in_person' | 'dm' | 'play_launch' | 'auto_sms';
          type?: 'coach' | 'system';
          outcome: 'replied' | 'booked' | 'no_response' | 'follow_up' | 'declined';
          notes?: string | null;
          play_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          coach_id?: string;
          gym_id?: string;
          channel?: 'call' | 'sms' | 'email' | 'in_person' | 'dm' | 'play_launch' | 'auto_sms';
          type?: 'coach' | 'system';
          outcome?: 'replied' | 'booked' | 'no_response' | 'follow_up' | 'declined';
          notes?: string | null;
          play_id?: string | null;
          created_at?: string;
        };
      };
      campaign_sends: {
        Row: {
          id: string;
          campaign_id: string;
          member_id: string;
          sent_at: string;
          channel: 'email' | 'sms';
          status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
          external_id: string | null;
          member_responded: boolean;
          member_re_engaged: boolean;
          member_visited_after: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          member_id: string;
          sent_at?: string;
          channel: 'email' | 'sms';
          status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
          external_id?: string | null;
          member_responded?: boolean;
          member_re_engaged?: boolean;
          member_visited_after?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          member_id?: string;
          sent_at?: string;
          channel?: 'email' | 'sms';
          status?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
          external_id?: string | null;
          member_responded?: boolean;
          member_re_engaged?: boolean;
          member_visited_after?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
