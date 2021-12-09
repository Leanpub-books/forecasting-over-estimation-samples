import * as asserts from "https://deno.land/std/testing/asserts.ts";

import {parseCommandline, CommandlineParameters, IssueDescription} from "../CommandlineParser.ts";


Deno.test('Commandline with -n', () => {
    const result = parseCommandline(["-f", "myfile.csv", "-n", "3"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv", "tp", 3, 10000, ""))
});

Deno.test('Commandline with -s', () => {
    const result = parseCommandline(["-f", "myfile.csv", "-n", "1", "-s", "5000", "-l", "us_"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv", "tp", 1, 5000, "us_"))
});
