import axios from "axios";
import * as env from 'dotenv';
env.config();

export const binanceApi = axios.create({
  baseURL: "https://api.binance.com/",
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-MBX-APIKEY': process.env.API_KEY 
  },
});