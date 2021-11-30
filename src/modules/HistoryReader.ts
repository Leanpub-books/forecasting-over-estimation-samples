/*
    Expects a CSV file with historical data of the form:

    StartedOn header;FinishedOn header
    YYYY-MM-DD;YYYY-MM-DD
    ...

    The exact header names are not important; but a header record is required.
    The dates have to be in the given format.
 */

import { CsvRow, LoadCsv } from "./CsvReader.ts"
import { parse, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";
import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';


export class HistoricalData {
    constructor(public readonly Records: HistoricalRecord[]) { }

    FilterByCategories(pattern: string[]): HistoricalRecord[] {
        if (pattern.length == 0) return this.Records;

        const filteredRecords: HistoricalRecord[] = []
        for(const rec of this.Records) {
            // if categories are given, but the record is not categorized, then it cannot match the pattern
            if (rec.Categories.length == 0) continue;

            // for each pattern category check if the record belongs to it
            let matchesPattern = true;
            for(const c of pattern) {
                matchesPattern = rec.Categories.includes(c);
                if (matchesPattern == false) break;
            }

            if (matchesPattern)
                filteredRecords.push(rec);
        }
        return filteredRecords;
    }

    get DateRange(): Date[] {
        const first = Lazy.from(this.Records).min(x => x.StartedOn.getTime());
        const last = Lazy.from(this.Records).max(x => x.FinishedOn.getTime());
        return [new Date(first), new Date(last)];
    }

    get Calendar(): Date[] {
        const calendar: Date[] = []

        const range = this.DateRange;
        var next = new Date(range[0].getTime());
        while(next <= range[1]) {
            calendar.push(next); // all days incl. weekends
            next = new Date(next.getTime())
            next.setDate(next.getDate() + 1)
        }

        return calendar;
    }

    get Throughputs(): HistoricalThroughput[] {
        const tpCollection = new Map<number,number>()
        // initialize throughput collection
        for(const d of this.Calendar) {
            tpCollection.set(d.getTime(), 0);
        }
        // fill collection: increment throughput per day
        for(const r of this.Records) {
            tpCollection.set(r.FinishedOn.getTime(), <number>tpCollection.get(r.FinishedOn.getTime()) + 1)
        }

        // map to HistoricalThroughput[]
        return Lazy.from(tpCollection.entries())
                   .select(e => new HistoricalThroughput(new Date(e[0]), e[1]))
                   .orderBy(tp => tp.Date.getTime())
                   .toArray();
    }
}

export class HistoricalRecord {
    private readonly _cycleTime: number = 0;

    readonly Categories: string[] = [];

    constructor(public readonly StartedOn: Date,
                public readonly FinishedOn: Date,
                cycleTime: number = 0,
                categories: string = "") {
        this._cycleTime = cycleTime;
        this.Categories = categories.split(",").map((x:string) => x.trim()).filter((x:string) => x != "*" && x != "");
    }

    get CycleTimeDays(): number {
        if (this._cycleTime > 0) return this._cycleTime;
        return (<number>difference(this.FinishedOn, this.StartedOn).days);
    }
}

export class HistoricalThroughput {
    constructor(public readonly Date: Date,  public readonly Throughput: number) {}
}


export function LoadHistory(sourceFilename: string, delimiter: string = ";"): HistoricalData {
    const csv = LoadCsv(sourceFilename, delimiter);
    return CreateHistory(csv);

    function CreateHistory(csv: CsvRow[]) {
        const records = Array<HistoricalRecord>();
        for (let i = 1; i < csv.length; i++) {
            let rec = new HistoricalRecord(
                            parse(csv[i].Cols[0], "yyyy-MM-dd"),
                            parse(csv[i].Cols[1], "yyyy-MM-dd"),
                            Number(parseOptional(csv[i], 2, 0)),
                            parseOptional(csv[i], 3, "") as string)
            records.push(rec);
        }
        return new HistoricalData(records);


        function parseOptional<T>(row:CsvRow, i:number, defaultValue: string | number) {
            if (row.Cols.length <= i) return defaultValue;
            return row.Cols[i];
        }
    }
}