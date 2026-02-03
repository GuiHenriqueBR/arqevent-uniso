import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { PalestrasService } from "./palestras.service";
import { CreatePalestraDto, UpdatePalestraDto } from "./dto/palestra.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PalestrasController {
  constructor(private palestrasService: PalestrasService) {}

  @Public()
  @Get("eventos/:eventoId/palestras")
  async findByEvento(@Param("eventoId") eventoId: string) {
    return this.palestrasService.findByEvento(eventoId);
  }

  @Public()
  @Get("palestras/:id")
  async findOne(@Param("id") id: string) {
    return this.palestrasService.findOne(id);
  }

  @Post("eventos/:eventoId/palestras")
  @Roles("ADMIN", "ORGANIZADOR")
  async create(
    @Param("eventoId") eventoId: string,
    @Body() dto: CreatePalestraDto,
  ) {
    return this.palestrasService.create(eventoId, dto);
  }

  @Put("palestras/:id")
  @Roles("ADMIN", "ORGANIZADOR")
  async update(@Param("id") id: string, @Body() dto: UpdatePalestraDto) {
    return this.palestrasService.update(id, dto);
  }

  @Delete("palestras/:id")
  @Roles("ADMIN", "ORGANIZADOR")
  async delete(@Param("id") id: string) {
    return this.palestrasService.delete(id);
  }

  @Get("palestras/:id/qrcode")
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async getQrCode(@Param("id") id: string) {
    return this.palestrasService.getQrCode(id);
  }

  @Post("palestras/:id/qrcode/regenerate")
  @Roles("ADMIN", "ORGANIZADOR")
  async regenerateQrCode(@Param("id") id: string) {
    return this.palestrasService.regenerateQrCode(id);
  }

  @Get("palestras/:id/inscritos")
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async getInscritos(@Param("id") id: string) {
    return this.palestrasService.getInscritos(id);
  }
}
