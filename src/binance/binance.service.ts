import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { binanceApi } from '../apis/binanceApi';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as _ from 'lodash';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  constructor(private readonly configService: ConfigService) {}

  async getUrlSignature(): Promise<string> {
    const SECRET_KEY = this.configService.get('SECRET_KEY');
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY) // SECRET_KEY para gerar a assinatura
      .update(queryString)
      .digest('hex');
    return `${queryString}&signature=${signature}`;
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  async getBookMarket() {
    try {
      const { data } = await axios.get(
        // `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=4h`,
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d`,
      );

      let serializeData = data.map((e) => {
        const typeMarket = Number(e[1]) > Number(e[4]) ? 'Bearish' : 'Bullish';
        return {
          time: new Date(e[0]).toString(),
          open: Number(e[1]),
          high: Number(e[2]),
          low: Number(e[3]),
          close: Number(e[4]),
          volume: Number(e[5]),
          closeTime: new Date(e[6]).toString(),
          quoteVolume: Number(e[7]),
          trades: Number(e[8]),
          takerBuyBaseAssetVolume: Number(e[9]),
          takerBuyQuoteAssetVolume: Number(e[10]),
          typeMarket,
          variationPercent:
            ((Number(e[4]) - Number(e[1])) / Number(e[4])) * 100,
        };
      });

      //   writeFileSync('data.json', JSON.stringify(serializeData), 'utf-8');
      console.table(serializeData[serializeData.length - 1]);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getCurrentPrice(symbol:string) {
    try {
      const { data } = await binanceApi.get(`/api/v3/ticker/price?symbol=${symbol}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  // detalhes de uma conta
  async getInfoAccount() {
    try {
      const params = await this.getUrlSignature();
      const { data } = await binanceApi.get(`/api/v3/account?${params}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  async getInfoEarn() {
    try {
      const params = await this.getUrlSignature();
      const { data } = await binanceApi.get(
        `/sapi/v1/simple-earn/flexible/history/subscriptionRecord?${params}`,
      );
      const dataSerialized = _.groupBy(data?.rows, 'asset');
      const wallet = await Promise.all(Object.keys(dataSerialized).map(async (ticker) => {
        
        // saldo acumulado do ativo em carteira
        const acumuladoCarteira = dataSerialized[ticker].reduce((prev, cur) => prev + Number(cur.amount),0);

        const {price} = await this.getCurrentPrice(`${ticker}BRL`);
        const qtdFaltanteTickerCompleto= (1 - acumuladoCarteira);
        const valorInvestido= Intl.NumberFormat('pt-BR',{ style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(acumuladoCarteira * price);
        const valorASerInvestidoParaCompraMoedaCompleta= Intl.NumberFormat('pt-BR',{ style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(price * (1 - acumuladoCarteira));

        return {
          [ticker]: {
            acumuladoCarteira,
            qtdFaltanteTickerCompleto,
            valorInvestido,
            valorASerInvestidoParaCompraMoedaCompleta,
          }
        }
      }));

      console.log(wallet);
    } catch (error) {
      this.logger.error(error);
    }
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  async getTrades(){
    try {
      const params = await this.getUrlSignature();

      const {data} = await binanceApi.get(`api/v3/trades?symbol=BTCUSDT&limit=100`);
      
      this.logger.debug(data);
    } catch (error) {
      this.logger.debug(error);
    }
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  async getMyTrades(){
    try {
      const params = await this.getUrlSignature();
console.log(`api/v3/myTrades?symbol=BTCUSDT&${params}`);

      const {data} = await binanceApi.get(`dapi/v3/myTrades?symbol=BTCUSDT&${params}`);
      
      // this.logger.debug(data);
    } catch (error) {
      this.logger.debug(error);
    }
  }
}
