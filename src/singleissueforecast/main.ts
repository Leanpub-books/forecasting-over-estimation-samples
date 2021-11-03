// @ts-ignore
import { readCSV } from "https://deno.land/x/csv/mod.ts"; // https://deno.land/x/csv@v0.4.0

import { parse, format, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";

const f = await Deno.open("./sample.csv");

const rows = new Array();
for await (const row of readCSV(f, {columnSeparator: ";", lineSeparator: "\r\n"})) {
    const cols = new Array();
    for await (const cell of row) cols.push(cell);
    rows.push(cols);
}

var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
for(var i=1; i<rows.length; i++) {
    const beginn = parse(rows[i][0], "yyyy-MM-dd");
    const ende = parse(rows[i][1], "yyyy-MM-dd");
    const ct = difference(ende, beginn, {units:["days"]});
    console.log(`${format(beginn, "dd.MM.yyyy")} / ${format(ende, "dd.MM.yyyy")} : ${ct.days}`);
}

f.close();