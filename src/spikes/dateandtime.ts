// https://deno.land/std@0.113.0/datetime

import { parse, format, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";

const s = parse("2021-10-31", "yyyy-MM-dd")
const f = parse("2021-11-02", "yyyy-MM-dd")

const d = (<number>difference(s, f).days)

console.log(`${d} days`)