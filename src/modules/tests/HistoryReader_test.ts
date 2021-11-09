import * as asserts from "https://deno.land/std/testing/asserts.ts";

import { parse, difference, format } from "https://deno.land/std@0.113.0/datetime/mod.ts";
import {HistoricalData, HistoricalRecord, LoadHistory} from "../HistoryReader.ts"


Deno.test('Load history - timestamps only', () => {
    var result = LoadHistory("tests/testHistoryReader.csv");

    asserts.assertEquals(result.Records[0].CycleTimeDays, 2);
    asserts.assertEquals(result.Records[1].CycleTimeDays, 5);

    asserts.assertEquals(result, new HistoricalData([
        new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd")),
        new HistoricalRecord(parse("2021-11-02", "yyyy-MM-dd"), parse("2021-11-07", "yyyy-MM-dd"))
    ]));
});

Deno.test('Load history - with ct and categories', () => {
    var result = LoadHistory("tests/testHistoryReader2.csv");


    asserts.assertEquals(result.Records[0].CycleTimeDays, 99);
    asserts.assertEquals(result.Records[1].CycleTimeDays, 100);

    asserts.assertEquals(result.Records[0].Categories, ["a"]);
    asserts.assertEquals(result.Records[1].Categories, ["b", "c"]);

    asserts.assertEquals(result, new HistoricalData( [
        new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), 99, "a"),
        new HistoricalRecord(parse("2021-11-02", "yyyy-MM-dd"), parse("2021-11-07", "yyyy-MM-dd"), 100, " b , c")
    ]));
});


Deno.test('Historical records with no categories', () => {
    var result = LoadHistory("tests/testHistoryReader2.csv");


    let rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), 99, "");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), 99, "  , ,");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), 99, "*");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), 99, ", *,a , ");
    asserts.assertEquals(rec.Categories, ["a"]);
});