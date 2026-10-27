import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@temple.org";

  console.log(`[Seed] Seeding database... Initial admin target: ${initialAdminEmail}`);

  // 1. Seed or promote the initial admin user
  const adminUser = await prisma.user.upsert({
    where: { email: initialAdminEmail },
    update: {
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: initialAdminEmail,
      name: "Temple Administrator",
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`[Seed] Admin user verified: ${adminUser.email} (ID: ${adminUser.id}, Role: ${adminUser.role})`);

  // 2. Append-only AuditLog entry for initial admin initialization
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "ADMIN_SEED_INIT",
      entity: "User",
      entityId: adminUser.id,
      meta: {
        email: adminUser.email,
        role: adminUser.role,
        seededAt: new Date().toISOString(),
      },
      ip: "127.0.0.1",
    },
  });

  // 3. Seed an initial sample temple event
  const sampleSlug = "maha-shivaratri-celebrations";
  const existingEvent = await prisma.event.findUnique({
    where: { slug: sampleSlug },
  });

  if (!existingEvent) {
    const eventStarts = new Date();
    eventStarts.setDate(eventStarts.getDate() + 14);
    eventStarts.setHours(18, 0, 0, 0);

    const eventEnds = new Date(eventStarts);
    eventEnds.setHours(22, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        title: "Maha Shivaratri Celebrations & Puja",
        slug: sampleSlug,
        description:
          "Join us for the auspicious Maha Shivaratri evening puja, featuring Vedic chanting, Rudrabhishekam, devotional bhajans, and Mahaprasadam distribution for all devotees.",
        category: "Festival",
        venue: "Main Temple Mandapam & Sanctum",
        images: [
          "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&q=80&w=1200",
        ],
        status: EventStatus.PUBLISHED,
        createdById: adminUser.id,
        schedules: {
          create: [
            {
              startsAt: eventStarts,
              endsAt: eventEnds,
              capacity: 250,
              priceInPaise: 25100, // INR 251.00
              isBookable: true,
            },
          ],
        },
      },
    });

    console.log(`[Seed] Sample published event created: "${event.title}" (slug: ${event.slug})`);
  } else {
    console.log(`[Seed] Sample event already exists: "${existingEvent.title}"`);
  }

  console.log("[Seed] Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
