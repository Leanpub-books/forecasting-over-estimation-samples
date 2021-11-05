import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import { HistoricalRecord, LoadHistory } from "../modules/HistoryReader.ts";
import { CalculateForecast } from "../modules/Forecasting.ts";
import { Plot } from "../modules/ForecastAsciiBarCharts.ts";


const history = LoadHistory(Deno.args[0]);
const forecastingValues = Lazy.from(history).select(x => x.CycleTimeDays).toArray();
const forecast = CalculateForecast(forecastingValues);

Plot(forecast)