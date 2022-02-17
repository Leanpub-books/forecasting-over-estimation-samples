import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';


export interface HistogramItem {
    v: number,
    f: number
};

export interface ProbabilityDistributionItem {
    v: number
    f: number
    p: number
    pSum: number
}


export class Histogram {
    public readonly Items: HistogramItem[];

    constructor(items: HistogramItem[]) {
        this.Items = items;
    }


    static fromValues(values: number[]): Histogram {
        const lazyValues = Lazy.from(values);
        const uniqueValues = lazyValues.distinct()
                                 .toArray()
                                 .sort((n1,n2) => n1 - n2);
                                    // .oderBy() of Lazy somehow does not work properly;
                                    // it does only lexical sorting :-( Have to resort to sort()
        const items = Lazy.from(uniqueValues)
                         .select(x => { return {v: x, f: lazyValues.count(y => y == x)} })
                         .toArray();
        return new Histogram(items);
    }
}


export class ProbabilityDistribution {
    static fromValues(values: number[]): ProbabilityDistribution {
        return new ProbabilityDistribution(Histogram.fromValues(values));
    }


    private _histogram: Histogram;

    constructor(histogram: Histogram) { this._histogram = histogram; }


    Items(inverted: boolean = false): ProbabilityDistributionItem[] {
        var totalNumberOfSamples = this._histogram.Items.reduce((a,e) => a + e.f, 0);
        var cycleTimesWithProbabilities = Lazy.from(this._histogram.Items)
                                              .select(x => { return {v: x.v, f: x.f, p: x.f / totalNumberOfSamples} })
                                              .toArray()
            .sort((a,b) => a.v - b.v)

        if (inverted) cycleTimesWithProbabilities = cycleTimesWithProbabilities.reverse();

        const forecast: ProbabilityDistributionItem[] = [];
        let pSum = 0;
        for (const x of cycleTimesWithProbabilities) {
            pSum = pSum + x.p;
            const f = {v: x.v, f: x.f, p: x.p, pSum: pSum};
            forecast.push(f);
        }
        return forecast;
    }
}