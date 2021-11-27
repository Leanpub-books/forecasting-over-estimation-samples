// https://deno.land/std@0.113.0/datetime

import { parse, format, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";

const d = parse("2021-11-26", "yyyy-MM-dd")
console.log(d)

var e = new Date(d.getTime() + (24*60*60*1000))
console.log(e)

console.log(e.getDay())