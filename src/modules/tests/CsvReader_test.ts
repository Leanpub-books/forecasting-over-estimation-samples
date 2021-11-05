import * as asserts from "https://deno.land/std/testing/asserts.ts";

import { LoadCsv } from "../CsvReader.ts"

Deno.test('Load csv', () => {
    var result = LoadCsv("tests/testCsvReader.csv");

    asserts.assertEquals(result, [
        {Cols:["A", "BB", "CCC"]},
        {Cols:["a", "bb", "ccc"]},
        {Cols:["x", "y"]}
    ]);
});