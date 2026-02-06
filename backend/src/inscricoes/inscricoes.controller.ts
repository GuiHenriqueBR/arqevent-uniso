import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { InscricoesService } from "./inscricoes.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller()
@UseGuards(JwtAuthGuard)
export class InscricoesController {
  constructor(private inscricoesService: InscricoesService) {}

  // Rate limit mais restrito para inscrições: 10 por minuto
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("eventos/:id/inscricao")
  async inscreverEvento(
    @Param("id") eventoId: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.inscricoesService.inscreverEvento(usuarioId, eventoId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete("eventos/:id/inscricao")
  async cancelarInscricaoEvento(
    @Param("id") eventoId: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.inscricoesService.cancelarInscricaoEvento(usuarioId, eventoId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("palestras/:id/inscricao")
  async inscreverPalestra(
    @Param("id") palestraId: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.inscricoesService.inscreverPalestra(usuarioId, palestraId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete("palestras/:id/inscricao")
  async cancelarInscricaoPalestra(
    @Param("id") palestraId: string,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.inscricoesService.cancelarInscricaoPalestra(
      usuarioId,
      palestraId,
    );
  }

  @Get("minhas-inscricoes")
  async getMinhasInscricoes(@CurrentUser("id") usuarioId: string) {
    return this.inscricoesService.getMinhasInscricoes(usuarioId);
  }
}
