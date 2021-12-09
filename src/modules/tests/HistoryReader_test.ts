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



Deno.test('Historical records with categories', () => {
    var result = LoadHistory("tests/testHistoryReader2.csv");

    let rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), "");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), "  , ,");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), "*");
    asserts.assertEquals(rec.Categories, []);

    rec = new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd"), ", *,a , ");
    asserts.assertEquals(rec.Categories, ["a"]);
});


Deno.test('Filter history', () => {
    var history = LoadHistory("tests/testHistoryReader3.csv");
    asserts.assertEquals(history.Records.length, 6)

    let result = history.FilterByCategories([]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result.length, 6)

    result = history.FilterByCategories(["a"]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result, [1,2,5])

    result = history.FilterByCategories(["b"]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result, [2,3,5])

    result = history.FilterByCategories(["b", "a"]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result, [2,5])

    result = history.FilterByCategories(["b", "c"]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result, [3,5])

    result = history.FilterByCategories(["x"]).map(x => x.CycleTimeDays)
    asserts.assertEquals(result, [])
});