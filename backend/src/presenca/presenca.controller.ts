import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { PresencaService } from "./presenca.service";
import { ValidarPresencaDto, UpdatePresencaDto } from "./dto/presenca.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("presenca")
@UseGuards(JwtAuthGuard)
export class PresencaController {
  constructor(private presencaService: PresencaService) {}

  @Post("validar")
  async validarQrCode(
    @Body() dto: ValidarPresencaDto,
    @CurrentUser("id") usuarioId: string,
  ) {
    return this.presencaService.validarQrCode(usuarioId, dto);
  }

  @Get("palestra/:id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async getPresencasPalestra(@Param("id") palestraId: string) {
    return this.presencaService.getPresencasPalestra(palestraId);
  }

  @Put(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async updatePresenca(
    @Param("id") inscricaoId: string,
    @Body() dto: UpdatePresencaDto,
    @CurrentUser("id") validadorId: string,
  ) {
    return this.presencaService.updatePresenca(inscricaoId, dto, validadorId);
  }
}
