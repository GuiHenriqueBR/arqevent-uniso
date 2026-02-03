import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class ValidarPresencaDto {
  @IsNotEmpty({ message: "O hash do QR é obrigatório" })
  @IsString()
  qr_hash: string;

  @IsNotEmpty({ message: "O ID da palestra é obrigatório" })
  @IsUUID()
  palestra_id: string;
}

export class UpdatePresencaDto {
  @IsOptional()
  @IsBoolean()
  presente?: boolean;
}
