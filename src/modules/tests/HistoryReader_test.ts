import * as asserts from "https://deno.land/std/testing/asserts.ts";

import { parse, difference, format } from "https://deno.land/std@0.113.0/datetime/mod.ts";
import {HistoricalRecord, LoadHistory} from "../HistoryReader.ts"


Deno.test('Load history', () => {
    var result = LoadHistory("tests/testHistoryReader.csv");

    asserts.assertEquals(result[0].CycleTimeDays, 2);
    asserts.assertEquals(result[1].CycleTimeDays, 5);

    asserts.assertEquals(result, [
        new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-02", "yyyy-MM-dd")),
        new HistoricalRecord(parse("2021-11-02", "yyyy-MM-dd"), parse("2021-11-07", "yyyy-MM-dd"))
    ]);
});