import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import { CertificadosService } from "./certificados.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("certificados")
@UseGuards(JwtAuthGuard)
export class CertificadosController {
  constructor(private certificadosService: CertificadosService) {}

  @Get()
  async getMeusCertificados(@CurrentUser("id") usuarioId: string) {
    return this.certificadosService.getMeusCertificados(usuarioId);
  }

  @Get(":id")
  async getCertificado(
    @Param("id") id: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.certificadosService.getCertificado(id, usuarioId);
  }

  @Get(":id/download")
  async downloadCertificado(
    @Param("id") id: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    // For now, just return certificate data
    // In production, this would generate/return a PDF
    return this.certificadosService.getCertificado(id, usuarioId);
  }

  @Public()
  @Get("verificar/:codigo")
  async verificarCertificado(@Param("codigo") codigo: string) {
    return this.certificadosService.verificarCertificado(codigo);
  }

  @Post("gerar/:eventoId")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "ORGANIZADOR")
  async gerarCertificadosEvento(@Param("eventoId") eventoId: string) {
    return this.certificadosService.gerarCertificadosEvento(eventoId);
  }
}
