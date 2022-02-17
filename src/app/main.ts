/*
    Usage example: forecast.ts -f sample.csv -m tp -n 5
 */


import {parseCommandline} from "../modules/CommandlineParser.ts";
import {LoadHistory} from "../modules/HistoryReader.ts";
import {ProbabilityDistributionItem} from "../modules/ProbabilityDistribution.ts";
import {Plot} from "../modules/ProbabilityDistributionAsciiBarChart.ts";
import {
    ForecastBatchCycleTimeFromCycleTimes,
    ForecastBatchCycleTimeFromThroughputs,
    ForecastBatchsizeFromThroughputs
} from "../modules/Forecasting.ts";
import {ForecastHiLevelBatchCycleTimeFromThroughputs} from "../modules/ForecastingHiLevel.ts";


const args = parseCommandline(Deno.args)
const history = LoadHistory(args.HistoricalDataSourceFilename);

console.log(`Parameters: ${args.HistoricalDataSourceFilename}, m:${args.Mode}, n:${args.N}, s:${args.NumberOfSimulations}, l:${args.LevelPrefix}`)

var forecast: ProbabilityDistributionItem[]
switch(args.Mode) {
    // How long will n issues take based on throughput?
    case "tp":
        if (args.LevelPrefix == "")
            forecast = ForecastBatchCycleTimeFromThroughputs(history, args.N, args.NumberOfSimulations);
        else
            forecast = ForecastHiLevelBatchCycleTimeFromThroughputs(history, args.LevelPrefix, args.N, args.NumberOfSimulations);
        break;

    // How many issues can be delivered within n days based on throughput?
    case "dl":
        forecast = ForecastBatchsizeFromThroughputs(history, args.N, args.NumberOfSimulations);
        break;

    // How long will n issues take based on cylce times?
    case "ct":
        console.log("*** Please note: Calculating a batch cycle time based on issue cycle times is fairly inaccurate for teams. ***")
        forecast = ForecastBatchCycleTimeFromCycleTimes(history, args.N, args.NumberOfSimulations);
        break;

    default:
        throw new Error(`*** Unsupported mode ${args.Mode}!`)
}

Plot(forecast)

