import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if RA or email already exists
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ ra: dto.ra }, { email: dto.email }],
      },
    });

    if (existingUser) {
      if (existingUser.ra === dto.ra) {
        throw new ConflictException("RA já cadastrado");
      }
      throw new ConflictException("Email já cadastrado");
    }

    // Hash password
    const senha_hash = await bcrypt.hash(dto.senha, 10);

    // Create user
    const user = await this.prisma.usuario.create({
      data: {
        ra: dto.ra,
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        senha_hash,
        semestre: dto.semestre,
        turno: dto.turno,
        tipo: "ALUNO", // Default type
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        ra: user.ra,
        nome: user.nome,
        email: user.email,
        turno: user.turno,
        tipo: user.tipo,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user by RA or email
    const user = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ ra: dto.login }, { email: dto.login }],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    if (!user.ativo) {
      throw new UnauthorizedException("Usuário inativo");
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.senha, user.senha_hash);

    if (!passwordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        ra: user.ra,
        nome: user.nome,
        email: user.email,
        turno: user.turno,
        tipo: user.tipo,
        semestre: user.semestre,
      },
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        ra: true,
        nome: true,
        email: true,
        telefone: true,
        semestre: true,
        turno: true,
        tipo: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    return user;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: "1d",
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const tokens = await this.generateTokens(payload.sub, payload.email);
      return tokens;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
  }
}
