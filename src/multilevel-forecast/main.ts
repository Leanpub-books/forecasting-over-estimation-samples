/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {HistoricalData, LoadHistory} from "../modules/HistoryReader.ts";
import {ProbabilityDistribution, ProbabilityDistributionItem} from "../modules/ProbabilityDistribution.ts";
import {Plot} from "../modules/ProbabilityDistributionAsciiBarChart.ts";
import {SimulateByPicking, SimulateByServing} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)
console.log(`Parameters: ${args.HistoricalDataSourceFilename}, m:${args.Mode}, n:${args.N}, s:${args.NumberOfSimulations}, l:${args.LevelPrefix}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);

var forecast: ProbabilityDistributionItem[]
switch(args.Mode) {
    // How long will n issues take based on throughput?
    case "tp":
        const ctthroughputs = history.Throughputs.map(x => x.Throughput);

        if (args.LevelPrefix == "") {
            // forecast based on issues
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
            forecast = ProbabilityDistribution.fromValues(tpforecastingValues);
        } else {
            // forecast for a level above issues

            // 1. compile level entries with their issues
            const itemFrequencies = CalculateItemFrequencies(history, args.LevelPrefix);

            // 2. forecast number of issues for n requirements on level
            const issueSimulations = SimulateByServing<number>(itemFrequencies.map(x => x.NumberOfItems), args.N, args.NumberOfSimulations,
                values => values.reduce((a, b) => a + b, 0)
            );

            // 3. forecast cycles time for issues
            const totalForecastingValues = new Map();
            for(const numberOfIssues of issueSimulations) {
                const forecastingValues = SimulateByPicking<number>(ctthroughputs, args.NumberOfSimulations,
                    (pickRandom) => {
                        var totalThroughput = 0;
                        var batchCycleTime = 0;
                        while (totalThroughput < args.N) {
                            totalThroughput += pickRandom();
                            batchCycleTime += 1;
                        }
                        return batchCycleTime;
                    });

                for(const v of forecastingValues) {
                    if (totalForecastingValues.has(v) == false) totalForecastingValues.set(v, 0);
                    totalForecastingValues.set(v, totalForecastingValues.get(v)+1);
                }
            }

            // 4. calculate forecast from aggregated cycle times
            const frequencies = Array.from(totalForecastingValues.keys()).map(x => { return {v:x, f:totalForecastingValues.get(x)} })
            forecast = CalculateForecastFromFrequencies(frequencies);
        }
        break;

    // How many issues can be delivered within n days based on throughput?
    case "dl":
        const dlthroughputs = history.Throughputs.map(x => x.Throughput);
        const dlforecastingValues = SimulateByServing<number>(dlthroughputs, args.N, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        forecast = CalculateProbabilityDistribution(dlforecastingValues, true);
        break;

    // How long will n issues take based on cylce times?
    case "ct":
        const cycletimes = history.Records.map(x => x.CycleTimeDays);
        const ctforecastingValues = SimulateByServing<number>(cycletimes, args.N, args.NumberOfSimulations,
            values => values.reduce((a, b) => a + b, 0)
        );
        forecast = CalculateProbabilityDistribution(ctforecastingValues);
        break;

    default:
        throw new Error(`*** Unsupported mode ${args.Mode}!`)
}

Plot(forecast)


function CalculateItemFrequencies(history: HistoricalData, prefix: string): {Category:string, NumberOfItems:number}[] {
    var levelCategories = Lazy.from(history.CategoriesWithPrefix(prefix));
    return Lazy.from(history.GroupByCategories(false))
        .where(g => levelCategories.contains(g.Category))
        .select(g => {return {Category: g.Category, NumberOfItems: g.Records.length}})
        .toArray();
}