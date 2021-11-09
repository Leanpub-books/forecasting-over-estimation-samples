// source: https://deno.land/std@0.113.0/flags

import { Args, parse} from "https://deno.land/std/flags/mod.ts"


export class IssueDescription {
    constructor(public readonly Categories: string[]) { }
}

export class CommandlineParameters {
    constructor(public readonly HistoricalDataSourceFilename: string,
                public readonly Issues: IssueDescription[],
                public readonly NumberOfSimulations: number) {
    }
}


export function parseCommandline(args: string[]): CommandlineParameters {
    if (args.length == 0) printUsageAndExit();

    const parsedArgs = parse(args, {default: {n: 0, s: 1000}})
    if (parsedArgs.f == undefined) printUsageAndExit("Missing source of historical data (-f)!")

    const issues = parseIssueCategories(parsedArgs);

    return new CommandlineParameters(parsedArgs.f, issues, parsedArgs.s);


    function printUsageAndExit(errorMsg:string = "") {
        if (errorMsg != "") {
            console.log(`*** ${errorMsg}`)
            console.log()
        }
        console.log("Use with: [-n <number of issues> | -c \"<category>,<categorgy> {; ...}\" -f <historical data csv filename> [ -s <number of simulations (default: 1000)> ]")
        Deno.exit(1);
    }


    function parseIssueCategories(args: Args) {
        const issues: IssueDescription[] = [];

        if (args.c !== undefined) {
            var issueCategories = args.c.split(";")
            for (const ic of issueCategories) {
                const categories = ic.split(",")
                const issue = categories.map((x: string) => x.trim());
                issues.push(new IssueDescription(issue));
            }
        }

        if ((issues.length == 0) && (parsedArgs.n == 0))
            printUsageAndExit("Either -n or -c needs to be specified!")

        if (parsedArgs.n < issues.length)
            parsedArgs.n = issues.length;

        // add issues w/o categories until their number matches -n
        for (let i = issues.length+1; i <= parsedArgs.n; i += 1)
            issues.push(new IssueDescription([]));

        console.assert(issues.length == parsedArgs.n);
        return issues;
    }
}