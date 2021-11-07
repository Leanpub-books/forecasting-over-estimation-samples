// source: https://deno.land/std@0.113.0/flags

import {parseCommandline} from "../modules/CommandlineParser.ts"

console.log(Deno.args)
const clip = parseCommandline(Deno.args);
console.log(clip)