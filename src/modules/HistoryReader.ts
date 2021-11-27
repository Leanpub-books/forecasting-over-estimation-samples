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
        const MSEC_IN_A_DAY = (1000 * 60 * 60 * 24);
        const calendar: Date[] = []

        const range = this.DateRange;
        var next = range[0];
        while(next <= range[1]) {
            const isWorkingDay = next.getDay() != 0 && next.getDay() != 6
            if (isWorkingDay) calendar.push(next);

            next = new Date(next.getTime() + MSEC_IN_A_DAY);
        }

        return calendar;
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