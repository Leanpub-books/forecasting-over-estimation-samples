/*
    Usage: forecast.ts -f historical_data.csv [ -s 1000 ] [ -n 5 | -c "bugfix,k2; feature,k8" ]
 */

import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {parseCommandline} from "../modules/CommandlineParser.ts";
import {HistoricalRecord, LoadHistory} from "../modules/HistoryReader.ts";
import {CalculateForecast} from "../modules/Forecasting.ts";
import {Plot} from "../modules/ForecastAsciiBarCharts.ts";
import {Simulate, SimulateForCategory} from "../modules/MonteCarloSimulation.ts";



const args = parseCommandline(Deno.args)

console.log(`Parameters: ${args.HistoricalDataSourceFilename}, n:${args.Issues.length}, s:${args.NumberOfSimulations}`)

const history = LoadHistory(args.HistoricalDataSourceFilename);

const issueRecords: HistoricalRecord[][] = []
for(const issue of args.Issues) {
    console.log(`- ${issue.Categories.join(",")}`)
    issueRecords.push(history.FilterByCategories(issue.Categories));
}

const forecastingValues = Simulate<HistoricalRecord>(issueRecords, args.NumberOfSimulations,
    values  => { return Lazy.from(values).select(x => x.CycleTimeDays).sum(); });

const forecast = CalculateForecast(forecastingValues);

Plot(forecast)
