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

Deno.test('Number of issues and -n always equal', () => {
    let result = parseCommandline(["-f", "myfile.csv", "-n", "1"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription([])],
            1000))

    result = parseCommandline(["-f", "myfile.csv", "-c", "x"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription(["x"])],
            1000))

    result = parseCommandline(["-f", "myfile.csv", "-c", "x;y", "-n", "1"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription(["x"]), new IssueDescription(["y"])],
            1000))

    result = parseCommandline(["-f", "myfile.csv", "-c", "x", "-n", "2"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription(["x"]), new IssueDescription([])],
            1000))
});

Deno.test('Issues w/o a category', () => {
    let result = parseCommandline(["-f", "myfile.csv", "-c", ";;"])
    asserts.assertEquals(result,
        new CommandlineParameters("myfile.csv",
            [new IssueDescription([]),new IssueDescription([]),new IssueDescription([])],
            1000))
});