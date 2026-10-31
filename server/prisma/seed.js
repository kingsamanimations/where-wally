import { prisma } from "../lib/prisma.js";
// Seeding characters using x and y
const characters = [
    { name: "Wally", x: 0.48, y: 0.51 },
    { name: "Wenda", x: 0.67, y: 0.13 },
    // { name: "Odlaw", x: 0.85, y: 0.33 },
];

for (const c of characters) {
    await prisma.character.upsert({ where: { name: c.name }, update: c, create: c});
}
await prisma.$disconnect();
console.log("Seeded");

