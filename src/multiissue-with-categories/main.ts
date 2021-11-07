/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {HistoricalRecord, LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {Simulate} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)
console.log(`Parameters: ${args.HistoricalDataSourceFilename}, n:${args.Issues.length}, s:${args.NumberOfSimulations}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);
const forecastingValues = Simulate<HistoricalRecord>(history, args.NumberOfSimulations, args.Issues.length,
    values  => { return Lazy.from(values).select(x => x.CycleTimeDays).sum(); });
const forecast = CalculateForecast(forecastingValues);

Plot(forecast)
