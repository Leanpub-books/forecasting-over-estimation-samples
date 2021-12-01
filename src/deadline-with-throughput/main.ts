/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {SimulateByPicking, SimulateByServing} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)

console.log(`Parameters: ${args.HistoricalDataSourceFilename}, m:${args.Mode}, n:${args.Issues.length}, s:${args.NumberOfSimulations}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);

var forecastingValues: number[]

switch(args.Mode) {
    case "tp":
        const ctthroughputs = history.Throughputs.map(x => x.Throughput);
        forecastingValues = SimulateByPicking<number>(ctthroughputs, args.NumberOfSimulations,
            (pickRandom) => {
                var totalThroughput = 0;
                var batchCycleTime = 0;
                while (totalThroughput < args.Issues.length) {
                    totalThroughput += pickRandom();
                    batchCycleTime += 1;
                }
                return batchCycleTime;
            });
        break;

    case "dl":
        const dlthroughputs = history.Throughputs.map(x => x.Throughput);
        forecastingValues = SimulateByServing<number>(dlthroughputs, args.Issues.length, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        break;

    case "ct":
        const cycletimes = history.Records.map(x => x.CycleTimeDays);
        forecastingValues = SimulateByServing<number>(cycletimes, args.Issues.length, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        break;

    default:
        throw new Error(`*** Unsupported mode ${args.Mode}!`)
}

const forecast = CalculateForecast(forecastingValues);

Plot(forecast)
