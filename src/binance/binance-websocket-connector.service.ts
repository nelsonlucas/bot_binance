import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WebSocket } from 'ws';
import * as _ from 'lodash';
import { binanceApi } from 'src/apis/binanceApi';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { dbApi } from 'src/apis/dbApi';

enum ETypeOrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}
enum ETypeOrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP_LOSS = 'STOP_LOSS',
  STOP_LOSS_LIMIT = 'STOP_LOSS_LIMIT',
  TAKE_PROFIT = 'TAKE_PROFIT',
  TAKE_PROFIT_LIMIT = 'TAKE_PROFIT_LIMIT',
  LIMIT_MAKER = 'LIMIT_MAKER',
}

@Injectable()
export class BinanceWebsocketConnectorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(BinanceWebsocketConnectorService.name);
  private ws: WebSocket;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.binanceWebSockeet();
  }

  onModuleDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  private binanceWebSockeet() {
    try {
      const WS_URL = 'wss://stream.binance.com:9443/ws';
      const SYMBOL = 'solusdt'; // Par de negociação
      const DEPTH_LEVEL = 20; // Profundidade do order book (5, 10 ou 20)
      const endpoint = `${WS_URL}/${SYMBOL}@depth5`; // Substitua pelo stream desejado

      this.ws = new WebSocket(endpoint);

      this.ws.on('message', async (data: string) => {
        const symbol = String(SYMBOL).toUpperCase();
        this.savePrices({ symbol });
        await this.execute({ symbol });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Salva os preços do book
   * @param symbol {symbol}
   */
  async savePrices({ symbol }) {
    try {
      // converter para obj
      let { bids } = await this.getOrderBook({ symbol });
      const numberGroup = 10;
      bids = bids.map(([price, quantity]) => ({
        originalPrice: Number(price).toFixed(2),
        price: this.customRound(Number(price).toFixed(0), numberGroup),
        qtd: Number(quantity),
      }));

      // agrupamento por preço
      const bidsGrouped = _.groupBy(bids, (obj) => obj.price);

      // somatorio das quantidades para saber quanto tem em cada faixa de preco
      const bidsGroupedCalculated = Object.keys(bidsGrouped).map((key) => ({
        price: key,
        qtd: bidsGrouped[key].reduce((prev, cur) => prev + cur.qtd, 0),
      }));

      const list = bidsGroupedCalculated.map(async (e) => {
        const { data } = await dbApi.get(
          `/book?symbol=${symbol}&price=${e.price}`,
        );
        if (data.length === 0) {
          return dbApi.post('/book', { ...e, symbol });
        } else {
          return dbApi.put(`/book/${data?.[0]?.id}`, { ...e, symbol });
        }
      });
      await Promise.all(list);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async execute({ symbol }) {
    const { data: book } = await dbApi.get(`/book?symbol=${symbol}`);
    console.log(book);

    const twoBestPrice = book.sort((a, b) => b.qtd - a.qtd);

    const bestPrice = (twoBestPrice || [])
      .slice(0, 5)
      .reduce(
        (prev, cur) =>
          (prev?.qtd || 0) - (cur?.qtd || 0) >= 0.04 ? prev : cur,
        0,
      );
  }

  /**
   * Criar nova ordem
   * @param symbol {symbol}
   * @param side {buy,sell}
   * @param type {limit,market}
   * @param quantity {number}
   * @param price {number}
   */
  async createNewOrder({ symbol, side, type, quantity, price }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}&side=${side}&type=${type}&quantity=${quantity}&price=${price}`;
      const signature = await this.getUrlSignature(params);
      const { data } = await binanceApi.post(`api/v3/order?${signature}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Pegar ordem de preço
   * @param symbol {symbol}
   */
  async getOrderBook({ symbol }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}&limit=100`;
      const { data } = await binanceApi.get(`api/v3/depth?${params}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Pegar todas ordens abertas
   * @param symbol {symbol}
   */
  async getOrderOpened({ symbol }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}`;
      const signature = await this.getUrlSignature(params);

      const { data } = await binanceApi.get(`api/v3/openOrders?${signature}`);

      const dataSerialized = data.map((e) => ({
        ...e,
        price: Number(e.price),
        origQty: Number(e.origQty),
        cummulativeQuoteQty: Number(e.cummulativeQuoteQty),
        stopPrice: Number(e.stopPrice),
        icebergQty: Number(e.icebergQty),
        origQuoteOrderQty: Number(e.origQuoteOrderQty),
      }));

      return dataSerialized;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Retornar todas as ordens
   * @param symbol {symbol}
   */
  async getHistoricOrders({ symbol }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}`;
      const signature = await this.getUrlSignature(params);
      const { data } = await binanceApi.get(`api/v3/allOrders?${signature}`);
      const dataSerialized = data.map((e) => ({
        ...e,
        time: new Date(e.time).toISOString(),
        updateTime: new Date(e.updateTime).toISOString(),
        workingTime: new Date(e.workingTime).toISOString(),
      }));
      return dataSerialized;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Cancelar ordem
   * @param orderId {number}
   * @param symbol {symbol}
   */
  async cancelOrder({ orderId, symbol }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}&orderId=${orderId}`;
      const signature = await this.getUrlSignature(params);
      const { data } = await binanceApi.delete(`api/v3/order?${signature}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Abrir nova ordem
   * @param symbol {symbol}
   * @param side {buy,sell}
   * @param type {limit,market}
   * @param quantity {number}
   * @param price {number}
   */
  async openNewOrder({
    symbol,
    side,
    type,
    quantity,
    price,
  }: {
    symbol: string;
    side: ETypeOrderSide;
    type: ETypeOrderType;
    quantity: number;
    price: number;
  }) {
    try {
      const params = `symbol=${String(symbol).toUpperCase()}&side=${side}&type=${type}&quantity=${quantity}&price=${price}&timeInForce=GTC`;
      const signature = await this.getUrlSignature(params);
      const { data } = await binanceApi.post(`api/v3/order?${signature}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getHistoricTrades({ symbol }) {
    try {
      // const params = `symbol=${String(symbol).toUpperCase()}&recvWindow=5000`;
      const params = `symbol=${String(symbol).toUpperCase()}`;
      const signature = await this.getUrlSignature(params);
      const { data } = await binanceApi.get(`api/v3/myTrades?${signature}`);
      return data;
    } catch (error) {
      this.logger.error(error?.response?.data);
    }
  }

  private async getUrlSignature(params): Promise<string> {
    const SECRET_KEY = this.configService.get('SECRET_KEY');
    const timestamp = await this.getServerTimeBinance();
    const queryString = `${params}&timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', SECRET_KEY) // SECRET_KEY para gerar a assinatura
      .update(queryString)
      .digest('hex');
    return `${queryString}&signature=${signature}`;
  }

  private async getServerTimeBinance() {
    try {
      const {
        data: { serverTime },
      } = await binanceApi.get(`/api/v3/time`);
      return serverTime;
    } catch (error) {
      this.logger.error(error);
    }
  }

  private customRound(number, numberGroup) {
    return Math.floor(number / numberGroup) * numberGroup;
  }
}
