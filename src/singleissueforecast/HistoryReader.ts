/*
    Expects a CSV file with historical data of the form:

    StartedOn header;FinishedOn header
    YYYY-MM-DD;YYYY-MM-DD
    ...

    The exact header names are not important; but a header record is required.
    The dates have to be in the given format.
 */

import {CsvRow, LoadCsv} from "./CsvReader.ts"
import { parse, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";

export class HistoricalRecord {
    constructor(public readonly StartedOn: Date, public readonly FinishedOn: Date) { }

    get CycleTimeDays(): number { return (<number>difference(this.FinishedOn, this.StartedOn).days); }
}

export function LoadHistory(sourceFilename: string, delimiter: string = ";"): HistoricalRecord[] {
    const csv = LoadCsv(sourceFilename, delimiter);
    return CreateHistory(csv);

    function CreateHistory(csv: CsvRow[]) {
        const records = Array<HistoricalRecord>();
        for (let i = 1; i < csv.length; i++) {
            let rec = new HistoricalRecord(parse(csv[i].Cols[0], "yyyy-MM-dd"), parse(csv[i].Cols[1], "yyyy-MM-dd"))
            records.push(rec);
        }
        return records;
    }
}