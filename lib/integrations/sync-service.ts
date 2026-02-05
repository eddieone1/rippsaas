/**
 * Sync Service
 * 
 * Handles syncing member data from external gym software to our database.
 * Uses adapter pattern to support multiple gym software providers.
 * 
 * This is a READ-ONLY sync - we don't write back to external systems.
 */

import type {
  GymSoftwareAdapter,
  ExternalMember,
  ExternalVisit,
  MemberSyncResult,
  SyncSummary,
} from './base-adapter';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateChurnRisk } from '@/lib/churn-risk';
import { calculateCommitmentScore } from '@/lib/commitment-score';

/**
 * Mapping table to track external member IDs
 * This allows us to update existing members instead of creating duplicates
 */
interface ExternalMemberMapping {
  externalId: string;
  memberId: string;
  source: string; // 'mindbody' | 'glofox'
}

/**
 * Sync options
 */
export interface SyncOptions {
  /** Only sync members updated since this date */
  since?: string;
  /** Dry run - don't actually save to database */
  dryRun?: boolean;
  /** Calculate risk scores after sync */
  calculateRiskScores?: boolean;
}

/**
 * Sync service that uses adapters to sync member data
 */
export class SyncService {
  private adapter: GymSoftwareAdapter;
  private gymId: string;

  constructor(adapter: GymSoftwareAdapter, gymId: string) {
    this.adapter = adapter;
    this.gymId = gymId;
  }

