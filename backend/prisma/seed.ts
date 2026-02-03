import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@uniso.br" },
    update: {},
    create: {
      ra: "ADMIN001",
      nome: "Administrador Sistema",
      email: "admin@uniso.br",
      senha_hash: adminPassword,
      turno: "MANHA",
      tipo: "ADMIN",
    },
  });
  console.log("✅ Admin criado:", admin.email);

  // Create Organizador
  const orgPassword = await bcrypt.hash("org123", 10);
  const organizador = await prisma.usuario.upsert({
    where: { email: "organizador@uniso.br" },
    update: {},
    create: {
      ra: "ORG001",
      nome: "Coordenador Eventos",
      email: "organizador@uniso.br",
      senha_hash: orgPassword,
      turno: "MANHA",
      tipo: "ORGANIZADOR",
    },
  });
  console.log("✅ Organizador criado:", organizador.email);

  // Create Palestrante
  const palPassword = await bcrypt.hash("pal123", 10);
  const palestrante = await prisma.usuario.upsert({
    where: { email: "palestrante@uniso.br" },
    update: {},
    create: {
      ra: "PAL001",
      nome: "Dr. Carlos Arquiteto",
      email: "palestrante@uniso.br",
      senha_hash: palPassword,
      turno: "NOITE",
      tipo: "PALESTRANTE",
    },
  });
  console.log("✅ Palestrante criado:", palestrante.email);

  // Create test students
  const studentPassword = await bcrypt.hash("aluno123", 10);
  const alunos = [
    {
      ra: "123456",
      nome: "Ana Silva",
      email: "ana.silva@aluno.uniso.br",
      turno: "MANHA" as const,
      semestre: "3º",
    },
    {
      ra: "123457",
      nome: "Bruno Costa",
      email: "bruno.costa@aluno.uniso.br",
      turno: "MANHA" as const,
      semestre: "5º",
    },
    {
      ra: "123458",
      nome: "Carla Santos",
      email: "carla.santos@aluno.uniso.br",
      turno: "NOITE" as const,
      semestre: "2º",
    },
    {
      ra: "123459",
      nome: "Diego Oliveira",
      email: "diego.oliveira@aluno.uniso.br",
      turno: "NOITE" as const,
      semestre: "4º",
    },
    {
      ra: "123460",
      nome: "Elena Ferreira",
      email: "elena.ferreira@aluno.uniso.br",
      turno: "MANHA" as const,
      semestre: "6º",
    },
  ];

  for (const aluno of alunos) {
    await prisma.usuario.upsert({
      where: { email: aluno.email },
      update: {},
      create: {
        ...aluno,
        senha_hash: studentPassword,
        tipo: "ALUNO",
      },
    });
  }
  console.log("✅ Alunos criados:", alunos.length);

  // Create sample event
  const evento = await prisma.evento.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      titulo: "Semana de Arquitetura 2026",
      descricao:
        "Evento anual do curso de Arquitetura e Urbanismo com palestras, workshops e exposições.",
      data_inicio: new Date("2026-03-15"),
      data_fim: new Date("2026-03-19"),
      local: "Campus UNISO - Bloco A",
      carga_horaria_total: 20,
      turno_permitido: "TODOS",
      vagas_totais: 200,
      organizador_id: organizador.id,
    },
  });
  console.log("✅ Evento criado:", evento.titulo);

  // Create lectures
  const palestrasData = [
    {
      titulo: "Urbanismo Tático: Transformando Espaços Públicos",
      descricao:
        "Uma abordagem prática para intervenções urbanas de baixo custo e alto impacto.",
      data_hora_inicio: new Date("2026-03-15T09:00:00"),
      data_hora_fim: new Date("2026-03-15T11:00:00"),
      sala: "Auditório Principal",
      vagas: 100,
      carga_horaria: 2,
    },
    {
      titulo: "Arquitetura Sustentável e Bioclimática",
      descricao:
        "Técnicas e materiais para construções ecologicamente responsáveis.",
      data_hora_inicio: new Date("2026-03-15T14:00:00"),
      data_hora_fim: new Date("2026-03-15T16:00:00"),
      sala: "Sala 101",
      vagas: 50,
      carga_horaria: 2,
    },
    {
      titulo: "BIM na Prática: Do Projeto à Execução",
      descricao:
        "Implementação de Building Information Modeling em escritórios de arquitetura.",
      data_hora_inicio: new Date("2026-03-16T09:00:00"),
      data_hora_fim: new Date("2026-03-16T12:00:00"),
      sala: "Laboratório de Informática",
      vagas: 30,
      carga_horaria: 3,
    },
    {
      titulo: "Patrimônio Histórico e Restauração",
      descricao:
        "Desafios e técnicas na preservação do patrimônio arquitetônico brasileiro.",
      data_hora_inicio: new Date("2026-03-17T19:00:00"),
      data_hora_fim: new Date("2026-03-17T21:00:00"),
      sala: "Auditório Principal",
      vagas: 100,
      carga_horaria: 2,
    },
    {
      titulo: "Design de Interiores: Tendências 2026",
      descricao:
        "As principais tendências em design de interiores para o próximo ano.",
      data_hora_inicio: new Date("2026-03-18T14:00:00"),
      data_hora_fim: new Date("2026-03-18T16:00:00"),
      sala: "Sala 102",
      vagas: 40,
      carga_horaria: 2,
    },
  ];

  for (const palestraData of palestrasData) {
    const qr_code_hash = crypto.randomBytes(32).toString("hex");
    await prisma.palestra.create({
      data: {
        ...palestraData,
        evento_id: evento.id,
        palestrante_id: palestrante.id,
        qr_code_hash,
      },
    });
  }
  console.log("✅ Palestras criadas:", palestrasData.length);

  // Update evento carga horaria
  const totalCarga = palestrasData.reduce((sum, p) => sum + p.carga_horaria, 0);
  await prisma.evento.update({
    where: { id: evento.id },
    data: { carga_horaria_total: totalCarga },
  });

  console.log("");
  console.log("🎉 Seed concluído com sucesso!");
  console.log("");
  console.log("📋 Credenciais de teste:");
  console.log("   Admin:       admin@uniso.br / admin123");
  console.log("   Organizador: organizador@uniso.br / org123");
  console.log("   Palestrante: palestrante@uniso.br / pal123");
  console.log("   Alunos:      ana.silva@aluno.uniso.br / aluno123");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
