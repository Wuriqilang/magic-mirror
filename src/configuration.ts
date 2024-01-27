import { Configuration, App } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as oss from '@midwayjs/oss';
import * as orm from '@midwayjs/typeorm';
import * as cron from '@midwayjs/cron';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { ReportMiddleware } from './middleware/report.middleware';

// load .env file in process.cwd
dotenv.config();

@Configuration({
  imports: [
    koa,
    oss,
    cron,
    orm,
    validate,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware]);
    // add filter
    // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
  }
}
