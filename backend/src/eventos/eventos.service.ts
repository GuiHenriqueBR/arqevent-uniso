import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventoDto, UpdateEventoDto } from "./dto/evento.dto";

@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}

  async findAll(userTurno?: string) {
    const eventos = await this.prisma.evento.findMany({
      where: {
        ativo: true,
        OR: userTurno
          ? [
              { turno_permitido: "TODOS" },
              { turno_permitido: userTurno as any },
            ]
          : undefined,
      },
      include: {
        organizador: {
          select: { id: true, nome: true, email: true },
        },
        _count: {
          select: { palestras: true, inscritos: true },
        },
      },
      orderBy: { data_inicio: "asc" },
    });

    return eventos;
  }

  async findOne(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: {
        organizador: {
          select: { id: true, nome: true, email: true },
        },
        palestras: {
          include: {
            palestrante: {
              select: { id: true, nome: true },
            },
            _count: {
              select: { inscritos: true },
            },
          },
          orderBy: { data_hora_inicio: "asc" },
        },
        _count: {
          select: { inscritos: true },
        },
      },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    return evento;
  }

  async create(dto: CreateEventoDto, organizadorId: string) {
    const evento = await this.prisma.evento.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        data_inicio: new Date(dto.data_inicio),
        data_fim: new Date(dto.data_fim),
        local: dto.local,
        banner_url: dto.banner_url,
        carga_horaria_total: dto.carga_horaria_total || 0,
        turno_permitido: dto.turno_permitido || "TODOS",
        vagas_totais: dto.vagas_totais || 100,
        ativo: dto.ativo ?? true,
        organizador_id: organizadorId,
      },
    });

    return evento;
  }

  async update(
    id: string,
    dto: UpdateEventoDto,
    userId: string,
    userTipo: string,
  ) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    // Check permission
    if (userTipo !== "ADMIN" && evento.organizador_id !== userId) {
      throw new ForbiddenException("Sem permissão para editar este evento");
    }

    return this.prisma.evento.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        data_inicio: dto.data_inicio ? new Date(dto.data_inicio) : undefined,
        data_fim: dto.data_fim ? new Date(dto.data_fim) : undefined,
        local: dto.local,
        banner_url: dto.banner_url,
        carga_horaria_total: dto.carga_horaria_total,
        turno_permitido: dto.turno_permitido,
        vagas_totais: dto.vagas_totais,
        ativo: dto.ativo,
      },
    });
  }

  async delete(id: string, userId: string, userTipo: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    if (userTipo !== "ADMIN" && evento.organizador_id !== userId) {
      throw new ForbiddenException("Sem permissão para excluir este evento");
    }

    await this.prisma.evento.delete({ where: { id } });

    return { message: "Evento excluído com sucesso" };
  }

  async getInscritos(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    return this.prisma.inscricaoEvento.findMany({
      where: { evento_id: eventoId },
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
      orderBy: { data_inscricao: "desc" },
    });
  }
}
