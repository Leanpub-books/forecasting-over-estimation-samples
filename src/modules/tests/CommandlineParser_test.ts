import * as asserts from "https://deno.land/std/testing/asserts.ts";

import {parseCommandline, CommandlineParameters, IssueDescription} from "../CommandlineParser.ts";


Deno.test('Commandline with -n', () => {
    const result = parseCommandline(["-f", "myfile.csv", "-n", "3"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription([]), new IssueDescription([]), new IssueDescription([])],
            1000))
});

Deno.test('Commandline with -s', () => {
    const result = parseCommandline(["-f", "myfile.csv", "-n", "1", "-s", "5000"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription([])],
            5000))
});

Deno.test('Commandline with -c', () => {
    const result = parseCommandline(["-f", "myfile.csv", "-c", "a,b; c , d ; x , y"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription(["a", "b"]), new IssueDescription(["c","d"]), new IssueDescription(["x", "y"])],
            1000))
});