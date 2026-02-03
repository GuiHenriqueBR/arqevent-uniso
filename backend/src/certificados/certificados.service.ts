import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class CertificadosService {
  constructor(private prisma: PrismaService) {}

  async getMeusCertificados(usuarioId: string) {
    return this.prisma.certificado.findMany({
      where: { usuario_id: usuarioId },
      include: {
        palestra: {
          select: { id: true, titulo: true },
        },
        evento: {
          select: { id: true, titulo: true },
        },
      },
      orderBy: { emitido_em: "desc" },
    });
  }

  async getCertificado(id: string, usuarioId: string) {
    const certificado = await this.prisma.certificado.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            ra: true,
            email: true,
            semestre: true,
          },
        },
        palestra: {
          select: { id: true, titulo: true, data_hora_inicio: true },
        },
        evento: {
          select: { id: true, titulo: true, data_inicio: true, data_fim: true },
        },
      },
    });

    if (!certificado) {
      throw new NotFoundException("Certificado não encontrado");
    }

    // Check ownership or admin
    if (certificado.usuario_id !== usuarioId) {
      throw new BadRequestException(
        "Sem permissão para acessar este certificado",
      );
    }

    return certificado;
  }

  async verificarCertificado(codigo: string) {
    const certificado = await this.prisma.certificado.findUnique({
      where: { codigo_verificacao: codigo },
      include: {
        usuario: {
          select: { nome: true, ra: true },
        },
        palestra: {
          select: { titulo: true },
        },
        evento: {
          select: { titulo: true, data_inicio: true, data_fim: true },
        },
      },
    });

    if (!certificado) {
      return {
        valido: false,
        message: "Certificado não encontrado",
      };
    }

    return {
      valido: true,
      certificado: {
        codigo: certificado.codigo_verificacao,
        tipo: certificado.tipo,
        carga_horaria: certificado.carga_horaria,
        emitido_em: certificado.emitido_em,
        participante: certificado.usuario.nome,
        ra: certificado.usuario.ra,
        evento: certificado.evento?.titulo,
        palestra: certificado.palestra?.titulo,
      },
    };
  }

  async gerarCertificadosEvento(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: {
        palestras: true,
      },
    });

    if (!evento) {
      throw new NotFoundException("Evento não encontrado");
    }

    // Get all users who attended at least one lecture
    const presencas = await this.prisma.inscricaoPalestra.findMany({
      where: {
        palestra: { evento_id: eventoId },
        presente: true,
      },
      include: {
        usuario: true,
        palestra: true,
      },
    });

    // Group by user
    const presencasPorUsuario = new Map<
      string,
      { usuario: any; palestras: any[] }
    >();

    for (const presenca of presencas) {
      if (!presencasPorUsuario.has(presenca.usuario_id)) {
        presencasPorUsuario.set(presenca.usuario_id, {
          usuario: presenca.usuario,
          palestras: [],
        });
      }
      presencasPorUsuario
        .get(presenca.usuario_id)
        .palestras.push(presenca.palestra);
    }

    const certificadosGerados = [];
    const erros = [];

    for (const [usuarioId, data] of presencasPorUsuario) {
      try {
        // Check if certificate already exists
        const existingCert = await this.prisma.certificado.findFirst({
          where: {
            usuario_id: usuarioId,
            evento_id: eventoId,
            tipo: "PARTICIPACAO",
          },
        });

        if (existingCert) {
          continue; // Skip if already has certificate
        }

        // Calculate total hours
        const cargaHorariaTotal = data.palestras.reduce(
          (sum, p) => sum + p.carga_horaria,
          0,
        );

        // Generate unique verification code
        const codigoVerificacao = this.generateCodigoVerificacao();

        const certificado = await this.prisma.certificado.create({
          data: {
            usuario_id: usuarioId,
            evento_id: eventoId,
            codigo_verificacao: codigoVerificacao,
            carga_horaria: cargaHorariaTotal,
            tipo: "PARTICIPACAO",
          },
        });

        certificadosGerados.push({
          certificado_id: certificado.id,
          usuario: data.usuario.nome,
          carga_horaria: cargaHorariaTotal,
          palestras_assistidas: data.palestras.length,
        });
      } catch (error) {
        erros.push({
          usuario: data.usuario.nome,
          erro: error.message,
        });
      }
    }

    // Generate certificates for speakers
    for (const palestra of evento.palestras) {
      if (palestra.palestrante_id) {
        try {
          const existingCert = await this.prisma.certificado.findFirst({
            where: {
              usuario_id: palestra.palestrante_id,
              palestra_id: palestra.id,
              tipo: "PALESTRANTE",
            },
          });

          if (!existingCert) {
            const codigoVerificacao = this.generateCodigoVerificacao();

            await this.prisma.certificado.create({
              data: {
                usuario_id: palestra.palestrante_id,
                evento_id: eventoId,
                palestra_id: palestra.id,
                codigo_verificacao: codigoVerificacao,
                carga_horaria: palestra.carga_horaria,
                tipo: "PALESTRANTE",
              },
            });
          }
        } catch (error) {
          // Silent fail for speaker certificates
        }
      }
    }

    return {
      evento: evento.titulo,
      total_certificados_gerados: certificadosGerados.length,
      certificados: certificadosGerados,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  private generateCodigoVerificacao(): string {
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `CERT-${year}-${random}`;
  }
}
