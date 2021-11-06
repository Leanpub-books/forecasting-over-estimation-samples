/*
    Usage: forecast.ts -n 5 -f sample.csv [ -s 1000 ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';
import { parse } from "https://deno.land/std/flags/mod.ts"

import {HistoricalRecord, LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {Simulate} from "../modules/MonteCarloSimulation.ts";


const args = parseCommandline()

const history = LoadHistory(args.f);
const forecastingValues = Simulate<HistoricalRecord>(history, args.s, args.n,
    values  => { return Lazy.from(values).select(x => x.CycleTimeDays).sum(); });
const forecast = CalculateForecast(forecastingValues);

Plot(forecast)


function parseCommandline() {
    if (Deno.args.length == 0) {
        console.log("Usage with: -n <number of issues> -f <historical data csv filename> [ -s <number of simulations (default: 1000)> ]")
        Deno.exit(1);
    }

    const args = parse(Deno.args, { default: { s: 1000 } })
    console.log(`Running ${args.s} simulations...`)
    return args;
}