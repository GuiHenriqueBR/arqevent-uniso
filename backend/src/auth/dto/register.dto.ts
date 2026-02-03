import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum Turno {
  MANHA = "MANHA",
  NOITE = "NOITE",
}

export class RegisterDto {
  @IsNotEmpty({ message: "O RA é obrigatório" })
  @IsString()
  ra: string;

  @IsNotEmpty({ message: "O nome é obrigatório" })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: "O email é obrigatório" })
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsNotEmpty({ message: "A senha é obrigatória" })
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres" })
  senha: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsNotEmpty({ message: "O turno é obrigatório" })
  @IsEnum(Turno, { message: "Turno deve ser MANHA ou NOITE" })
  turno: Turno;
}
