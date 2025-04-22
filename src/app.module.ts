import { Module } from '@nestjs/common';
import { BinanceModule } from './binance/binance.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true,}), ScheduleModule.forRoot(), BinanceModule],
})
export class AppModule {}
