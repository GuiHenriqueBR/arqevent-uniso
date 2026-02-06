import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ValidationPipe } from "@nestjs/common";

import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { EventosModule } from "./eventos/eventos.module";
import { PalestrasModule } from "./palestras/palestras.module";
import { InscricoesModule } from "./inscricoes/inscricoes.module";
import { PresencaModule } from "./presenca/presenca.module";
import { CertificadosModule } from "./certificados/certificados.module";
import { RelatoriosModule } from "./relatorios/relatorios.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: 100 requisições por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requisições
      },
    ]),
    PrismaModule,
    AuthModule,
    EventosModule,
    PalestrasModule,
    InscricoesModule,
    PresencaModule,
    CertificadosModule,
    RelatoriosModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
