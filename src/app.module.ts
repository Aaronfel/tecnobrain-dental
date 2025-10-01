import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { VisitsModule } from './visits/visits.module';
import { JwtAuthGuard } from './users/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    VisitsModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
