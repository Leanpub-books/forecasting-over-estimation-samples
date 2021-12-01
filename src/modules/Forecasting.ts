import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';


export interface ForecastItem {
    ct: number
    f: number
    p: number
    pSum: number
}

export function CalculateForecast(values: number[], invert: boolean = false): ForecastItem[] {
    const lazyValues = Lazy.from(values);
    const uniqueValues = lazyValues.distinct().toArray().sort((n1,n2) => n1 - n2);
        // .oderBy() of Lazy does not properly work :-( Have to resort to sort()

    const valuesWithFrequencies = Lazy.from(uniqueValues).select(x => {
        return {ct: x, f: lazyValues.count(y => y == x)}
    });
    var cycleTimesWithProbabilities = valuesWithFrequencies.select(x => {
        return {ct: x.ct, f: x.f, p: x.f / values.length}
    })

    if (invert) cycleTimesWithProbabilities = cycleTimesWithProbabilities.reverse();

    const forecast: ForecastItem[] = [];
    let pSum = 0;
    for (const x of cycleTimesWithProbabilities) {
        pSum = pSum + x.p;
        const f = {ct: x.ct, f: x.f, p: x.p, pSum: pSum};
        forecast.push(f);
    }
    return forecast;
}