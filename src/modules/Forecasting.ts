import {HistoricalData} from "./HistoryReader.ts";
import {ProbabilityDistributionItem} from "./ProbabilityDistribution.ts";
import {SimulateByServing} from "./MonteCarloSimulation.ts";


export function ForecastBatchCycleTimeFromCycleTimes(history: HistoricalData, batchSize:number, simulationSize:number): ProbabilityDistributionItem[] {
    const cycletimes = history.Records.map(x => x.CycleTimeDays);
    const ctforecastingValues = SimulateByServing<number>(cycletimes, batchSize, simulationSize,
        values => values.reduce((a, b) => a + b, 0)
    );
}