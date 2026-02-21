import type { Play, Member, RiskSnapshot, TemplateContext } from "./types";

const KNOWN_VARS = new Set([
  "firstName",
  "lastName",
  "email",
  "phone",
  "riskScore",
  "primaryRiskReason",
  "daysSinceLastVisit",
]);

/**
 * Build template context from member + risk snapshot.
 */
export function buildTemplateContext(
  member: Member,
  risk: RiskSnapshot | null,
  extra: Record<string, string | number | undefined> = {}
): TemplateContext {
  const ctx: TemplateContext = {
    firstName: member.first_name,
    lastName: member.last_name,
    email: member.email ?? undefined,
    phone: member.phone ?? undefined,
    riskScore: risk?.risk_score ?? 0,
    primaryRiskReason: risk?.primary_risk_reason ?? undefined,
    ...extra,
  };
  return ctx;
}

/**
 * Replace {{varName}} in template; unknown vars left as-is and log warning.
 */
export function renderTemplate(
  template: string,
  context: TemplateContext,
  onUnknownVar?: (v: string) => void
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (KNOWN_VARS.has(key) || key in context) {
      const v = context[key];
      return v !== undefined && v !== null ? String(v) : "";
    }
    if (onUnknownVar) onUnknownVar(key);
    return `{{${key}}}`;
  });
}

/**
 * Render play body and subject for a member/risk.
 */
export function renderPlayTemplates(
  play: Play,
  context: TemplateContext,
  onUnknownVar?: (v: string) => void
): { subject: string | null; body: string } {
  const body = renderTemplate(play.template_body, context, onUnknownVar);
  const subject = play.template_subject
    ? renderTemplate(play.template_subject, context, onUnknownVar)
    : null;
  return { subject, body };
}
