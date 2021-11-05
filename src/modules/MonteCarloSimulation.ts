type aggregationFunction<T> = { (values: T[]): number };

export function Simulate<T>(historicalData: T[], numberOfSimulations: number, numberOfRandomSamples: number,
                            aggregate: aggregationFunction<T>): number[] {
    const simulations: number[] = [];
    for (let i = 1; i <= numberOfSimulations; i += 1) {
        const samples: T[] = [];
        for (let s = 1; s <= numberOfRandomSamples; s += 1) {
            const index = Math.floor(Math.random() * (historicalData.length));
            samples.push(historicalData[index]);
        }
        simulations.push(aggregate(samples));
    }
    return simulations;
}