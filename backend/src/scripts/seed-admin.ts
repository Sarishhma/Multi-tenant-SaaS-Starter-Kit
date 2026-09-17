import { prisma } from "../lib/prisma.js";

async function seedAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx src/scripts/seed-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    console.error("Make sure you've registered and verified this account first.");
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ ${updated.email} is now an ADMIN`);
  process.exit(0);
}

seedAdmin();