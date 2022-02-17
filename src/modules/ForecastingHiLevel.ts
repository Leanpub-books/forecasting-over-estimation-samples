import {Lazy} from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

import {HistoricalData} from "./HistoryReader.ts";
import {SimulateBatchCycleTimeFromThroughputs} from "./Forecasting.ts";
import {
    Histogram,
    HistogramItem,
    ProbabilityDistribution,
    ProbabilityDistributionItem
} from "./ProbabilityDistribution.ts";
import {SimulateByServing} from "./MonteCarloSimulation.ts";


/*
    The number of days needed to deliver a number of issue aggregates (batch) is
    forecast based on how many issues have been delivered each day (throughput, TP) in the past.

    An issue aggregate (IA) is a higher level requirement - e.g. user story, epic - which gets
    refined into a number of issues. TP is only recorded for issues, not for IAs. Therefore the
    forecast has two phases:

        Phase 1: Simulate the number of issues for the batch size of issue aggregates.
        Phase 2: Simulate the cycle time for the number of issues.
 */
export function ForecastHiLevelBatchCycleTimeFromThroughputs(history: HistoricalData, levelPrefix:string, hiLevelBatchSize:number, simulationSize:number): ProbabilityDistributionItem[] {
    const throughputs = history.Throughputs.map(x => x.Throughput);

    const simulatedIssueBatchSizes = Phase1(history, levelPrefix, hiLevelBatchSize, simulationSize);
    const histogramItems = Phase2(simulatedIssueBatchSizes, throughputs, simulationSize);

    return new ProbabilityDistribution(new Histogram(histogramItems)).Items();


    /*
        Phase 1:

        For the given batch size of issue aggregates, eg. 3, simulate into how many issues these
        aggregates get refined, ie. respective issue batch sizes, eg. 3 issue aggregates might stand
        for [12, 14, 9, 17, 13, ...] issues.
     */
    function Phase1(history: HistoricalData, levelPrefix: string, hiLevelBatchSize: number, simulationSize: number): number[] {
        const issueFrequencies = CalculateHiLevelIssueFrequencies(history, levelPrefix);
        return SimulateIssueBatchSizes(issueFrequencies, hiLevelBatchSize, simulationSize);
    }


    /*  Phase 2:

        Phase 1 will deliver a large number of different issue batch sizes, e.g. 10.000.
        For each of these values a large number of cycle times will be simulated in Phase 2 resulting
        in e.g. 10.000 * 10.000 = 100.000.000 cycle time values. Such a huge number of values should not
        be kept in memory until they are passed on to calculating the probability distribution.
        This calls for some memory usage optimization!

        Rather than keeping all simulated cycle times in memory only distinct cycle times
        are retained and updated after each simulation run for a batch size. For each cycle time
        the frequency is counted.
        Instead of 100.000.000 cycle time values only eg. 100 different ones are compiled
        each with the number of occurrences in the 100.000.000 CT simulations.
     */
    function Phase2(simulatedIssueBatchSizes: number[], throughputs: number[], simulationSize: number): HistogramItem[] {
        const cycleTimeFrequencies = new CycleTimeFrequencies();
        for (const batchSize of simulatedIssueBatchSizes) {
            const simulatedCylceTimes = SimulateBatchCycleTimeFromThroughputs(throughputs, batchSize, simulationSize);
            cycleTimeFrequencies.Update(simulatedCylceTimes);
        }
        return cycleTimeFrequencies.Histogram;
    }
}


/*
        Example history:
            issue 1; a_1
            issue 2; b_2
            issue 3; a_2
            issue 4; b_3
            issue 5; a_1

         1. Given the level prefix of "a_" these categories are selected as level categories:
                a_1, a_2
         2. All issues are grouped by categories
                a_1: 1, 5
                a_2: 3
                b_2: 2
                b_3: 4
         3. From the grouped issues those belonging to the level categories are selected:
                a_1: 1, 5
                a_2: 3
         4. From the level categories only their number of issues are relevant:
                2, 1
 */
function CalculateHiLevelIssueFrequencies(history: HistoricalData, levelPrefix: string): number[] {
    var levelCategories = Lazy.from(history.CategoriesWithPrefix(levelPrefix)); // 1
    return Lazy.from(history.GroupByCategories(false)) // 2
            .where(g => levelCategories.contains(g.Category)) // 3
            .select(g => g.Records.length) // 4
            .toArray();
}

/*
    An issue aggregate batch stands for a number of issues it gets refined into. But how many?
    This is simulated based on the number of issues the relevant issue aggregates got refined into in the past.

    Example:
        Relevant issue aggregates with their numbers of issues (issue frequencies):
            x_1: 10
            x_2: 15
            x_3: 8

        If an issue aggregate batch size of 4 has to be forecast, it could contain eg.
            [10,8,8,10] = 36 issues
            [15,10,8,10] = 43 issues
            [10,10,10,8] = 38 issues
            etc.
 */
function SimulateIssueBatchSizes(issueFrequencies:number[], hiLevelBatchSize:number, simulationSize:number) {
    return SimulateByServing<number>(issueFrequencies, hiLevelBatchSize, simulationSize,
        values => values.reduce((a, b) => a + b, 0)
    );
}


/*
    Map of cycle time frequencies: for each cycle time the number of
    times it occurred in different sets of cycle times is summed up (Update()).
 */
class CycleTimeFrequencies {
    cycleTimeFrequencies = new Map();

    Update(cycleTimes: number[]) {
        for (const ct of cycleTimes) {
            if (this.cycleTimeFrequencies.has(ct) == false) this.cycleTimeFrequencies.set(ct, 0);
            this.cycleTimeFrequencies.set(ct, this.cycleTimeFrequencies.get(ct) + 1);
        }
    }

    get Histogram(): HistogramItem[] {
        return Array.from(this.cycleTimeFrequencies.keys()).map(x => {
            return {v: x, f: this.cycleTimeFrequencies.get(x)}
        });
    }
}