import * as asserts from "https://deno.land/std/testing/asserts.ts";

import { parse, difference, format } from "https://deno.land/std@0.113.0/datetime/mod.ts";
import {HistoricalData, HistoricalRecord, HistoricalRecordGroup, LoadHistory} from "../HistoryReader.ts"


Deno.test("Get first beginning date and last ending date", () =>{
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-11-28", "yyyy-MM-dd"), parse("2021-11-30", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-29", "yyyy-MM-dd"), parse("2021-12-02", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-13", "yyyy-MM-dd"), parse("2022-01-03", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-27", "yyyy-MM-dd"), parse("2021-12-04", "yyyy-MM-dd")),
        ]
    );

    asserts.assertEquals(sut.DateRange, [parse("2021-11-27", "yyyy-MM-dd"), parse("2022-01-03", "yyyy-MM-dd")])
})


Deno.test("Get working day calendar between first beginning and last finishing date", () =>{
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-11-26", "yyyy-MM-dd"), parse("2021-11-30", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-02", "yyyy-MM-dd"), parse("2021-12-06", "yyyy-MM-dd")),
        ]
    );

    asserts.assertEquals(sut.Calendar, [
        parse("2021-11-26", "yyyy-MM-dd"),
        parse("2021-11-27", "yyyy-MM-dd"),
        parse("2021-11-28", "yyyy-MM-dd"),
        parse("2021-11-29", "yyyy-MM-dd"),
        parse("2021-11-30", "yyyy-MM-dd"),
        parse("2021-12-01", "yyyy-MM-dd"),
        parse("2021-12-02", "yyyy-MM-dd"),
        parse("2021-12-03", "yyyy-MM-dd"),
        parse("2021-12-04", "yyyy-MM-dd"),
        parse("2021-12-05", "yyyy-MM-dd"),
        parse("2021-12-06", "yyyy-MM-dd")
    ]);
})


Deno.test("Get calendar with summer/winter time switch", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-31", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-11-01", "yyyy-MM-dd"))
        ]
    );

    asserts.assertEquals(sut.Calendar, [
        parse("2021-10-30", "yyyy-MM-dd"),
        parse("2021-10-31", "yyyy-MM-dd"),
        parse("2021-11-01", "yyyy-MM-dd"),
    ]);
})


Deno.test("Get throughputs", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-11-26", "yyyy-MM-dd"), parse("2021-12-06", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-26", "yyyy-MM-dd"), parse("2021-11-26", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-26", "yyyy-MM-dd"), parse("2021-11-29", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-27", "yyyy-MM-dd"), parse("2021-11-29", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-01", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-02", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-02", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-02", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-03", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-12-01", "yyyy-MM-dd"), parse("2021-12-03", "yyyy-MM-dd")),
        ]
    );

    asserts.assertEquals(sut.Throughputs.map(x => x.Date), [
        parse("2021-11-26", "yyyy-MM-dd"),
        parse("2021-11-27", "yyyy-MM-dd"),
        parse("2021-11-28", "yyyy-MM-dd"),
        parse("2021-11-29", "yyyy-MM-dd"),
        parse("2021-11-30", "yyyy-MM-dd"),
        parse("2021-12-01", "yyyy-MM-dd"),
        parse("2021-12-02", "yyyy-MM-dd"),
        parse("2021-12-03", "yyyy-MM-dd"),
        parse("2021-12-04", "yyyy-MM-dd"),
        parse("2021-12-05", "yyyy-MM-dd"),
        parse("2021-12-06", "yyyy-MM-dd")
    ]);

    asserts.assertEquals(sut.Throughputs.map(x => x.Throughput), [
        1,
        0,
        0,
        2,
        0,
        1,
        3,
        2,
        0,
        0,
        1
    ]);
})


Deno.test("Get throughputs across sumer/winter time switch", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-10-31", "yyyy-MM-dd"), parse("2021-10-31", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-11-01", "yyyy-MM-dd"), parse("2021-11-01", "yyyy-MM-dd")),
        ]
    );

    asserts.assertEquals(sut.Throughputs.map(x => x.Date), [
        parse("2021-10-30", "yyyy-MM-dd"),
        parse("2021-10-31", "yyyy-MM-dd"),
        parse("2021-11-01", "yyyy-MM-dd"),
    ]);

    asserts.assertEquals(sut.Throughputs.map(x => x.Throughput), [
        1,
        1,
        1
    ]);
})


Deno.test("List of categories", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), ""),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "c"),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "a,b"),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "a")
        ]
    );

    asserts.assertEquals(sut.Categories, ["a", "b", "c"])
})


Deno.test("No categories", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd")),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"))
        ]
    );

    asserts.assertEquals(sut.Categories, [])
})


Deno.test("Categories with prefix", () => {
    const sut = new HistoricalData(
        [
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), ""),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "x_c"),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "a,x_b"),
            new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"), "x_a,c")
        ]
    );

    asserts.assertEquals(sut.CategoriesWithPrefix("x_"), ["x_a", "x_b", "x_c"])
    asserts.assertEquals(sut.CategoriesWithPrefix("X_"), []) // filter is case-sensitive
    asserts.assertEquals(sut.CategoriesWithPrefix(""), ["a", "c", "x_a", "x_b", "x_c"])
})


Deno.test("Check record for category", () => {
    const sut = new HistoricalRecord(parse("2021-10-30", "yyyy-MM-dd"), parse("2021-10-30", "yyyy-MM-dd"),
                           "a,bb,bcd");
    asserts.assertEquals(sut.InCategory("a"), true);
    asserts.assertEquals(sut.InCategory("bb"), true);
    asserts.assertEquals(sut.InCategory("b"), false);
    asserts.assertEquals(sut.InCategory(""), false);
})

Deno.test("Group by category", () => {
    const r1 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-01", "yyyy-MM-dd"), "")
    const r2 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-02", "yyyy-MM-dd"), "a")
    const r3 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-03", "yyyy-MM-dd"), "a,b")
    const r4 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-04", "yyyy-MM-dd"), "b,c")
    const r5 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-01", "yyyy-MM-dd"), "")

    const sut = new HistoricalData(
        [
            r1,
            r4,
            r2,
            r5,
            r3,
        ]
    );

    asserts.assertEquals(sut.GroupByCategories(false), [
        new HistoricalRecordGroup("a", [r2,r3]),
        new HistoricalRecordGroup("b", [r4,r3]),
        new HistoricalRecordGroup("c", [r4]),
    ]);
})

Deno.test("Group by category incl no category recs", () => {
    const r1 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-01", "yyyy-MM-dd"), "")
    const r2 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-02", "yyyy-MM-dd"), "a")
    const r3 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-03", "yyyy-MM-dd"), "a,b")
    const r4 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-04", "yyyy-MM-dd"), "b,c")
    const r5 = new HistoricalRecord(parse("2021-10-01", "yyyy-MM-dd"), parse("2021-10-01", "yyyy-MM-dd"), "")

    const sut = new HistoricalData(
        [
            r1,
            r4,
            r2,
            r5,
            r3,
        ]
    );

    asserts.assertEquals(sut.GroupByCategories(), [
        new HistoricalRecordGroup("", [r1,r5]),
        new HistoricalRecordGroup("a", [r2,r3]),
        new HistoricalRecordGroup("b", [r4,r3]),
        new HistoricalRecordGroup("c", [r4]),
    ]);
})