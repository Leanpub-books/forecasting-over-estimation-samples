// source: https://deno.land/std@0.113.0/flags

import { Args, parse} from "https://deno.land/std/flags/mod.ts"
import { existsSync } from "https://deno.land/std/fs/mod.ts";


export class IssueDescription {
    constructor(public readonly Categories: string[]) { }
}

export class CommandlineParameters {
    constructor(public readonly HistoricalDataSourceFilename: string,
                public readonly Mode: string,
                public readonly N: number,
                public readonly NumberOfSimulations: number,
                public readonly LevelPrefix: string) {
    }
}


export function parseCommandline(args: string[]): CommandlineParameters {
    if (args.length == 0) args = LoadFromFile();
    if (args.length == 0) printUsageAndExit();

    const parsedArgs = parse(args, {default: {n: 1, s: 10000, m: "tp", l: ""}})
    if (parsedArgs.f == undefined) printUsageAndExit("Missing source of historical data (-f)!")

    return new CommandlineParameters(parsedArgs.f, parsedArgs.m, parsedArgs.n, parsedArgs.s, parsedArgs.l);


    function LoadFromFile(): string[] {
        const COMMANDLINE_PARAMETERS_FILENAME = ".commandline.txt"
        if (existsSync(COMMANDLINE_PARAMETERS_FILENAME) == false) return [];
        return Deno.readTextFileSync(COMMANDLINE_PARAMETERS_FILENAME).split(" ");
    }


    function printUsageAndExit(errorMsg:string = "") {
        if (errorMsg != "") {
            console.log(`*** ${errorMsg}`)
            console.log()
        }
        console.log("Use with: -f <historical data csv filename> [-m <mode: tp*|dl|ct>] [-n <number of issues>] [-l <level prefix>] [ -s <number of simulations, default: 10000> ]")
        Deno.exit(1);
    }
}