import { prisma } from "../src/lib/prisma.js";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- <email>");
  process.exit(1);
}

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`Made ${user.email} an admin`);
} catch (error) {
  console.error("Failed to make admin:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
