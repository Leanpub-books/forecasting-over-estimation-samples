import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

export interface ForecastItem {
    ct: number
    f: number
    p: number
    pSum: number
}

export function CalculateForecast(values: number[]): ForecastItem[] {
    const lazyValues = Lazy.from(values);
    const uniqueValues = lazyValues.distinct().orderBy(x => x);
    const valuesWithFrequencies = uniqueValues.select(x => {
        return {ct: x, f: lazyValues.count(y => y == x)}
    });
    const cycleTimesWithProbabilities = valuesWithFrequencies.select(x => {
        return {ct: x.ct, f: x.f, p: x.f / values.length}
    })

    const forecast = new Array();
    let pSum = 0;
    for (const x of cycleTimesWithProbabilities) {
        pSum = pSum + x.p;
        const f = {ct: x.ct, n: x.f, p: x.p, pSum: pSum};
        forecast.push(f);
    }
    return forecast;
}