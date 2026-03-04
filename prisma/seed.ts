import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎲 Seeding Billy-Match database...");

  // Crea stagione attiva
  const season = await prisma.season.upsert({
    where: { id: "season-1" },
    update: {},
    create: {
      id: "season-1",
      name: "Stagione 1 - La Genesi",
      isActive: true,
    },
  });
  console.log("✅ Stagione creata:", season.name);

  // Crea squadre
  const cantalpo = await prisma.team.upsert({
    where: { slug: "cantalpo-cantalupo" },
    update: {},
    create: {
      name: "CANTALPÒ CANTALUPO",
      slug: "cantalpo-cantalupo",
    },
  });

  const losPelatos = await prisma.team.upsert({
    where: { slug: "los-pelatos" },
    update: {},
    create: {
      name: "LOS PELATOS",
      slug: "los-pelatos",
    },
  });
  console.log("✅ Squadre create:", cantalpo.name, "&", losPelatos.name);

  // Crea giocatori Cantalpò Cantalupo
  await prisma.player.deleteMany({ where: { teamId: cantalpo.id } });
  await prisma.player.createMany({
    data: [
      { name: "RINOGHEN", teamId: cantalpo.id },
      { name: "LUPO", teamId: cantalpo.id },
    ],
  });

  // Crea giocatori Los Pelatos
  await prisma.player.deleteMany({ where: { teamId: losPelatos.id } });
  await prisma.player.createMany({
    data: [
      { name: "VALDES", nickname: "MINO", teamId: losPelatos.id },
      { name: "MAZZA IL CODONE DI STOP", teamId: losPelatos.id },
    ],
  });
  console.log("✅ 4 giocatori creati");

  console.log("🏁 Seed completato! Il ferro è caldo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
