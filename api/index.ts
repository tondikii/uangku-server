import { ValidationPipe, HttpStatus, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Express, Request, Response } from 'express';

const expressApp: Express = express();
let app: INestApplication | null = null;

async function getApp(): Promise<INestApplication> {
  if (app) return app;

  app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    origin: 'https://uangku-959df.web.app', // Specific origin is safer than '*'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    }),
  );

  await app.init();
  console.log('NestJS application initialized');

  return app;
}

export default async (req: Request, res: Response) => {
  // Vercel pre-parses the body, mark request as already having body parsed
  if (req.body !== undefined) {
    (req as any)._body = true;
  }

  await getApp();
  return expressApp(req, res);
};
