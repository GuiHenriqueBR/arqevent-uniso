import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
} from "class-validator";

export enum TurnoEvento {
  TODOS = "TODOS",
  MANHA = "MANHA",
  NOITE = "NOITE",
}

export class CreateEventoDto {
  @IsNotEmpty({ message: "O título é obrigatório" })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNotEmpty({ message: "A data de início é obrigatória" })
  @IsDateString()
  data_inicio: string;

  @IsNotEmpty({ message: "A data de fim é obrigatória" })
  @IsDateString()
  data_fim: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  banner_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  carga_horaria_total?: number;

  @IsOptional()
  @IsEnum(TurnoEvento)
  turno_permitido?: TurnoEvento;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagas_totais?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateEventoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  banner_url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  carga_horaria_total?: number;

  @IsOptional()
  @IsEnum(TurnoEvento)
  turno_permitido?: TurnoEvento;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagas_totais?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
