/**
 * Generate Coach Actions
 * 
 * Generates coach actions based on member risk levels, commitment scores,
 * and days since last visit. Actions are categorized using the CHAMP framework.
 */

import { getChampCategoryForActionType, getChampCategoryConfig } from './champ';

export interface ActionTypeInfo {
  label: string;
  category: string;
  color: string;
  bgLight: string;
  icon: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  connect: '📞',
  help: '🤝',
  activate: '⚡',
  monitor: '👁',
  praise: '🎉',
};

/** Get display info for an action type (for UI). */
export function getActionTypeInfo(actionType: string): ActionTypeInfo {
  const categoryId = getChampCategoryForActionType(actionType);
  const config = getChampCategoryConfig(categoryId);
  const label = actionType
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return {
    label,
    category: config.label,
    color: config.color,
    bgLight: config.bgLight,
    icon: CATEGORY_ICONS[config.id] ?? '•',
  };
}

interface MemberForActionGeneration {
  id: string;
  first_name: string;
  last_name: string;
  churn_risk_level: string;
  churn_risk_score: number | null;
  last_visit_date: string | null;
  commitment_score: number | null;
  daysSinceLastVisit: number | null;
}

export interface GeneratedCoachAction {
  memberId: string;
  actionType: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

/**
 * Generate coach actions for a list of members based on their risk and engagement
 */
export function generateCoachActions(
  members: MemberForActionGeneration[],
  dueDate: string
): GeneratedCoachAction[] {
  const actions: GeneratedCoachAction[] = [];

  for (const member of members) {
    const riskLevel = member.churn_risk_level?.toLowerCase() || 'low';
    const daysSinceVisit = member.daysSinceLastVisit ?? 999;
    const commitmentScore = member.commitment_score ?? 50;
    const riskScore = member.churn_risk_score ?? 0;

    // High risk members - urgent actions
    if (riskLevel === 'high' || riskScore >= 65) {
      if (daysSinceVisit >= 30) {
        // Activate: Re-engagement campaign
        actions.push({
          memberId: member.id,
          actionType: 're-engagement-campaign',
          title: `Send re-engagement campaign`,
          description: `${member.first_name} hasn't visited in ${daysSinceVisit} days. Send targeted re-engagement campaign.`,
          priority: 'high',
          dueDate,
        });
      } else if (daysSinceVisit >= 14) {
        // Connect: Personal check-in
        actions.push({
          memberId: member.id,
          actionType: 'personal-check-in-call',
          title: `Call ${member.first_name} to check in`,
          description: `High risk member hasn't visited in ${daysSinceVisit} days. Personal connection needed.`,
          priority: 'high',
          dueDate,
        });
      } else {
        // Monitor: Track closely
        actions.push({
          memberId: member.id,
          actionType: 'monitor-commitment-trend',
          title: `Monitor ${member.first_name}'s commitment score`,
          description: `High risk member (score: ${riskScore}). Track commitment trends closely.`,
          priority: 'high',
          dueDate,
        });
      }
    }
    // Medium risk members
    else if (riskLevel === 'medium' || (riskScore >= 40 && riskScore < 65)) {
      if (daysSinceVisit >= 21) {
        // Activate: Re-engagement
        actions.push({
          memberId: member.id,
          actionType: 're-engagement-incentive',
          title: `Offer comeback incentive to ${member.first_name}`,
          description: `Member hasn't visited in ${daysSinceVisit} days. Offer incentive to return.`,
          priority: 'medium',
          dueDate,
        });
      } else if (daysSinceVisit >= 14) {
        // Connect: Check-in
        actions.push({
          memberId: member.id,
          actionType: 'check-in-message',
          title: `Send check-in message to ${member.first_name}`,
          description: `Member hasn't visited in ${daysSinceVisit} days. Send friendly check-in.`,
          priority: 'medium',
          dueDate,
        });
      } else if (commitmentScore < 40) {
        // Help: Support needed
        actions.push({
          memberId: member.id,
          actionType: 'offer-program-modification',
          title: `Offer program modification to ${member.first_name}`,
          description: `Low commitment score (${commitmentScore}). Offer support and program adjustments.`,
          priority: 'medium',
          dueDate,
        });
      }
    }
    // Low risk but needs attention
    else {
      if (daysSinceVisit >= 14 && daysSinceVisit < 21) {
        // Connect: Light touch
        actions.push({
          memberId: member.id,
          actionType: 'friendly-reminder',
          title: `Send friendly reminder to ${member.first_name}`,
          description: `Member hasn't visited in ${daysSinceVisit} days. Send gentle reminder.`,
          priority: 'low',
          dueDate,
        });
      } else if (commitmentScore < 50 && daysSinceVisit < 14) {
        // Monitor: Watch trends
        actions.push({
          memberId: member.id,
          actionType: 'review-engagement-metrics',
          title: `Review ${member.first_name}'s engagement metrics`,
          description: `Commitment score is ${commitmentScore}. Monitor for any changes.`,
          priority: 'low',
          dueDate,
        });
      }
    }

    // Additional actions based on specific conditions
    if (daysSinceVisit >= 60) {
      // Very inactive - urgent activation needed
      actions.push({
        memberId: member.id,
        actionType: 'urgent-re-engagement',
        title: `Urgent: Re-engage ${member.first_name}`,
        description: `Member hasn't visited in ${daysSinceVisit} days. Immediate action required.`,
        priority: 'high',
        dueDate,
      });
    } else if (daysSinceVisit >= 45 && daysSinceVisit < 60) {
      // Approaching critical threshold
      actions.push({
        memberId: member.id,
        actionType: 'prevent-churn-outreach',
        title: `Prevent churn: Contact ${member.first_name}`,
        description: `Member approaching 60-day threshold. Proactive outreach needed.`,
        priority: 'high',
        dueDate,
      });
    }
  }

  // Remove duplicates (same member + actionType)
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.memberId}-${action.actionType}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
