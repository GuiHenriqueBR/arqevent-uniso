import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { RelatoriosService } from "./relatorios.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("relatorios")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RelatoriosController {
  constructor(private relatoriosService: RelatoriosService) {}

  @Get("dashboard")
  @Roles("ADMIN", "ORGANIZADOR")
  async getDashboardStats() {
    return this.relatoriosService.getDashboardStats();
  }

  @Get("evento/:id")
  @Roles("ADMIN", "ORGANIZADOR")
  async relatorioEvento(@Param("id") eventoId: string) {
    return this.relatoriosService.relatorioEvento(eventoId);
  }

  @Get("aluno/:id")
  @Roles("ADMIN", "ORGANIZADOR")
  async relatorioAluno(@Param("id") alunoId: string) {
    return this.relatoriosService.relatorioAluno(alunoId);
  }

  @Get("palestra/:id")
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async relatorioPalestra(@Param("id") palestraId: string) {
    return this.relatoriosService.relatorioPalestra(palestraId);
  }

  @Get("certificados/:eventoId")
  @Roles("ADMIN", "ORGANIZADOR")
  async relatorioCertificadosEvento(@Param("eventoId") eventoId: string) {
    return this.relatoriosService.relatorioCertificadosEvento(eventoId);
  }
}
