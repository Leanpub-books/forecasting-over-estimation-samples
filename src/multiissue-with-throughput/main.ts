/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {SimulateByPicking} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)

console.log(`Parameters: ${args.HistoricalDataSourceFilename}, n:${args.Issues.length}, s:${args.NumberOfSimulations}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);

const forecastingValues = SimulateByPicking<number>(history.Throughputs.map(x => x.Throughput), args.NumberOfSimulations,
    (pickRandom) => {
        var totalThroughput = 0;
        var batchCycleTime = 0;
        while(totalThroughput < args.Issues.length) {
            totalThroughput = totalThroughput + pickRandom();
            batchCycleTime = batchCycleTime + 1;
        }
        return batchCycleTime;
    });

const forecast = CalculateForecast(forecastingValues);

Plot(forecast)