  /**
   * Sync all members from external system
   */
  async syncMembers(options: SyncOptions = {}): Promise<SyncSummary> {
    const summary: SyncSummary = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Test connection first
      const connected = await this.adapter.testConnection();
      if (!connected) {
        throw new Error(`Failed to connect to ${this.adapter.getName()}`);
      }

      // Fetch members from external system
      const externalMembers = await this.adapter.fetchMembers({
        since: options.since,
      });

      summary.total = externalMembers.length;

      // Process each member
      for (const externalMember of externalMembers) {
        try {
          const result = await this.syncMember(externalMember, options);
          
          if (result.action === 'created') {
            summary.created++;
          } else if (result.action === 'updated') {
            summary.updated++;
          } else {
            summary.skipped++;
          }
        } catch (error) {
          summary.failed++;
          summary.errors.push({
            externalId: externalMember.externalId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // If not dry run and risk scores enabled, calculate them
      // Note: Risk scores are calculated after visit sync for accuracy

      return summary;
    } catch (error) {
      throw new Error(
        `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync a single member
   */
  private async syncMember(
    externalMember: ExternalMember,
    options: SyncOptions
  ): Promise<MemberSyncResult> {
    const adminClient = createAdminClient();

    // Check if member already exists (by external ID mapping)
    const { data: existingMapping } = await adminClient
      .from('external_member_mappings')
      .select('member_id')
      .eq('external_id', externalMember.externalId)
      .eq('source', this.adapter.getName().toLowerCase())
      .eq('gym_id', this.gymId)
      .maybeSingle();

    const memberData = this.mapExternalMemberToInternal(externalMember);

    if (existingMapping) {
      // Update existing member
      if (options.dryRun) {
        return {
          externalId: externalMember.externalId,
          action: 'updated',
          memberId: existingMapping.member_id,
        };
      }

      const { error } = await adminClient
        .from('members')
        .update({
          ...memberData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMapping.member_id);

      if (error) {
        throw new Error(`Failed to update member: ${error.message}`);
      }

      return {
        externalId: externalMember.externalId,
        action: 'updated',
        memberId: existingMapping.member_id,
      };
    } else {
      // Create new member
      if (options.dryRun) {
        return {
          externalId: externalMember.externalId,
          action: 'created',
        };
      }

      const { data: newMember, error: insertError } = await adminClient
        .from('members')
        .insert(memberData)
        .select()
        .single();

      if (insertError || !newMember) {
        throw new Error(
          `Failed to create member: ${insertError?.message || 'Unknown error'}`
        );
      }

      // Create external ID mapping
      await adminClient.from('external_member_mappings').insert({
        gym_id: this.gymId,
        external_id: externalMember.externalId,
        member_id: newMember.id,
        source: this.adapter.getName().toLowerCase(),
      });

      return {
        externalId: externalMember.externalId,
        action: 'created',
        memberId: newMember.id,
      };
    }
  }

  /**
   * Sync visits for all members
   */
  async syncVisits(options: SyncOptions = {}): Promise<SyncSummary> {
    const summary: SyncSummary = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    try {
      const adminClient = createAdminClient();

      // Get all external member mappings
      const { data: mappings } = await adminClient
        .from('external_member_mappings')
        .select('external_id, member_id')
        .eq('gym_id', this.gymId)
        .eq('source', this.adapter.getName().toLowerCase());

      if (!mappings || mappings.length === 0) {
        return summary; // No members to sync visits for
      }

      // Fetch all visits from external system
      const externalVisits = await this.adapter.fetchAllVisits({
        since: options.since,
      });

      summary.total = externalVisits.length;

      // Create mapping of external ID to internal member ID
      const externalToInternal = new Map(
        mappings.map((m) => [m.external_id, m.member_id])
      );

      // Process each visit
      for (const externalVisit of externalVisits) {
        try {
          const memberId = externalToInternal.get(externalVisit.memberExternalId);
          if (!memberId) {
            summary.skipped++;
            continue; // Member not found, skip
          }

          // Check if visit already exists
          const { data: existingVisit } = await adminClient
            .from('member_activities')
            .select('id')
            .eq('member_id', memberId)
            .eq('activity_date', externalVisit.visitDate)
            .eq('activity_type', externalVisit.visitType === 'check_in' ? 'check_in' : 'visit')
            .maybeSingle();

          if (existingVisit) {
            summary.skipped++;
            continue;
          }

          if (options.dryRun) {
            summary.created++;
            continue;
          }

          // Insert visit
          const { error } = await adminClient.from('member_activities').insert({
            member_id: memberId,
            activity_date: externalVisit.visitDate,
            activity_type: externalVisit.visitType === 'check_in' ? 'check_in' : 'visit',
          });

          if (error) {
            throw new Error(`Failed to insert visit: ${error.message}`);
          }

          summary.created++;
        } catch (error) {
          summary.failed++;
          summary.errors.push({
            externalId: externalVisit.externalId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return summary;
    } catch (error) {
      throw new Error(
        `Visit sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Map external member format to internal format
   */
  private mapExternalMemberToInternal(externalMember: ExternalMember) {
    return {
      gym_id: this.gymId,
      first_name: externalMember.firstName,
      last_name: externalMember.lastName,
      email: externalMember.email || null,
      phone: externalMember.phone || null,
      joined_date: externalMember.joinedDate,
      last_visit_date: externalMember.lastVisitDate || null,
      status: externalMember.status === 'cancelled' ? 'cancelled' : 
              externalMember.status === 'inactive' || externalMember.status === 'suspended' 
                ? 'inactive' : 'active',
      // Risk scores will be calculated separately
      churn_risk_score: 0,
      churn_risk_level: 'none' as const,
    };
  }

  /**
   * Calculate risk scores for all members
   * This is called separately after syncing visits for accuracy
   */
  async calculateRiskScores() {
    const adminClient = createAdminClient();

    // Fetch all members for this gym
    const { data: members } = await adminClient
      .from('members')
      .select('id, joined_date, last_visit_date')
      .eq('gym_id', this.gymId);

    if (!members) return;

    // Calculate risk scores
    for (const member of members) {
      // Fetch visit count for risk calculation
      const { count: visitCount } = await adminClient
        .from('member_activities')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member.id)
        .gte('activity_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const riskResult = calculateChurnRisk({
        last_visit_date: member.last_visit_date,
        joined_date: member.joined_date,
        visits_last_30_days: visitCount || 0,
      });

      // Update member with risk score
      await adminClient
        .from('members')
        .update({
          churn_risk_score: riskResult.score,
          churn_risk_level: riskResult.level,
          last_risk_calculated_at: new Date().toISOString(),
        })
        .eq('id', member.id);
    }
  }
}
