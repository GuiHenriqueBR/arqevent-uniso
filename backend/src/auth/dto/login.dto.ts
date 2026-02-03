import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsNotEmpty({ message: "O RA ou email é obrigatório" })
  @IsString()
  login: string; // RA ou email

  @IsNotEmpty({ message: "A senha é obrigatória" })
  @IsString()
  senha: string;
}
