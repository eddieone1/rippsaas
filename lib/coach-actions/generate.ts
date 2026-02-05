/**
 * Coach Action Generation Logic
 * 
 * Generates daily actions for coaches based on their assigned members.
 * Simple rule-based system - no ML, just clear rules.
 */

import type { ExternalMember } from '@/lib/integrations/base-adapter';

interface MemberForActionGeneration {
  id: string;
  first_name: string;
  last_name: string;
  churn_risk_level: string;
  churn_risk_score: number;
  last_visit_date: string | null;
  commitment_score: number | null;
  daysSinceLastVisit: number | null;
}

interface CoachAction {
  memberId: string;
  actionType: 'contact_member' | 'send_campaign' | 'check_in' | 'follow_up' | 'investigate_issue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // ISO date string
}

/**
 * Generate daily actions for a coach based on assigned members
 */
export function generateCoachActions(
  members: MemberForActionGeneration[],
  dueDate: string = new Date().toISOString().split('T')[0]
): CoachAction[] {
  const actions: CoachAction[] = [];

  for (const member of members) {
    // Determine action based on priority (highest priority first)
    // Only one action per member per day
    
    // Priority 1: High risk + no recent contact = urgent contact
    if (member.churn_risk_level === 'high' && member.daysSinceLastVisit !== null && member.daysSinceLastVisit > 14) {
      actions.push({
        memberId: member.id,
        actionType: 'contact_member',
        title: `Contact ${member.first_name} ${member.last_name}`,
        description: `High risk member (${member.churn_risk_score}/100). No visit in ${member.daysSinceLastVisit} days. Personal outreach needed.`,
        priority: 'high',
        dueDate,
      });
      continue; // One action per member per day
    }

    // Priority 2: Medium risk + declining = send campaign
    if (member.churn_risk_level === 'medium' && member.commitment_score !== null && member.commitment_score < 50) {
      actions.push({
        memberId: member.id,
        actionType: 'send_campaign',
        title: `Send engagement campaign to ${member.first_name}`,
        description: `Medium risk member with low commitment score (${member.commitment_score}/100). Send reengagement campaign.`,
        priority: 'medium',
        dueDate,
      });
      continue;
    }

    // Priority 3: No visit in 7+ days = check in
    if (member.daysSinceLastVisit !== null && member.daysSinceLastVisit >= 7 && member.daysSinceLastVisit < 14) {
      actions.push({
        memberId: member.id,
        actionType: 'check_in',
        title: `Check in with ${member.first_name}`,
        description: `Member hasn't visited in ${member.daysSinceLastVisit} days. Quick check-in to understand barriers.`,
        priority: 'medium',
        dueDate,
      });
      continue;
    }

    // Priority 4: Low commitment score = investigate
    if (member.commitment_score !== null && member.commitment_score < 40) {
      actions.push({
        memberId: member.id,
        actionType: 'investigate_issue',
        title: `Investigate engagement issues for ${member.first_name}`,
        description: `Low commitment score (${member.commitment_score}/100). Review visit patterns and identify barriers.`,
        priority: 'medium',
        dueDate,
      });
      continue;
    }

    // Priority 5: Default: follow up on at-risk members
    if (member.churn_risk_level === 'medium' || member.churn_risk_level === 'high') {
      actions.push({
        memberId: member.id,
        actionType: 'follow_up',
        title: `Follow up with ${member.first_name}`,
        description: `At risk member (${member.churn_risk_level} risk). Regular follow up to maintain engagement.`,
        priority: 'low',
        dueDate,
      });
    }
  }

  // Sort by priority (high first), then by risk score
  actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    // Secondary sort by member risk (find member for comparison)
    const memberA = members.find((m) => m.id === a.memberId);
    const memberB = members.find((m) => m.id === b.memberId);
    return (memberB?.churn_risk_score || 0) - (memberA?.churn_risk_score || 0);
  });

  return actions;
}

/**
 * Get action type display info
 */
export function getActionTypeInfo(actionType: string) {
  const info: Record<string, { label: string; icon: string; color: string }> = {
    contact_member: {
      label: 'Contact Member',
      icon: '📞',
      color: 'bg-red-100 text-red-800',
    },
    send_campaign: {
      label: 'Send Campaign',
      icon: '📧',
      color: 'bg-blue-100 text-blue-800',
    },
    check_in: {
      label: 'Check In',
      icon: '👋',
      color: 'bg-yellow-100 text-yellow-800',
    },
    follow_up: {
      label: 'Follow Up',
      icon: '🔄',
      color: 'bg-gray-100 text-gray-800',
    },
    investigate_issue: {
      label: 'Investigate',
      icon: '🔍',
      color: 'bg-purple-100 text-purple-800',
    },
  };

  return info[actionType] || {
    label: actionType,
    icon: '•',
    color: 'bg-gray-100 text-gray-800',
  };
}
