import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ValidarPresencaDto, UpdatePresencaDto } from "./dto/presenca.dto";

@Injectable()
export class PresencaService {
  private readonly TOLERANCIA_MINUTOS = 15;

  constructor(private prisma: PrismaService) {}

  async validarQrCode(usuarioId: string, dto: ValidarPresencaDto) {
    // Find palestra by ID
    const palestra = await this.prisma.palestra.findUnique({
      where: { id: dto.palestra_id },
      include: { evento: true },
    });

    if (!palestra) {
      throw new NotFoundException("Palestra não encontrada");
    }

    // Validate QR hash
    if (palestra.qr_code_hash !== dto.qr_hash) {
      throw new BadRequestException("QR Code inválido");
    }

    // Check if user is inscribed in the palestra
    const inscricao = await this.prisma.inscricaoPalestra.findUnique({
      where: {
        usuario_id_palestra_id: {
          usuario_id: usuarioId,
          palestra_id: dto.palestra_id,
        },
      },
    });

    if (!inscricao) {
      throw new BadRequestException("Você não está inscrito nesta palestra");
    }

    // Check if already registered presence
    if (inscricao.presente) {
      throw new BadRequestException("Presença já registrada anteriormente");
    }

    // Validate time window
    const now = new Date();
    const inicio = new Date(palestra.data_hora_inicio);
    const fim = new Date(palestra.data_hora_fim);

    // Add tolerance
    inicio.setMinutes(inicio.getMinutes() - this.TOLERANCIA_MINUTOS);
    fim.setMinutes(fim.getMinutes() + this.TOLERANCIA_MINUTOS);

    if (now < inicio || now > fim) {
      throw new BadRequestException(
        `QR Code só é válido durante o horário da palestra (${this.TOLERANCIA_MINUTOS} min de tolerância)`,
      );
    }

    // Register presence
    await this.prisma.inscricaoPalestra.update({
      where: { id: inscricao.id },
      data: {
        presente: true,
        data_presenca: new Date(),
      },
    });

    return {
      success: true,
      message: "Presença registrada com sucesso!",
      palestra: {
        titulo: palestra.titulo,
        carga_horaria: palestra.carga_horaria,
      },
    };
  }

  async getPresencasPalestra(palestraId: string) {
    const palestra = await this.prisma.palestra.findUnique({
      where: { id: palestraId },
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
            semestre: true,
            turno: true,
          },
        },
      },
      orderBy: [{ presente: "desc" }, { data_presenca: "desc" }],
    });

    const total = inscricoes.length;
    const presentes = inscricoes.filter((i) => i.presente).length;

    return {
      palestra: {
        id: palestra.id,
        titulo: palestra.titulo,
      },
      estatisticas: {
        total_inscritos: total,
        presentes,
        ausentes: total - presentes,
        percentual_presenca:
          total > 0 ? Math.round((presentes / total) * 100) : 0,
      },
      inscricoes,
    };
  }

  async updatePresenca(
    inscricaoId: string,
    dto: UpdatePresencaDto,
    validadorId: string,
  ) {
    const inscricao = await this.prisma.inscricaoPalestra.findUnique({
      where: { id: inscricaoId },
    });

    if (!inscricao) {
      throw new NotFoundException("Inscrição não encontrada");
    }

    return this.prisma.inscricaoPalestra.update({
      where: { id: inscricaoId },
      data: {
        presente: dto.presente,
        data_presenca: dto.presente ? new Date() : null,
        qr_validado_por: dto.presente ? validadorId : null,
      },
    });
  }
}
