import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';


export interface ForecastItem {
    ct: number
    f: number
    p: number
    pSum: number
}

export function CalculateForecast(values: number[], invert: boolean = false): ForecastItem[] {
    return CalculateForecastFromFrequencies(CalculateFrequencies(values), invert);
}

function CalculateFrequencies(values: number[]): {v:number, f:number}[] {
    const lazyValues = Lazy.from(values);
    const uniqueValues = Lazy.from(values).distinct()
                             .toArray()
                             .sort((n1,n2) => n1 - n2);
                // .oderBy() of Lazy somehow does not work properly; it does only lexical sorting :-( Have to resort to sort()
    return Lazy.from(uniqueValues)
               .select(x => { return {v: x, f: lazyValues.count(y => y == x)} })
               .toArray();
}

export function CalculateForecastFromFrequencies(values: {v:number, f:number}[], invert: boolean = false): ForecastItem[] {
    var totalNumberOfSamples = values.reduce((a,e) => a + e.f, 0);
    var cycleTimesWithProbabilities = Lazy.from(values)
                                          .select(x => { return {v: x.v, f: x.f, p: x.f / totalNumberOfSamples} })
                                          .toArray()
                                          .sort((a,b) => a.v - b.v)

    if (invert) cycleTimesWithProbabilities = cycleTimesWithProbabilities.reverse();

    const forecast: ForecastItem[] = [];
    let pSum = 0;
    for (const x of cycleTimesWithProbabilities) {
        pSum = pSum + x.p;
        const f = {ct: x.v, f: x.f, p: x.p, pSum: pSum};
        forecast.push(f);
    }
    return forecast;
}