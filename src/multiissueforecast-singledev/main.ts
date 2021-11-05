import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {Simulate} from "../modules/MonteCarloSimulation.ts";


const history = LoadHistory(Deno.args[0]);

const historicalCycletimes = Lazy.from(history).select(x => x.CycleTimeDays).toArray();
const forecastingValues = Simulate<number>(historicalCycletimes, 1000, 5,
    values  => { return Lazy.from(values).sum(); });

const forecast = CalculateForecast(forecastingValues);

Plot(forecast)