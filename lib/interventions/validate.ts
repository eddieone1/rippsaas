import { z } from "zod";

const channelEnum = z.enum(["EMAIL", "SMS", "WHATSAPP"]);
const triggerTypeEnum = z.enum(["DAILY_BATCH", "EVENT_WEBHOOK"]);

export const createPlaySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional().default(true),
  triggerType: triggerTypeEnum,
  minRiskScore: z.number().int().min(0).max(100),
  channels: z.array(channelEnum).min(1),
  requiresApproval: z.boolean().optional().default(false),
  quietHoursStart: z.string().regex(/^\d{1,2}:\d{2}$/).optional().default("21:00"),
  quietHoursEnd: z.string().regex(/^\d{1,2}:\d{2}$/).optional().default("08:00"),
  maxMessagesPerMemberPerWeek: z.number().int().min(1).max(20).optional().default(2),
  cooldownDays: z.number().int().min(0).max(30).optional().default(3),
  templateSubject: z.string().max(500).optional().nullable(),
  templateBody: z.string().min(1).max(10000),
});

export const updatePlaySchema = createPlaySchema.partial();

export const runDailyQuerySchema = z.object({
  tenantId: z.string().min(1),
});

export const approveInterventionSchema = z.object({});
export const cancelInterventionSchema = z.object({});

export const logsQuerySchema = z.object({
  tenantId: z.string().min(1),
  memberId: z.string().optional(),
  channel: channelEnum.optional(),
  status: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type CreatePlayInput = z.infer<typeof createPlaySchema>;
export type UpdatePlayInput = z.infer<typeof updatePlaySchema>;
export type RunDailyQuery = z.infer<typeof runDailyQuerySchema>;
export type LogsQuery = z.infer<typeof logsQuerySchema>;
