import { PrismaClient, RoleName } from "./generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// Load .env file
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { id: "seed-org-001" },
    update: {},
    create: {
      id: "seed-org-001",
      name: "Demo Shipping Company"
    }
  });

  console.log("✅ Organization created:", organization.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demoshipping.com" },
    update: {},
    create: {
      email: "admin@demoshipping.com",
      passwordHash: hashedPassword,
      name: "System Administrator",
      role: RoleName.ADMIN,
      organizationId: organization.id
    }
  });

  console.log("✅ Admin user created:", adminUser.email);

  // Create a sample vessel
  const vessel = await prisma.vessel.upsert({
    where: { imoNumber: "IMO1234567" },
    update: {},
    create: {
      name: "MV Demo Voyager",
      imoNumber: "IMO1234567",
      flag: "Panama",
      organizationId: organization.id
    }
  });

  console.log("✅ Vessel created:", vessel.name);

  // Create captain user
  const captainPassword = await bcrypt.hash("captain123", 10);

  const captainUser = await prisma.user.upsert({
    where: { email: "captain@demoshipping.com" },
    update: {},
    create: {
      email: "captain@demoshipping.com",
      passwordHash: captainPassword,
      name: "Captain John Smith",
      role: RoleName.CAPTAIN,
      organizationId: organization.id,
      assignedVesselId: vessel.id
    }
  });

  console.log("✅ Captain user created:", captainUser.email);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test credentials:");
  console.log("   Admin:   admin@demoshipping.com / admin123");
  console.log("   Captain: captain@demoshipping.com / captain123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
