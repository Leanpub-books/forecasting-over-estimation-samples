import * as asserts from "https://deno.land/std/testing/asserts.ts";

import {CalculateForecast} from "../Forecasting.ts";
import {Plot} from "../ForecastAsciiBarCharts.ts";

import {SimulateByPicking, SimulateByServingFromMultipleSubsets} from "../MonteCarloSimulation.ts";


Deno.test("Simulate single dice roll", () => {
    var historicalData = [1,2,3,4,5,6];

    const result = SimulateByServingFromMultipleSubsets<number>([historicalData], 1000,
        values => values[0]);

    const forecast = CalculateForecast(result);
    Plot(forecast);
    // Assert by looking at distribution
})


Deno.test("Simulate two dice rolls", () => {
    var historicalData = [1,2,3,4,5,6];

    const result = SimulateByServingFromMultipleSubsets<number>([historicalData, historicalData], 1000,
        values => values[0] + values[1]);

    const forecast = CalculateForecast(result);
    Plot(forecast);
    // Assert by looking at distribution
})


Deno.test("Simulate by picking", () => {
    const history = [1,2,3]

    const forecastingValues = SimulateByPicking<number>(history, 5,
        (pickRandom) => {
            var totalThroughput = 0;
            var dayOfWeek = 0;
            var batchCycleTime = 0;
            while(totalThroughput < 3) {
                if (dayOfWeek != 5 && dayOfWeek != 6) {
                    const r = pickRandom()
                    console.log(`   ${r}`)
                    totalThroughput += r; // no throughput on weekends!
                }
                batchCycleTime += 1;
                dayOfWeek = (dayOfWeek + 1) % 7;
            }
            console.log(batchCycleTime)
            return batchCycleTime;
        });
})