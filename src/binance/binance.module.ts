import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { BinanceWebsocketConnectorService } from './binance-websocket-connector.service';
import { BinanceController } from './binance.controller';

@Module({
  providers: [BinanceService, 
    BinanceWebsocketConnectorService
  ],
  controllers: [BinanceController]
})
export class BinanceModule {}
