import {HistoricalData} from "./HistoryReader.ts";
import {ProbabilityDistribution,ProbabilityDistributionItem} from "./ProbabilityDistribution.ts";
import {SimulateByPicking, SimulateByServing} from "./MonteCarloSimulation.ts";

/*
    The number of days needed to deliver a number of issues (batch) is
    forecast based on how many issues have been delivered each day (throughput, TP) in the past.

    Example history:
        1.1.2022;3.1.2022
        1.1.2022;4.1.2022
        2.1.2022;3.1.2022

    History date range with throughputs:
        1.1.; 0
        2.2.; 0
        3.1.; 2
        4.1.; 1

    The simulation is based only on the TP data: [0,0,2,1].

    For a batch size of 5 TP values are picked randomly from this set until their sum equals or exceeds
    the batch size, eg. [0,1,0,0,2,0,1,0,0,2]. The number of times a TP value is picked equals the
    simulated batch cycle time; in this case 10 days.
 */
export function ForecastBatchCycleTimeFromThroughputs(history: HistoricalData, batchSize:number, simulationSize:number): ProbabilityDistributionItem[] {
    const throughputs = history.Throughputs.map(x => x.Throughput);
    const simulatedCycleTimes = SimulateBatchCycleTimeFromThroughputs(throughputs, batchSize, simulationSize);
    return ProbabilityDistribution.fromValues(simulatedCycleTimes).Items();
}

export function SimulateBatchCycleTimeFromThroughputs(throughputs:number[], batchSize:number, simulationSize:number) {
    return SimulateByPicking<number>(throughputs, simulationSize,
        (pickRandom) => {
            var totalThroughput = 0;
            var batchCycleTime = 0;
            while (totalThroughput < batchSize) {
                totalThroughput += pickRandom();
                batchCycleTime += 1;
            }
            return batchCycleTime;
        });
}


/*
    The number of issues (batch size) which can be delivered in a period
    is calculated based on the daily throughput (TP).

    Example history:
        1.1.2022;3.1.2022
        1.1.2022;4.1.2022
        2.1.2022;3.1.2022

    History date range with throughputs:
        1.1.; 0
        2.2.; 0
        3.1.; 2
        4.1.; 1

    The simulation is based only on the TP data: [0,0,2,1].

    For a period of 10 days an equal number of TP data is taken from this set and added up,
    eg. [2, 0, 1, 0, 0, 0, 1, 1, 2, 1]. The sum of the throughputs is the size of the batch
    that can be delivered in a period of that lengt, e.g. 8 issues.
 */
export function ForecastBatchsizeFromThroughputs(history: HistoricalData, periodDuration:number, simulationSize:number): ProbabilityDistributionItem[] {
    const throughputs = history.Throughputs.map(x => x.Throughput);
    const simulatedBatchSizes = SimulateByServing<number>(throughputs, periodDuration, simulationSize,
        values => values.reduce((a, b) => a + b, 0) // sum
    );
    return ProbabilityDistribution.fromValues(simulatedBatchSizes).Items(true);
}


/*
    The number of days needed to deliver a number of issues (batch) is
    forecast based on how long issues took to be delivered (cycle time, CT).

    Example history:
        1.1.2022;3.1.2022
        1.1.2022;4.1.2022
        2.1.2022;3.1.2022

    History of cycle times:
        2
        2
        1

    The simulation is based only on the CT data: [2,2,1].

    For a batch size of 5 an equal number CT values are picked randomly from this set and are added up
    to calculate a batch cycle time, e.g. [2, 1, 2, 2, 1]. The batch cycle time in this example would be 8.
 */
export function ForecastBatchCycleTimeFromCycleTimes(history: HistoricalData, batchSize:number, simulationSize:number): ProbabilityDistributionItem[] {
    const cycletimes = history.Records.map(x => x.CycleTimeDays);
    const simulatedCycleTimes = SimulateByServing<number>(cycletimes, batchSize, simulationSize,
        values => values.reduce((a, b) => a + b, 0) // sum
    );
    return ProbabilityDistribution.fromValues(simulatedCycleTimes).Items();
}

