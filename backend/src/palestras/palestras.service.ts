import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePalestraDto, UpdatePalestraDto } from "./dto/palestra.dto";
import * as crypto from "crypto";

@Injectable()
export class PalestrasService {
  constructor(private prisma: PrismaService) {}

  async findByEvento(eventoId: string) {
    return this.prisma.palestra.findMany({
      where: { evento_id: eventoId },
      include: {
        palestrante: {
          select: { id: true, nome: true, email: true },
        },
        _count: {
          select: { inscritos: true },
        },
      },
      orderBy: { data_hora_inicio: "asc" },
    });
  }

  async findOne(id: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id },
      include: {
        evento: true,
        palestrante: {
          select: { id: true, nome: true, email: true },
        },
        _count: {
          select: { inscritos: true },
        },
      },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    return palestra;
  }

  async create(eventoId: string, dto: CreatePalestraDto) {
    // Check if evento exists
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    // Generate unique QR code hash
    const qr_code_hash = crypto.randomBytes(32).toString("hex");

    const palestra = await this.prisma.palestra.create({
      data: {
        evento_id: eventoId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        data_hora_inicio: new Date(dto.data_hora_inicio),
        data_hora_fim: new Date(dto.data_hora_fim),
        sala: dto.sala,
        vagas: dto.vagas || 50,
        carga_horaria: dto.carga_horaria || 1,
        palestrante_id: dto.palestrante_id,
        qr_code_hash,
      },
    });

    // Update evento total hours
    await this.updateEventoCargaHoraria(eventoId);

    return palestra;
  }

  async update(id: string, dto: UpdatePalestraDto) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    const updated = await this.prisma.palestra.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        data_hora_inicio: dto.data_hora_inicio
          ? new Date(dto.data_hora_inicio)
          : undefined,
        data_hora_fim: dto.data_hora_fim
          ? new Date(dto.data_hora_fim)
          : undefined,
        sala: dto.sala,
        vagas: dto.vagas,
        carga_horaria: dto.carga_horaria,
        palestrante_id: dto.palestrante_id,
      },
    });

    // Update evento total hours
    await this.updateEventoCargaHoraria(palestra.evento_id);

    return updated;
  }

  async delete(id: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    await this.prisma.palestra.delete({ where: { id } });

    // Update evento total hours
    await this.updateEventoCargaHoraria(palestra.evento_id);

    return { message: "Palestra excluída com sucesso" };
  }

  async getQrCode(id: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        evento_id: true,
        qr_code_hash: true,
        data_hora_inicio: true,
        data_hora_fim: true,
      },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    // Generate QR code data
    const qrData = {
      type: "PRESENCA_PALESTRA",
      palestra_id: palestra.id,
      evento_id: palestra.evento_id,
      hash: palestra.qr_code_hash,
      valid_from: palestra.data_hora_inicio.toISOString(),
      valid_until: palestra.data_hora_fim.toISOString(),
    };

    return {
      palestra_titulo: palestra.titulo,
      qr_data: JSON.stringify(qrData),
      valid_from: palestra.data_hora_inicio,
      valid_until: palestra.data_hora_fim,
    };
  }

  async getInscritos(palestraId: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id: palestraId },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    return this.prisma.inscricaoPalestra.findMany({
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
      orderBy: { data_inscricao: "desc" },
    });
  }

  private async updateEventoCargaHoraria(eventoId: string) {
    const palestras = await this.prisma.palestra.findMany({
      where: { evento_id: eventoId },
      select: { carga_horaria: true },
    });

    const totalHoras = palestras.reduce((sum, p) => sum + p.carga_horaria, 0);

    await this.prisma.evento.update({
      where: { id: eventoId },
      data: { carga_horaria_total: totalHoras },
    });
  }

  async regenerateQrCode(id: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    const newHash = crypto.randomBytes(32).toString("hex");

    await this.prisma.palestra.update({
      where: { id },
      data: { qr_code_hash: newHash },
    });

    return this.getQrCode(id);
  }
}
