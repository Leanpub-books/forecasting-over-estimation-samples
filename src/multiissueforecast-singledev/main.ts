/*
    Usage: forecast.ts -n 5 -f sample.csv [ -s 1000 ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';
import { parse } from "https://deno.land/std/flags/mod.ts"

import {LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {Simulate} from "../modules/MonteCarloSimulation.ts";


const args = parseCommandline()
const history = LoadHistory(args.f);

const historicalCycletimes = Lazy.from(history).select(x => x.CycleTimeDays).toArray();
const forecastingValues = Simulate<number>(historicalCycletimes, args.s, args.n,
    values  => { return Lazy.from(values).sum(); });
const forecast = CalculateForecast(forecastingValues);

Plot(forecast)


function parseCommandline() {
    if (Deno.args.length == 0) {
        console.log("Usage: forecast.ts -n <number of issues> -f <historical data csv filename> [ -s <number of simulations (default: 1000)> ]")
        Deno.exit(1);
    }

    const args = parse(Deno.args, { default: { s: 1000 } })
    console.log(`Running ${args.s} simulations...`)
    return args;
}