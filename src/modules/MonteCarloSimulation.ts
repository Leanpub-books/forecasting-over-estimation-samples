type aggregationFunction<T> = { (values: T[]): number };


export function SimulateForCategory<T>(historicalData: T[], numberOfRandomSamples: number, numberOfSimulations: number,
                                       aggregate: aggregationFunction<T>): number[] {
    // The historical data is treated as a subset in order to be able to use Simulate<T>.
    // The single source is multiplied by the number of samples to be taken.
    // This serves the same purpose as specifying filter categories for the same number of samples.
    const subsets: T[][] = []
    for(let i=1; i<=numberOfRandomSamples; i += 1)
        subsets.push(historicalData);

    return Simulate(subsets, numberOfSimulations,
                    aggregate);
}


export function Simulate<T>(historicalDataSubsets: T[][], numberOfSimulations: number,
                            aggregate: aggregationFunction<T>): number[] {
    const simulations: number[] = [];
    for (let i = 1; i <= numberOfSimulations; i += 1) {
        const samples: T[] = [];
        // A simulation run picks a random entry from each provided subset
        for (let s = 0; s < historicalDataSubsets.length; s += 1) {
            const index = Math.floor(Math.random() * (historicalDataSubsets[s].length));
            samples.push(historicalDataSubsets[s][index]);
        }
        simulations.push(aggregate(samples));
    }
    return simulations;
}

