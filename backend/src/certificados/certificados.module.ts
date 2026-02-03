import { Module } from "@nestjs/common";
import { CertificadosService } from "./certificados.service";
import { CertificadosController } from "./certificados.controller";

@Module({
  controllers: [CertificadosController],
  providers: [CertificadosService],
  exports: [CertificadosService],
})
export class CertificadosModule {}
