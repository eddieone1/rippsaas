import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_TENANT_ID = "demo-tenant";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: DEMO_TENANT_ID },
    create: { id: DEMO_TENANT_ID, name: "Demo Gym", timezone: "Europe/London" },
    update: {},
  });

  const memberCount = await prisma.member.count({ where: { tenantId: tenant.id } });
  if (memberCount === 0) {
    const names = [
      { first: "Alex", last: "Smith" },
      { first: "Jordan", last: "Lee" },
      { first: "Sam", last: "Taylor" },
      { first: "Casey", last: "Brown" },
      { first: "Riley", last: "Jones" },
      { first: "Morgan", last: "Davis" },
      { first: "Jamie", last: "Wilson" },
      { first: "Quinn", last: "Martinez" },
      { first: "Drew", last: "Anderson" },
      { first: "Blake", last: "Thomas" },
    ];
    for (let i = 0; i < names.length; i++) {
      const m = await prisma.member.create({
        data: {
          tenantId: tenant.id,
          firstName: names[i].first,
          lastName: names[i].last,
          email: `demo${i + 1}@example.com`,
          phone: i % 2 === 0 ? `+4477009000${i}` : null,
          consentEmail: true,
          consentSms: i % 2 === 0,
          consentWhatsapp: i % 3 === 0,
          doNotContact: false,
        },
      });
      const riskScore = 30 + Math.floor(Math.random() * 65);
      const reasons = ["Attendance drop", "No bookings", "Payment friction", "Plateau"];
      await prisma.riskSnapshot.create({
        data: {
          tenantId: tenant.id,
          memberId: m.id,
          riskScore,
          primaryRiskReason: reasons[i % reasons.length],
          computedAt: new Date(),
        },
      });
    }
    console.log("Created 10 demo members and risk snapshots");
  }

  const playCount = await prisma.play.count({ where: { tenantId: tenant.id } });
  if (playCount === 0) {
    await prisma.play.create({
      data: {
        tenantId: tenant.id,
        name: "14-day no visit",
        description: "SMS nudge when member has not visited in 14 days",
        isActive: true,
        triggerType: "DAILY_BATCH",
        minRiskScore: 50,
        channels: ["SMS"],
        requiresApproval: true,
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
        maxMessagesPerMemberPerWeek: 2,
        cooldownDays: 3,
        templateSubject: null,
        templateBody: "Hi {{firstName}}, we miss you! It's been a while since your last visit. Reply if you'd like to book a session.",
      },
    });
    await prisma.play.create({
      data: {
        tenantId: tenant.id,
        name: "Payment friction",
        description: "Email when risk reason is payment-related",
        isActive: true,
        triggerType: "DAILY_BATCH",
        minRiskScore: 60,
        channels: ["EMAIL"],
        requiresApproval: false,
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
        maxMessagesPerMemberPerWeek: 2,
        cooldownDays: 5,
        templateSubject: "We're here to help",
        templateBody: "Hi {{firstName}}, we noticed {{primaryRiskReason}}. If there's anything we can do to help, just reply to this email.",
      },
    });
    console.log("Created 2 demo plays");
  }

  console.log("Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
