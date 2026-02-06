import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as compression from "compression";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança: Headers HTTP
  app.use(helmet());

  // Performance: Compressão gzip/deflate
  app.use(compression());

  // CORS restrito para domínios conhecidos
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://arqevent-uniso.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
