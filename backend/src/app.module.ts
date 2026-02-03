import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";
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
  ],
})
export class AppModule {}
