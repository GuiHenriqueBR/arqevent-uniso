import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async relatorioEvento(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: {
        organizador: {
          select: { nome: true, email: true },
        },
        palestras: {
          include: {
            palestrante: {
              select: { nome: true },
            },
            _count: {
              select: { inscritos: true },
            },
          },
        },
        _count: {
          select: { inscritos: true, certificados: true },
        },
      },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    // Get presence stats per lecture
    const palestrasComPresenca = await Promise.all(
      evento.palestras.map(async (palestra) => {
        const inscricoes = await this.prisma.inscricaoPalestra.findMany({
          where: { palestra_id: palestra.id },
        });

        const presentes = inscricoes.filter((i) => i.presente).length;

        return {
          id: palestra.id,
          titulo: palestra.titulo,
          palestrante: palestra.palestrante?.nome || "Não definido",
          data_hora: palestra.data_hora_inicio,
          sala: palestra.sala,
          vagas: palestra.vagas,
          inscritos: inscricoes.length,
          presentes,
          percentual_presenca:
            inscricoes.length > 0
              ? Math.round((presentes / inscricoes.length) * 100)
              : 0,
        };
      }),
    );

    const totalPresencas = palestrasComPresenca.reduce(
      (sum, p) => sum + p.presentes,
      0,
    );
    const totalInscricoesPalestras = palestrasComPresenca.reduce(
      (sum, p) => sum + p.inscritos,
      0,
    );

    return {
      evento: {
        id: evento.id,
        titulo: evento.titulo,
        data_inicio: evento.data_inicio,
        data_fim: evento.data_fim,
        local: evento.local,
        organizador: evento.organizador?.nome,
        carga_horaria_total: evento.carga_horaria_total,
      },
      estatisticas: {
        total_inscritos_evento: evento._count.inscritos,
        total_palestras: evento.palestras.length,
        total_inscricoes_palestras: totalInscricoesPalestras,
        total_presencas: totalPresencas,
        percentual_presenca_geral:
          totalInscricoesPalestras > 0
            ? Math.round((totalPresencas / totalInscricoesPalestras) * 100)
            : 0,
        certificados_emitidos: evento._count.certificados,
      },
      palestras: palestrasComPresenca,
    };
  }

  async relatorioAluno(alunoId: string) {
    const aluno = await this.prisma.usuario.findUnique({
      where: { id: alunoId },
      select: {
        id: true,
        ra: true,
        nome: true,
        email: true,
        telefone: true,
        semestre: true,
        turno: true,
      },
    });

    if (!aluno) {
      throw new NotFoundException("Aluno não encontrado");
    }

    const inscricoesEventos = await this.prisma.inscricaoEvento.findMany({
      where: { usuario_id: alunoId },
      include: {
        evento: true,
      },
    });

    const eventosParticipados = await Promise.all(
      inscricoesEventos.map(async (inscricao) => {
        const inscricoesPalestras =
          await this.prisma.inscricaoPalestra.findMany({
            where: {
              usuario_id: alunoId,
              palestra: { evento_id: inscricao.evento_id },
            },
            include: {
              palestra: {
                include: {
                  palestrante: {
                    select: { nome: true },
                  },
                },
              },
            },
          });

        const palestras = inscricoesPalestras.map((ip) => ({
          titulo: ip.palestra.titulo,
          palestrante: ip.palestra.palestrante?.nome || "Não definido",
          inscrito: true,
          presente: ip.presente,
          data_presenca: ip.data_presenca,
          carga_horaria: ip.palestra.carga_horaria,
        }));

        const presentes = palestras.filter((p) => p.presente).length;
        const cargaCumprida = palestras
          .filter((p) => p.presente)
          .reduce((sum, p) => sum + p.carga_horaria, 0);

        return {
          evento: inscricao.evento.titulo,
          data: `${inscricao.evento.data_inicio.toLocaleDateString("pt-BR")} - ${inscricao.evento.data_fim.toLocaleDateString("pt-BR")}`,
          palestras,
          resumo: {
            total_palestras_inscritas: palestras.length,
            total_palestras_presentes: presentes,
            carga_horaria_cumprida: cargaCumprida,
          },
        };
      }),
    );

    const certificados = await this.prisma.certificado.findMany({
      where: { usuario_id: alunoId },
      include: {
        palestra: {
          select: { titulo: true },
        },
        evento: {
          select: { titulo: true },
        },
      },
    });

    const totalGeral = {
      eventos_participados: eventosParticipados.length,
      palestras_assistidas: eventosParticipados.reduce(
        (sum, e) => sum + e.resumo.total_palestras_presentes,
        0,
      ),
      carga_horaria_total: eventosParticipados.reduce(
        (sum, e) => sum + e.resumo.carga_horaria_cumprida,
        0,
      ),
      certificados_emitidos: certificados.length,
    };

    return {
      aluno,
      eventos_participados: eventosParticipados,
      certificados: certificados.map((c) => ({
        tipo: c.tipo,
        evento: c.evento?.titulo,
        palestra: c.palestra?.titulo,
        codigo: c.codigo_verificacao,
        carga_horaria: c.carga_horaria,
        emitido_em: c.emitido_em,
      })),
      total_geral: totalGeral,
    };
  }

  async relatorioPalestra(palestraId: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id: palestraId },
      include: {
        evento: {
          select: { id: true, titulo: true },
        },
        palestrante: {
          select: { nome: true, email: true },
        },
      },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    const inscricoes = await this.prisma.inscricaoPalestra.findMany({
      where: { palestra_id: palestraId },
      include: {
        usuario: {
          select: {
            id: true,
            ra: true,
            nome: true,
            email: true,
            telefone: true,
            semestre: true,
            turno: true,
          },
        },
      },
      orderBy: { data_inscricao: "asc" },
    });

    const presentes = inscricoes.filter((i) => i.presente);

    return {
      palestra: {
        id: palestra.id,
        titulo: palestra.titulo,
        evento: palestra.evento.titulo,
        palestrante: palestra.palestrante?.nome || "Não definido",
        data_hora_inicio: palestra.data_hora_inicio,
        data_hora_fim: palestra.data_hora_fim,
        sala: palestra.sala,
        vagas: palestra.vagas,
        carga_horaria: palestra.carga_horaria,
      },
      estatisticas: {
        total_inscritos: inscricoes.length,
        presentes: presentes.length,
        ausentes: inscricoes.length - presentes.length,
        percentual_presenca:
          inscricoes.length > 0
            ? Math.round((presentes.length / inscricoes.length) * 100)
            : 0,
        vagas_disponiveis: Math.max(0, palestra.vagas - inscricoes.length),
      },
      inscritos: inscricoes.map((i) => ({
        ...i.usuario,
        presente: i.presente,
        data_inscricao: i.data_inscricao,
        data_presenca: i.data_presenca,
      })),
    };
  }

  async relatorioCertificadosEvento(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    const certificados = await this.prisma.certificado.findMany({
      where: { evento_id: eventoId },
      include: {
        usuario: {
          select: {
            ra: true,
            nome: true,
            email: true,
            semestre: true,
            turno: true,
          },
        },
        palestra: {
          select: { titulo: true },
        },
      },
      orderBy: { emitido_em: "desc" },
    });

    const participacao = certificados.filter((c) => c.tipo === "PARTICIPACAO");
    const palestrantes = certificados.filter((c) => c.tipo === "PALESTRANTE");

    return {
      evento: {
        id: evento.id,
        titulo: evento.titulo,
      },
      estatisticas: {
        total_certificados: certificados.length,
        certificados_participacao: participacao.length,
        certificados_palestrante: palestrantes.length,
      },
      certificados: certificados.map((c) => ({
        codigo: c.codigo_verificacao,
        tipo: c.tipo,
        participante: c.usuario.nome,
        ra: c.usuario.ra,
        email: c.usuario.email,
        carga_horaria: c.carga_horaria,
        palestra: c.palestra?.titulo,
        emitido_em: c.emitido_em,
      })),
    };
  }

  async getDashboardStats() {
    const [
      totalEventos,
      eventosAtivos,
      totalUsuarios,
      totalPalestras,
      totalCertificados,
    ] = await Promise.all([
      this.prisma.evento.count(),
      this.prisma.evento.count({ where: { ativo: true } }),
      this.prisma.usuario.count({ where: { tipo: "ALUNO" } }),
      this.prisma.palestra.count(),
      this.prisma.certificado.count(),
    ]);

    // Get today's presence count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presencasHoje = await this.prisma.inscricaoPalestra.count({
      where: {
        presente: true,
        data_presenca: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get inscriptions by turno
    const alunosPorTurno = await this.prisma.usuario.groupBy({
      by: ["turno"],
      where: { tipo: "ALUNO" },
      _count: true,
    });

    return {
      eventos: {
        total: totalEventos,
        ativos: eventosAtivos,
      },
      usuarios: {
        total: totalUsuarios,
        por_turno: alunosPorTurno.reduce((acc, item) => {
          acc[item.turno] = item._count;
          return acc;
        }, {}),
      },
      palestras: {
        total: totalPalestras,
      },
      certificados: {
        total: totalCertificados,
      },
      presencas_hoje: presencasHoje,
    };
  }
}
