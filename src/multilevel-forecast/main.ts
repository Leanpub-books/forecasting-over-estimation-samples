/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast, ForecastItem} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {SimulateByPicking, SimulateByServing} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)
console.log(`Parameters: ${args.HistoricalDataSourceFilename}, m:${args.Mode}, n:${args.N}, s:${args.NumberOfSimulations}, l:${args.LevelPrefix}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);

var forecast: ForecastItem[]
switch(args.Mode) {
    // How long will n issues take based on throughput?
    case "tp":
        const ctthroughputs = history.Throughputs.map(x => x.Throughput);
        const tpforecastingValues = SimulateByPicking<number>(ctthroughputs, args.NumberOfSimulations,
            (pickRandom) => {
                var totalThroughput = 0;
                var batchCycleTime = 0;
                while (totalThroughput < args.N) {
                    totalThroughput += pickRandom();
                    batchCycleTime += 1;
                }
                return batchCycleTime;
            });
        forecast = CalculateForecast(tpforecastingValues);
        break;

    // How many issues can be delivered within n days based on throughput?
    case "dl":
        const dlthroughputs = history.Throughputs.map(x => x.Throughput);
        const dlforecastingValues = SimulateByServing<number>(dlthroughputs, args.N, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        forecast = CalculateForecast(dlforecastingValues, true);
        break;

    // How long will n issues take based on cylce times?
    case "ct":
        const cycletimes = history.Records.map(x => x.CycleTimeDays);
        const ctforecastingValues = SimulateByServing<number>(cycletimes, args.N, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        forecast = CalculateForecast(ctforecastingValues);
        break;

    default:
        throw new Error(`*** Unsupported mode ${args.Mode}!`)
}

Plot(forecast)
