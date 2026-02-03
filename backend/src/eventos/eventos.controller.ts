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
import { EventosService } from "./eventos.service";
import { CreateEventoDto, UpdateEventoDto } from "./dto/evento.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("eventos")
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventosController {
  constructor(private eventosService: EventosService) {}

  @Public()
  @Get()
  async findAll() {
    return this.eventosService.findAll();
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.eventosService.findOne(id);
  }

  @Post()
  @Roles("ADMIN", "ORGANIZADOR")
  async create(
    @Body() dto: CreateEventoDto,
    @CurrentUser("id") userId: string,
  ) {
    return this.eventosService.create(dto, userId);
  }

  @Put(":id")
  @Roles("ADMIN", "ORGANIZADOR")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateEventoDto,
    @CurrentUser("id") userId: string,
    @CurrentUser("tipo") userTipo: string,
  ) {
    return this.eventosService.update(id, dto, userId, userTipo);
  }

  @Delete(":id")
  @Roles("ADMIN", "ORGANIZADOR")
  async delete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("tipo") userTipo: string,
  ) {
    return this.eventosService.delete(id, userId, userTipo);
  }

  @Get(":id/inscritos")
  @Roles("ADMIN", "ORGANIZADOR", "PALESTRANTE")
  async getInscritos(@Param("id") id: string) {
    return this.eventosService.getInscritos(id);
  }
}
