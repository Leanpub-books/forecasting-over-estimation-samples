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

export class HistoricalData {
    constructor(public readonly Records: HistoricalRecord[]) {    }
}

export class HistoricalRecord {
    private _cycleTime: number = 0;
    private _categories: string = "";

    constructor(public readonly StartedOn: Date,
                public readonly FinishedOn: Date,
                cycleTime: number = 0,
                categories: string = "") {
        this._cycleTime = cycleTime;
        this._categories = categories;
    }

    get CycleTimeDays(): number {
        if (this._cycleTime > 0) return this._cycleTime;
        return (<number>difference(this.FinishedOn, this.StartedOn).days);
    }

    get Categories(): string[] {
        return this._categories.split(",").map((x:string) => x.trim());
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