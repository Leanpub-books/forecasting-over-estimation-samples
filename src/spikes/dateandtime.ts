// https://deno.land/std@0.113.0/datetime

import { parse, format, difference } from "https://deno.land/std@0.113.0/datetime/mod.ts";

const d = new Date(2021, 11, 31)
d.setDate(d.getDate() + 1)

console.log(`${d}`)
