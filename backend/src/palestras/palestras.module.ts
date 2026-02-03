import { Module } from "@nestjs/common";
import { PalestrasService } from "./palestras.service";
import { PalestrasController } from "./palestras.controller";

@Module({
  controllers: [PalestrasController],
  providers: [PalestrasService],
  exports: [PalestrasService],
})
export class PalestrasModule {}
