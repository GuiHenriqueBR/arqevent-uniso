import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
} from "class-validator";

export enum TurnoEvento {
  TODOS = "TODOS",
  MANHA = "MANHA",
  NOITE = "NOITE",
}

export enum StatusEventoManual {
  AUTO = "AUTO",
  ABERTO = "ABERTO",
  ENCERRADO = "ENCERRADO",
  AO_VIVO = "AO_VIVO",
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
  @IsArray()
  @IsString({ each: true })
  banner_galeria?: string[];

  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @IsEnum(StatusEventoManual)
  status_manual?: StatusEventoManual;

  @IsOptional()
  @IsString()
  cta_label?: string;

  @IsOptional()
  @IsString()
  cta_sec_label?: string;

  @IsOptional()
  @IsString()
  cta_sec_url?: string;

  @IsOptional()
  @IsString()
  compartilhar_url?: string;

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
  @IsArray()
  @IsString({ each: true })
  banner_galeria?: string[];

  @IsOptional()
  @IsBoolean()
  destaque?: boolean;

  @IsOptional()
  @IsEnum(StatusEventoManual)
  status_manual?: StatusEventoManual;

  @IsOptional()
  @IsString()
  cta_label?: string;

  @IsOptional()
  @IsString()
  cta_sec_label?: string;

  @IsOptional()
  @IsString()
  cta_sec_url?: string;

  @IsOptional()
  @IsString()
  compartilhar_url?: string;

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
