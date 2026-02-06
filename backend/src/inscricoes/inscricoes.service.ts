import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InscricoesService {
  constructor(private prisma: PrismaService) {}

  async inscreverEvento(usuarioId: string, eventoId: string) {
    // OTIMIZAÇÃO: Usar transação para evitar overbooking por race condition
    return this.prisma.$transaction(
      async (tx) => {
        // Check if evento exists and is active
        const evento = await tx.evento.findUnique({
          where: { id: eventoId },
          include: {
            _count: { select: { inscritos: true } },
          },
        });

        if (!evento) {
          throw new NotFoundException("Evento não encontrado");
        }

        if (!evento.ativo) {
          throw new BadRequestException("Este evento não está mais ativo");
        }

        // Check vagas
        if (evento._count.inscritos >= evento.vagas_totais) {
          throw new BadRequestException("Não há mais vagas disponíveis");
        }

        // Check turno permission
        const usuario = await tx.usuario.findUnique({
          where: { id: usuarioId },
        });

        if (
          evento.turno_permitido !== "TODOS" &&
          evento.turno_permitido !== usuario.turno
        ) {
          throw new BadRequestException(
            `Este evento é exclusivo para o turno ${evento.turno_permitido}`,
          );
        }

        // Check if already inscribed
        const existingInscricao = await tx.inscricaoEvento.findUnique({
          where: {
            usuario_id_evento_id: {
              usuario_id: usuarioId,
              evento_id: eventoId,
            },
          },
        });

        if (existingInscricao) {
          throw new ConflictException("Você já está inscrito neste evento");
        }

        return tx.inscricaoEvento.create({
          data: {
            usuario_id: usuarioId,
            evento_id: eventoId,
            status: "CONFIRMADA",
          },
          include: {
            evento: {
              select: {
                id: true,
                titulo: true,
                data_inicio: true,
                data_fim: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: "Serializable", // Garantir que não haja overbooking
        timeout: 10000, // 10 segundos de timeout
      },
    );
  }

  async cancelarInscricaoEvento(usuarioId: string, eventoId: string) {
    const inscricao = await this.prisma.inscricaoEvento.findUnique({
      where: {
        usuario_id_evento_id: { usuario_id: usuarioId, evento_id: eventoId },
      },
    });

    if (!inscricao) {
      throw new NotFoundException("Inscrição não encontrada");
    }

    await this.prisma.inscricaoEvento.delete({
      where: { id: inscricao.id },
    });

    // Also remove all lecture inscriptions for this event
    await this.prisma.inscricaoPalestra.deleteMany({
      where: {
        usuario_id: usuarioId,
        palestra: { evento_id: eventoId },
      },
    });

    return { message: "Inscrição cancelada com sucesso" };
  }

  async inscreverPalestra(usuarioId: string, palestraId: string) {
    // Check if palestra exists
    const palestra = await this.prisma.palestra.findUnique({
      where: { id: palestraId },
      include: {
        evento: true,
        _count: { select: { inscritos: true } },
      },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    // Check if user is inscribed in the evento
    const inscricaoEvento = await this.prisma.inscricaoEvento.findUnique({
      where: {
        usuario_id_evento_id: {
          usuario_id: usuarioId,
          evento_id: palestra.evento_id,
        },
      },
    });

    if (!inscricaoEvento) {
      throw new BadRequestException(
        "Você precisa estar inscrito no evento para se inscrever nesta palestra",
      );
    }

    // Check vagas
    if (palestra._count.inscritos >= palestra.vagas) {
      throw new BadRequestException(
        "Não há mais vagas disponíveis nesta palestra",
      );
    }

    // Check if already inscribed
    const existingInscricao = await this.prisma.inscricaoPalestra.findUnique({
      where: {
        usuario_id_palestra_id: {
          usuario_id: usuarioId,
          palestra_id: palestraId,
        },
      },
    });

    if (existingInscricao) {
      throw new ConflictException("Você já está inscrito nesta palestra");
    }

    return this.prisma.inscricaoPalestra.create({
      data: {
        usuario_id: usuarioId,
        palestra_id: palestraId,
      },
      include: {
        palestra: {
          select: {
            id: true,
            titulo: true,
            data_hora_inicio: true,
            sala: true,
          },
        },
      },
    });
  }

  async cancelarInscricaoPalestra(usuarioId: string, palestraId: string) {
    const inscricao = await this.prisma.inscricaoPalestra.findUnique({
      where: {
        usuario_id_palestra_id: {
          usuario_id: usuarioId,
          palestra_id: palestraId,
        },
      },
    });

    if (!inscricao) {
      throw new NotFoundException("Inscrição não encontrada");
    }

    await this.prisma.inscricaoPalestra.delete({
      where: { id: inscricao.id },
    });

    return { message: "Inscrição cancelada com sucesso" };
  }

  async getMinhasInscricoes(usuarioId: string) {
    const inscricoesEventos = await this.prisma.inscricaoEvento.findMany({
      where: { usuario_id: usuarioId },
      include: {
        evento: {
          include: {
            palestras: {
              orderBy: { data_hora_inicio: "asc" },
            },
          },
        },
      },
      orderBy: { data_inscricao: "desc" },
    });

    const inscricoesPalestras = await this.prisma.inscricaoPalestra.findMany({
      where: { usuario_id: usuarioId },
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

    return {
      eventos: inscricoesEventos,
      palestras: inscricoesPalestras,
    };
  }
}
