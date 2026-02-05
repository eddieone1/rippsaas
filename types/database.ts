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
        };
      };
      users: {
        Row: {
          id: string;
          gym_id: string;
          email: string;
          full_name: string;
          role: 'owner' | 'admin';
          created_at: string;
        };
        Insert: {
          id: string;
          gym_id: string;
          email: string;
          full_name: string;
          role?: 'owner' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          email?: string;
          full_name?: string;
          role?: 'owner' | 'admin';
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
          target_segment: 'low' | 'medium' | 'high' | 'all';
          include_cancelled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id: string;
          name: string;
          trigger_type?: 'inactivity_threshold';
          trigger_days: number;
          channel: 'email' | 'sms';
          template_id: string;
          status?: 'active' | 'paused';
          target_segment?: 'low' | 'medium' | 'high' | 'all';
          include_cancelled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string;
          name?: string;
          trigger_type?: 'inactivity_threshold';
          trigger_days?: number;
          channel?: 'email' | 'sms';
          template_id?: string;
          target_segment?: 'low' | 'medium' | 'high' | 'all';
          include_cancelled?: boolean;
          status?: 'active' | 'paused';
          created_at?: string;
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
          template_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gym_id?: string | null;
          name: string;
          subject: string;
          body: string;
          channel: 'email' | 'sms';
          template_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gym_id?: string | null;
          name?: string;
          subject?: string;
          body?: string;
          channel?: 'email' | 'sms';
          template_key?: string | null;
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
