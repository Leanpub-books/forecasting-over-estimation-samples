import * as asserts from "https://deno.land/std/testing/asserts.ts";

import {CalculateForecast} from "../Forecasting.ts";
import {Plot} from "../ForecastAsciiBarCharts.ts";

import {Simulate} from "../MonteCarloSimulation.ts";


Deno.test("Simulate single dice roll", () => {
    var historicalData = [1,2,3,4,5,6];

    const result = Simulate<number>(historicalData, 1000, 1,
        values => values[0]);

    const forecast = CalculateForecast(result);
    Plot(forecast);
    // Assert by looking at distribution
})


Deno.test("Simulate two dice rolls", () => {
    var historicalData = [1,2,3,4,5,6];

    const result = Simulate<number>(historicalData, 1000, 2,
        values => values[0] + values[1]);

    const forecast = CalculateForecast(result);
    Plot(forecast);
    // Assert by looking at distribution
})