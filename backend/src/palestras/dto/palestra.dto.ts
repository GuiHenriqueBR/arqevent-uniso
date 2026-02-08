import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
} from "class-validator";

export class CreatePalestraDto {
  @IsNotEmpty({ message: "O título é obrigatório" })
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNotEmpty({ message: "A data/hora de início é obrigatória" })
  @IsDateString()
  data_hora_inicio: string;

  @IsNotEmpty({ message: "A data/hora de fim é obrigatória" })
  @IsDateString()
  data_hora_fim: string;

  @IsOptional()
  @IsString()
  sala?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagas?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  carga_horaria?: number;

  @IsOptional()
  @IsUUID()
  palestrante_id?: string;

  @IsOptional()
  @IsString()
  semestres_permitidos?: string;
}

export class UpdatePalestraDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsDateString()
  data_hora_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_hora_fim?: string;

  @IsOptional()
  @IsString()
  sala?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vagas?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  carga_horaria?: number;

  @IsOptional()
  @IsUUID()
  palestrante_id?: string;

  @IsOptional()
  @IsString()
  semestres_permitidos?: string;
}
