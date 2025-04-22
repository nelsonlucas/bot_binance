import { Controller, Get, Res } from '@nestjs/common';
import { BinanceWebsocketConnectorService } from './binance-websocket-connector.service';
import { Response } from 'express';
import * as _ from 'lodash';

@Controller('binance')
export class BinanceController {
  constructor(
    private readonly binanceService: BinanceWebsocketConnectorService,
  ) {}

  @Get('historicTrades')
  async getHistoricTrades(@Res() res: Response) {
    const trades = await this.binanceService.getHistoricTrades({
      symbol: 'ETHBRL',
    });

    const groupedTrades = _.groupBy(trades, 'orderId');

    // Calcular lucro/prejuízo apenas para vendas
    const results = [];

    for (const orderId in groupedTrades) {
      const orderTrades = groupedTrades[orderId];

      let totalBuyCost = 0; // Custo total da compra
      let totalSellValue = 0; // Valor total da venda
      let totalCommission = 0; // Soma das taxas

      orderTrades.forEach((trade) => {
        const price = parseFloat(trade.price);
        const qty = parseFloat(trade.qty);
        const commission = parseFloat(trade.commission);

        if (trade.isBuyer) {
          // Acumular custo para compras
          totalBuyCost += price * qty;
        } else {
          // Acumular valor para vendas
          totalSellValue += price * qty;
        }

        totalCommission += commission; // Soma das taxas
      });

      // Calcular lucro/prejuízo para vendas
      if (totalSellValue > 0) {
        const netProfitLoss = totalSellValue - totalBuyCost - totalCommission;
        results.push({
          orderId,
          lucro: netProfitLoss,
          status: netProfitLoss >= 0 ? 'Lucro' : 'Prejuízo',
          totalSellValue,
          custoCompra: totalBuyCost,
          taxas: totalCommission,
        });
      }
    }

    // Filtrar e exibir apenas operações com lucro/prejuízo
    const profitLossResults = results.filter(
      (result) => result.profitLoss !== 0,
    );
    console.log('Resultados (Lucro/Prejuízo):', profitLossResults);

    return res.json(results);
  }

  @Get('avgPrice')
  async getAvgPrice(@Res() res: Response) {
    let trades = await this.binanceService.getHistoricTrades({
      symbol: 'ETHBRL',
    });

    trades = trades
      .map((e) => 
       ( {
          ...e,
          date: new Date(e.time),
          price: parseFloat(e.price),
          qty: parseFloat(e.qty),
        }),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    let totalBuyValue = trades.filter((e) => e.isBuyer).reduce((prev, cur) => prev + cur.price * cur.qty, 0);
    let totalBuyQtd = trades.filter((e) => e.isBuyer).reduce((prev, cur) => prev + cur.qty, 0);
    let totalSellValue = trades.filter((e) => !e.isBuyer).reduce((prev, cur) => prev + cur.price * cur.qty, 0);;
    let totalSellQtd = trades.filter((e) => !e.isBuyer).reduce((prev, cur) => prev + cur.qty, 0);;

     
     const totalQty = totalBuyQtd - totalSellQtd;

    const totalValue = totalBuyValue - totalSellValue;
    

    return res.json(
      totalQty > 0 ? { avgPrice: totalValue / totalQty } : { avgPrice: 0 },
    );

    // const buyTraders = trades.filter((trade) => trade.isBuyer);

    // const totalValue = buyTraders.reduce((prev, cur) => prev + parseFloat(cur.price) * parseFloat(cur.qty),0);
    // const totalQtd = buyTraders.reduce((prev, cur) => prev + parseFloat(cur.qty),0);

    // const avgPrice = totalValue / totalQtd;

    // return res.json({avgPrice});
  }
}
