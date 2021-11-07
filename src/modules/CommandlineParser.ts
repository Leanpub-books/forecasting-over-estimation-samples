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

    const parsedArgs = parse(args, {default: {s: 1000, c: ""}})
    const issues = parseIssueCategories(parsedArgs);

    return new CommandlineParameters(parsedArgs.f, issues, parsedArgs.s);


    function printUsageAndExit() {
        console.log("Use with: [-n <number of issues> | -c \"<category>,<categorgy> {; ...}\" -f <historical data csv filename> [ -s <number of simulations (default: 1000)> ]")
        Deno.exit(1);
    }

    function parseIssueCategories(args: Args) {
        const issues: IssueDescription[] = [];
        if (args.n === undefined) {
            if (args.c === undefined) printUsageAndExit();

            var issueCategories = args.c.split(";")
            for (const ic of issueCategories) {
                const categories = ic.split(",")
                const issue = categories.map((x: string) => x.trim());
                issues.push(new IssueDescription(issue));
            }
        } else {
            for (let i = 1; i <= args.n; i += 1)
                issues.push(new IssueDescription([]))
        }
        return issues;
    }
}