class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const { hasOwn  } = Object;
function get(obj, key) {
    if (hasOwn(obj, key)) {
        return obj[key];
    }
}
function getForce(obj, key) {
    const v = get(obj, key);
    assert(v != null);
    return v;
}
function isNumber(x) {
    if (typeof x === "number") return true;
    if (/^0x[0-9a-f]+$/i.test(String(x))) return true;
    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
}
function hasKey(obj, keys) {
    let o = obj;
    keys.slice(0, -1).forEach((key)=>{
        o = get(o, key) ?? {
        };
    });
    const key = keys[keys.length - 1];
    return key in o;
}
function parse(args, { "--": doubleDash = false , alias ={
} , boolean: __boolean = false , default: defaults = {
} , stopEarly =false , string =[] , unknown =(i)=>i
  } = {
}) {
    const flags = {
        bools: {
        },
        strings: {
        },
        unknownFn: unknown,
        allBools: false
    };
    if (__boolean !== undefined) {
        if (typeof __boolean === "boolean") {
            flags.allBools = !!__boolean;
        } else {
            const booleanArgs = typeof __boolean === "string" ? [
                __boolean
            ] : __boolean;
            for (const key of booleanArgs.filter(Boolean)){
                flags.bools[key] = true;
            }
        }
    }
    const aliases = {
    };
    if (alias !== undefined) {
        for(const key in alias){
            const val = getForce(alias, key);
            if (typeof val === "string") {
                aliases[key] = [
                    val
                ];
            } else {
                aliases[key] = val;
            }
            for (const alias1 of getForce(aliases, key)){
                aliases[alias1] = [
                    key
                ].concat(aliases[key].filter((y)=>alias1 !== y
                ));
            }
        }
    }
    if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [
            string
        ] : string;
        for (const key of stringArgs.filter(Boolean)){
            flags.strings[key] = true;
            const alias = get(aliases, key);
            if (alias) {
                for (const al of alias){
                    flags.strings[al] = true;
                }
            }
        }
    }
    const argv = {
        _: []
    };
    function argDefined(key, arg) {
        return flags.allBools && /^--[^=]+$/.test(arg) || get(flags.bools, key) || !!get(flags.strings, key) || !!get(aliases, key);
    }
    function setKey(obj, keys, value) {
        let o = obj;
        keys.slice(0, -1).forEach(function(key) {
            if (get(o, key) === undefined) {
                o[key] = {
                };
            }
            o = get(o, key);
        });
        const key = keys[keys.length - 1];
        if (get(o, key) === undefined || get(flags.bools, key) || typeof get(o, key) === "boolean") {
            o[key] = value;
        } else if (Array.isArray(get(o, key))) {
            o[key].push(value);
        } else {
            o[key] = [
                get(o, key),
                value
            ];
        }
    }
    function setArg(key, val, arg = undefined) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
            if (flags.unknownFn(arg, key, val) === false) return;
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val) : val;
        setKey(argv, key.split("."), value);
        const alias = get(aliases, key);
        if (alias) {
            for (const x of alias){
                setKey(argv, x.split("."), value);
            }
        }
    }
    function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x)=>typeof get(flags.bools, x) === "boolean"
        );
    }
    for (const key of Object.keys(flags.bools)){
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
    }
    let notFlags = [];
    if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
    }
    for(let i = 0; i < args.length; i++){
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
            const m = arg.match(/^--([^=]+)=(.*)$/s);
            assert(m != null);
            const [, key, value] = m;
            if (flags.bools[key]) {
                const booleanValue = value !== "false";
                setArg(key, booleanValue, arg);
            } else {
                setArg(key, value, arg);
            }
        } else if (/^--no-.+/.test(arg)) {
            const m = arg.match(/^--no-(.+)/);
            assert(m != null);
            setArg(m[1], false, arg);
        } else if (/^--.+/.test(arg)) {
            const m = arg.match(/^--(.+)/);
            assert(m != null);
            const [, key] = m;
            const next = args[i + 1];
            if (next !== undefined && !/^-/.test(next) && !get(flags.bools, key) && !flags.allBools && (get(aliases, key) ? !aliasIsBoolean(key) : true)) {
                setArg(key, next, arg);
                i++;
            } else if (/^(true|false)$/.test(next)) {
                setArg(key, next === "true", arg);
                i++;
            } else {
                setArg(key, get(flags.strings, key) ? "" : true, arg);
            }
        } else if (/^-[^-]+/.test(arg)) {
            const letters = arg.slice(1, -1).split("");
            let broken = false;
            for(let j = 0; j < letters.length; j++){
                const next = arg.slice(j + 2);
                if (next === "-") {
                    setArg(letters[j], next, arg);
                    continue;
                }
                if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                    setArg(letters[j], next.split(/=(.+)/)[1], arg);
                    broken = true;
                    break;
                }
                if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                    setArg(letters[j], next, arg);
                    broken = true;
                    break;
                }
                if (letters[j + 1] && letters[j + 1].match(/\W/)) {
                    setArg(letters[j], arg.slice(j + 2), arg);
                    broken = true;
                    break;
                } else {
                    setArg(letters[j], get(flags.strings, letters[j]) ? "" : true, arg);
                }
            }
            const [key] = arg.slice(-1);
            if (!broken && key !== "-") {
                if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !get(flags.bools, key) && (get(aliases, key) ? !aliasIsBoolean(key) : true)) {
                    setArg(key, args[i + 1], arg);
                    i++;
                } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
                    setArg(key, args[i + 1] === "true", arg);
                    i++;
                } else {
                    setArg(key, get(flags.strings, key) ? "" : true, arg);
                }
            }
        } else {
            if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                argv._.push(flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg));
            }
            if (stopEarly) {
                argv._.push(...args.slice(i + 1));
                break;
            }
        }
    }
    for (const key1 of Object.keys(defaults)){
        if (!hasKey(argv, key1.split("."))) {
            setKey(argv, key1.split("."), defaults[key1]);
            if (aliases[key1]) {
                for (const x of aliases[key1]){
                    setKey(argv, x.split("."), defaults[key1]);
                }
            }
        }
    }
    if (doubleDash) {
        argv["--"] = [];
        for (const key of notFlags){
            argv["--"].push(key);
        }
    } else {
        for (const key of notFlags){
            argv._.push(key);
        }
    }
    return argv;
}
class IssueDescription {
    Categories;
    constructor(Categories){
        this.Categories = Categories;
    }
}
class CommandlineParameters {
    HistoricalDataSourceFilename;
    Issues;
    NumberOfSimulations;
    constructor(HistoricalDataSourceFilename, Issues, NumberOfSimulations){
        this.HistoricalDataSourceFilename = HistoricalDataSourceFilename;
        this.Issues = Issues;
        this.NumberOfSimulations = NumberOfSimulations;
    }
}
function parseCommandline(args) {
    if (args.length == 0) printUsageAndExit();
    const parsedArgs = parse(args, {
        default: {
            n: 0,
            s: 1000
        }
    });
    if (parsedArgs.f == undefined) printUsageAndExit("Missing source of historical data (-f)!");
    const issues = parseIssueCategories(parsedArgs);
    return new CommandlineParameters(parsedArgs.f, issues, parsedArgs.s);
    function printUsageAndExit(errorMsg = "") {
        if (errorMsg != "") {
            console.log(`*** ${errorMsg}`);
            console.log();
        }
        console.log("Use with: [-n <number of issues> | -c \"<category>,<categorgy> {; ...}\" -f <historical data csv filename> [ -s <number of simulations (default: 1000)> ]");
        Deno.exit(1);
    }
    function parseIssueCategories(args) {
        const issues = [];
        if (args.c !== undefined) {
            var issueCategories = args.c.split(";");
            for (const ic of issueCategories){
                const categories = ic.split(",");
                const issue = categories.map((x)=>x.trim()
                ).filter((x)=>x != ""
                );
                issues.push(new IssueDescription(issue));
            }
        }
        if (issues.length == 0 && parsedArgs.n == 0) printUsageAndExit("Either -n or -c needs to be specified!");
        if (parsedArgs.n < issues.length) parsedArgs.n = issues.length;
        for(let i = issues.length + 1; i <= parsedArgs.n; i += 1)issues.push(new IssueDescription([]));
        console.assert(issues.length == parsedArgs.n);
        return issues;
    }
}
function LoadCsv(sourceFilename, delimiter = ";") {
    const text = Deno.readTextFileSync(sourceFilename);
    const rows = text.split("\n");
    const result = new Array();
    for (const row of rows){
        const cols = row.trim().split(delimiter);
        result.push({
            Cols: cols
        });
    }
    return result;
}
class Tokenizer {
    rules;
    constructor(rules = []){
        this.rules = rules;
    }
    addRule(test, fn) {
        this.rules.push({
            test,
            fn
        });
        return this;
    }
    tokenize(string, receiver = (token)=>token
    ) {
        function* generator(rules) {
            let index = 0;
            for (const rule of rules){
                const result = rule.test(string);
                if (result) {
                    const { value , length  } = result;
                    index += length;
                    string = string.slice(length);
                    const token = {
                        ...rule.fn(value),
                        index
                    };
                    yield receiver(token);
                    yield* generator(rules);
                }
            }
        }
        const tokenGenerator = generator(this.rules);
        const tokens = [];
        for (const token of tokenGenerator){
            tokens.push(token);
        }
        if (string.length) {
            throw new Error(`parser error: string not fully parsed! ${string.slice(0, 25)}`);
        }
        return tokens;
    }
}
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string)=>{
        return string.startsWith(value) ? {
            value,
            length: value.length
        } : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string)=>{
        const result = match.exec(string);
        if (result) return {
            value: result,
            length: result[0].length
        };
    };
}
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: ()=>({
                type: "year",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: ()=>({
                type: "year",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: ()=>({
                type: "month",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("M"),
        fn: ()=>({
                type: "month",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: ()=>({
                type: "day",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("d"),
        fn: ()=>({
                type: "day",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: ()=>({
                type: "hour",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("H"),
        fn: ()=>({
                type: "hour",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: ()=>({
                type: "hour",
                value: "2-digit",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("h"),
        fn: ()=>({
                type: "hour",
                value: "numeric",
                hour12: true
            })
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: ()=>({
                type: "minute",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("m"),
        fn: ()=>({
                type: "minute",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: ()=>({
                type: "second",
                value: "2-digit"
            })
    },
    {
        test: createLiteralTestFunction("s"),
        fn: ()=>({
                type: "second",
                value: "numeric"
            })
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 3
            })
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 2
            })
    },
    {
        test: createLiteralTestFunction("S"),
        fn: ()=>({
                type: "fractionalSecond",
                value: 1
            })
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value)=>({
                type: "dayPeriod",
                value: value
            })
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match)=>({
                type: "literal",
                value: match.groups.value
            })
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match)=>({
                type: "literal",
                value: match[0]
            })
    }, 
];
class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules){
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type , value , hour12  })=>{
            const result = {
                type,
                value
            };
            if (hour12) result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {
    }) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format){
            const type = token.type;
            switch(type){
                case "year":
                    {
                        const value = utc ? date.getUTCFullYear() : date.getFullYear();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2).slice(-2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "month":
                    {
                        const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        const value = utc ? date.getUTCDate() : date.getDate();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        let value = utc ? date.getUTCHours() : date.getHours();
                        value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        const value = utc ? date.getUTCMinutes() : date.getMinutes();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        const value = utc ? date.getUTCSeconds() : date.getSeconds();
                        switch(token.value){
                            case "numeric":
                                {
                                    string += value;
                                    break;
                                }
                            case "2-digit":
                                {
                                    string += digits(value, 2);
                                    break;
                                }
                            default:
                                throw Error(`FormatterError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
                        string += digits(value, Number(token.value));
                        break;
                    }
                case "timeZoneName":
                    {
                        break;
                    }
                case "dayPeriod":
                    {
                        string += token.value ? date.getHours() >= 12 ? "PM" : "AM" : "";
                        break;
                    }
                case "literal":
                    {
                        string += token.value;
                        break;
                    }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format){
            const type = token.type;
            let value = "";
            switch(token.type){
                case "year":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,4}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                        }
                        break;
                    }
                case "month":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            case "narrow":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "short":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            case "long":
                                {
                                    value = /^[a-zA-Z]+/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "day":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "hour":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                                    }
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    if (token.hour12 && parseInt(value) > 12) {
                                        console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                                    }
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "minute":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "second":
                    {
                        switch(token.value){
                            case "numeric":
                                {
                                    value = /^\d{1,2}/.exec(string)?.[0];
                                    break;
                                }
                            case "2-digit":
                                {
                                    value = /^\d{2}/.exec(string)?.[0];
                                    break;
                                }
                            default:
                                throw Error(`ParserError: value "${token.value}" is not supported`);
                        }
                        break;
                    }
                case "fractionalSecond":
                    {
                        value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                        break;
                    }
                case "timeZoneName":
                    {
                        value = token.value;
                        break;
                    }
                case "dayPeriod":
                    {
                        value = /^(A|P)M/.exec(string)?.[0];
                        break;
                    }
                case "literal":
                    {
                        if (!string.startsWith(token.value)) {
                            throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                        }
                        value = token.value;
                        break;
                    }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({
                type,
                value
            });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond", 
        ];
        for (const type of typeArray){
            const current = parts.findIndex((el)=>el.type === type
            );
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part)=>part.type === "timeZoneName" && part.value === "UTC"
        );
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts){
            switch(part.type){
                case "year":
                    {
                        const value = Number(part.value.padStart(4, "20"));
                        utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                        break;
                    }
                case "month":
                    {
                        const value = Number(part.value) - 1;
                        utc ? date.setUTCMonth(value) : date.setMonth(value);
                        break;
                    }
                case "day":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCDate(value) : date.setDate(value);
                        break;
                    }
                case "hour":
                    {
                        let value = Number(part.value);
                        const dayPeriod = parts.find((part)=>part.type === "dayPeriod"
                        );
                        if (dayPeriod?.value === "PM") value += 12;
                        utc ? date.setUTCHours(value) : date.setHours(value);
                        break;
                    }
                case "minute":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                        break;
                    }
                case "second":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                        break;
                    }
                case "fractionalSecond":
                    {
                        const value = Number(part.value);
                        utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                        break;
                    }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
const SECOND = 1000;
const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
var Day;
(function(Day) {
    Day[Day["Sun"] = 0] = "Sun";
    Day[Day["Mon"] = 1] = "Mon";
    Day[Day["Tue"] = 2] = "Tue";
    Day[Day["Wed"] = 3] = "Wed";
    Day[Day["Thu"] = 4] = "Thu";
    Day[Day["Fri"] = 5] = "Fri";
    Day[Day["Sat"] = 6] = "Sat";
})(Day || (Day = {
}));
function parse1(dateString, formatString) {
    const formatter = new DateTimeFormatter(formatString);
    const parts = formatter.parseToParts(dateString);
    const sortParts = formatter.sortDateTimeFormatPart(parts);
    return formatter.partsToDate(sortParts);
}
function difference(from, to, options) {
    const uniqueUnits = options?.units ? [
        ...new Set(options?.units)
    ] : [
        "milliseconds",
        "seconds",
        "minutes",
        "hours",
        "days",
        "weeks",
        "months",
        "quarters",
        "years", 
    ];
    const bigger = Math.max(from.getTime(), to.getTime());
    const smaller = Math.min(from.getTime(), to.getTime());
    const differenceInMs = bigger - smaller;
    const differences = {
    };
    for (const uniqueUnit of uniqueUnits){
        switch(uniqueUnit){
            case "milliseconds":
                differences.milliseconds = differenceInMs;
                break;
            case "seconds":
                differences.seconds = Math.floor(differenceInMs / SECOND);
                break;
            case "minutes":
                differences.minutes = Math.floor(differenceInMs / MINUTE);
                break;
            case "hours":
                differences.hours = Math.floor(differenceInMs / HOUR);
                break;
            case "days":
                differences.days = Math.floor(differenceInMs / DAY);
                break;
            case "weeks":
                differences.weeks = Math.floor(differenceInMs / WEEK);
                break;
            case "months":
                differences.months = calculateMonthsDifference(bigger, smaller);
                break;
            case "quarters":
                differences.quarters = Math.floor(typeof differences.months !== "undefined" && differences.months / 4 || calculateMonthsDifference(bigger, smaller) / 4);
                break;
            case "years":
                differences.years = Math.floor(typeof differences.months !== "undefined" && differences.months / 12 || calculateMonthsDifference(bigger, smaller) / 12);
                break;
        }
    }
    return differences;
}
function calculateMonthsDifference(bigger, smaller) {
    const biggerDate = new Date(bigger);
    const smallerDate = new Date(smaller);
    const yearsDiff = biggerDate.getFullYear() - smallerDate.getFullYear();
    const monthsDiff = biggerDate.getMonth() - smallerDate.getMonth();
    const calendarDifferences = Math.abs(yearsDiff * 12 + monthsDiff);
    const compareResult = biggerDate > smallerDate ? 1 : -1;
    biggerDate.setMonth(biggerDate.getMonth() - compareResult * calendarDifferences);
    const isLastMonthNotFull = biggerDate > smallerDate ? 1 : -1 === -compareResult ? 1 : 0;
    const months = compareResult * (calendarDifferences - isLastMonthNotFull);
    return months === 0 ? 0 : months;
}
var Errors;
(function(Errors) {
    Errors["Empty"] = 'Empty iterable';
    Errors["NonNumber"] = 'Cannot perform function on a non-number value';
})(Errors || (Errors = {
}));
function aggregate(iterable, agg, seed) {
    const gotSeed = arguments.length >= 3;
    if (gotSeed) {
        let acc = seed;
        for (const element of iterable){
            acc = agg(acc, element);
        }
        return acc;
    } else {
        let items = false;
        let acc;
        for (const element of iterable){
            if (!items) {
                acc = element;
            } else {
                acc = agg(acc, element);
            }
            items = true;
        }
        if (!items) {
            throw new Error(Errors.Empty);
        }
        return acc;
    }
}
function all(iterable, predicate) {
    for (const element of iterable){
        if (!predicate(element)) {
            return false;
        }
    }
    return true;
}
function any(iterable, predicate) {
    if (predicate) {
        for (const element of iterable){
            if (predicate(element)) {
                return true;
            }
        }
        return false;
    } else {
        return !iterable[Symbol.iterator]().next().done;
    }
}
function average(iterable, selector) {
    let total = 0;
    let ccount = 0;
    for (const element of iterable){
        const value = selector ? selector(element) : element;
        if (typeof value !== 'number') {
            throw new TypeError(Errors.NonNumber);
        }
        total += value;
        ccount++;
    }
    if (ccount === 0) {
        throw new Error(Errors.Empty);
    }
    return total / ccount;
}
function contains(iterable, element, comparer) {
    for (const ielement of iterable){
        if (comparer ? comparer(element, ielement) : element === ielement) {
            return true;
        }
    }
    return false;
}
function count(iterable, predicate) {
    let ccount = 0;
    for (const element of iterable){
        if (!predicate || predicate(element)) {
            ccount++;
        }
    }
    return ccount;
}
function getElementAt(iterable, index) {
    let cindex = 0;
    for (const element of iterable){
        if (cindex === index) {
            return {
                found: true,
                element
            };
        }
        cindex++;
    }
    return {
        found: false
    };
}
function elementAt(iterable, index) {
    if (index < 0) {
        throw new Error('Index cannot be negative');
    }
    const res = getElementAt(iterable, index);
    if (res.found) {
        return res.element;
    } else {
        throw new Error(`No element found at index ${index}`);
    }
}
function elementAtOrDefault(iterable, index, defaultValue) {
    const res = getElementAt(iterable, index);
    if (res.found) {
        return res.element;
    } else {
        return defaultValue;
    }
}
function getFirst(iterable, predicate) {
    for (const element of iterable){
        if (!predicate || predicate(element)) {
            return {
                items: true,
                element
            };
        }
    }
    return {
        items: false
    };
}
function first(iterable, predicate) {
    const res = getFirst(iterable, predicate);
    if (res.items) {
        return res.element;
    } else {
        throw new Error(Errors.Empty);
    }
}
function firstOrDefault(iterable, defaultValue, predicate) {
    const res = getFirst(iterable, predicate);
    if (res.items) {
        return res.element;
    } else {
        return defaultValue;
    }
}
function forEach(iterable, callbackFn) {
    let index = 0;
    for (const element of iterable){
        callbackFn(element, index);
        index++;
    }
}
function iterableEquals(firstIterable, secondIterable, comparer) {
    let done = false;
    const firstIter = firstIterable[Symbol.iterator]();
    let firstMove;
    const secondIter = secondIterable[Symbol.iterator]();
    let secondMove;
    do {
        firstMove = firstIter.next();
        secondMove = secondIter.next();
        if (firstMove.done !== secondMove.done) {
            return false;
        } else if (firstMove.done && secondMove.done) {
            done = true;
        } else if (comparer ? !comparer(firstMove.value, secondMove.value) : firstMove.value !== secondMove.value) {
            return false;
        }
    }while (!done)
    return true;
}
function getLast(iterable, predicate) {
    let items = false;
    let latest;
    for (const element of iterable){
        if (!predicate || predicate(element)) {
            latest = element;
            items = true;
        }
    }
    if (items) {
        return {
            items: true,
            element: latest
        };
    } else {
        return {
            items: false
        };
    }
}
function last(iterable, predicate) {
    const res = getLast(iterable, predicate);
    if (res.items) {
        return res.element;
    } else {
        throw new Error(Errors.Empty);
    }
}
function lastOrDefault(iterable, defaultValue, predicate) {
    const res = getLast(iterable, predicate);
    if (res.items) {
        return res.element;
    } else {
        return defaultValue;
    }
}
function max(iterable, selector) {
    let cmax = -Infinity;
    let items = false;
    for (const element of iterable){
        const value = selector ? selector(element) : element;
        if (typeof value !== 'number') {
            throw new TypeError(Errors.NonNumber);
        }
        if (value > cmax) {
            cmax = value;
        }
        items = true;
    }
    if (!items) {
        throw new Error(Errors.Empty);
    }
    return cmax;
}
function min(iterable, selector) {
    let cmin = +Infinity;
    let items = false;
    for (const element of iterable){
        const value = selector ? selector(element) : element;
        if (typeof value !== 'number') {
            throw new TypeError(Errors.NonNumber);
        }
        if (value < cmin) {
            cmin = value;
        }
        items = true;
    }
    if (!items) {
        throw new Error(Errors.Empty);
    }
    return cmin;
}
function resolveAll(iterable) {
    return Promise.all(iterable);
}
function getSingle(iterable, predicate) {
    for (const element of iterable){
        if (predicate(element)) {
            return {
                found: true,
                element
            };
        }
    }
    return {
        found: false
    };
}
function single(iterable, predicate) {
    const res = getSingle(iterable, predicate);
    if (res.found) {
        return res.element;
    } else {
        throw new Error(Errors.Empty);
    }
}
function singleOrDefault(iterable, predicate, defaultValue) {
    const res = getSingle(iterable, predicate);
    if (res.found) {
        return res.element;
    } else {
        return defaultValue;
    }
}
function stringJoin(iterable, separator = '', strFn = String) {
    let str = '';
    let started = false;
    for (const element of iterable){
        if (started) {
            str += separator;
        }
        str += strFn(element);
        started = true;
    }
    return str;
}
function sum(iterable, selector) {
    let total = 0;
    let items = false;
    for (const element of iterable){
        const value = selector ? selector(element) : element;
        if (typeof value !== 'number') {
            throw new TypeError(Errors.NonNumber);
        }
        total += value;
        items = true;
    }
    if (!items) {
        throw new Error(Errors.Empty);
    }
    return total;
}
function toArray(iterable) {
    const arr = [];
    for (const element of iterable){
        arr.push(element);
    }
    return arr;
}
function toMap(iterable, keyFn, valueFn) {
    const map = new Map();
    for (const element of iterable){
        const key = keyFn(element);
        if (map.has(key)) {
            throw new Error('Duplicate key found');
        }
        map.set(key, valueFn ? valueFn(element) : element);
    }
    return map;
}
function doneNext() {
    return {
        done: true,
        value: undefined
    };
}
function done(iterator) {
    iterator.next = doneNext;
    return doneNext();
}
class Queue {
    static _maxLeftoverCount = 10000;
    _buffer = [];
    _front = 0;
    get length() {
        return this._buffer.length - this._front;
    }
    enqueue(element) {
        this._buffer.push(element);
    }
    dequeue() {
        if (this.length === 0) {
            throw new Error('Cannot dequeue an empty queue');
        }
        const element = this._buffer[this._front];
        if (++this._front * 2 >= this._buffer.length) {
            this._buffer = this._buffer.slice(this._front);
            this._front = 0;
        } else if (this._front >= Queue._maxLeftoverCount) {
            this._buffer[this._front] = undefined;
        }
        return element;
    }
}
class LazyRangeIterator {
    _end;
    _index;
    _direction;
    constructor(_start, _end){
        this._end = _end;
        this._index = _start;
        this._direction = _end < _start ? -1 : 1;
    }
    next() {
        if (this._direction > 0 ? this._index >= this._end : this._index <= this._end) {
            return done(this);
        } else {
            const nextResult = {
                done: false,
                value: this._index
            };
            this._index += this._direction;
            return nextResult;
        }
    }
}
class LazyRepeatIterator {
    _element;
    _count;
    _index = 0;
    constructor(_element, _count){
        this._element = _element;
        this._count = _count;
    }
    next() {
        if (this._index >= this._count) {
            return done(this);
        } else {
            const nextResult = {
                done: false,
                value: this._element
            };
            this._index++;
            return nextResult;
        }
    }
}
class LazyAppendPrependIterator {
    _element;
    _atStart;
    _iterator;
    _started = false;
    _finished = false;
    constructor(iterable, _element, _atStart){
        this._element = _element;
        this._atStart = _atStart;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        if (this._finished) {
            return done(this);
        }
        if (!this._started) {
            this._started = true;
            if (this._atStart) {
                return {
                    done: false,
                    value: this._element
                };
            }
        }
        const result = this._iterator.next();
        if (result.done) {
            this._finished = true;
            if (!this._atStart) {
                return {
                    done: false,
                    value: this._element
                };
            } else {
                return done(this);
            }
        } else {
            return result;
        }
    }
}
class LazyBatchInIterator {
    _batchSize;
    _includeIncomplete;
    _iterator;
    _done = false;
    constructor(iterable, _batchSize, _includeIncomplete){
        this._batchSize = _batchSize;
        this._includeIncomplete = _includeIncomplete;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        if (this._done) {
            return done(this);
        }
        const batch = [];
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                this._done = true;
                if (batch.length > 0 && this._includeIncomplete) {
                    return {
                        done: false,
                        value: batch
                    };
                } else {
                    return done(this);
                }
            } else {
                batch.push(result.value);
                if (batch.length === this._batchSize) {
                    return {
                        done: false,
                        value: batch
                    };
                }
            }
        }
    }
}
class LazyConcatIterator {
    _iterators = [];
    _current = 0;
    constructor(iterables){
        for (const iterable of iterables){
            this._iterators.push(iterable[Symbol.iterator]());
        }
    }
    next() {
        if (this._current >= this._iterators.length) {
            return done(this);
        }
        while(this._current < this._iterators.length){
            const result = this._iterators[this._current].next();
            if (!result.done) {
                return result;
            } else {
                this._current++;
            }
        }
        return done(this);
    }
}
class LazyDefaultIfEmptyIterator {
    _defaultValue;
    _iterator;
    _started = false;
    _done = false;
    constructor(iterable, _defaultValue){
        this._defaultValue = _defaultValue;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        if (this._done) {
            return done(this);
        }
        const result = this._iterator.next();
        if (!this._started) {
            this._started = true;
            if (result.done) {
                this._done = true;
                return {
                    done: false,
                    value: this._defaultValue
                };
            } else {
                return result;
            }
        } else {
            return result;
        }
    }
}
class LazyDistinctIterator {
    _compareOn;
    _iterator;
    _found = new Set();
    constructor(iterable, _compareOn){
        this._compareOn = _compareOn;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                return done(this);
            } else {
                const key = this._compareOn ? this._compareOn(result.value) : result.value;
                if (!this._found.has(key)) {
                    this._found.add(key);
                    return result;
                }
            }
        }
    }
}
class LazyExceptIterator {
    _compareOn;
    _firstIterator;
    _set = new Set();
    constructor(firstIterable, secondIterable, _compareOn){
        this._compareOn = _compareOn;
        this._firstIterator = firstIterable[Symbol.iterator]();
        for (const element of secondIterable){
            this._set.add(_compareOn ? _compareOn(element) : element);
        }
    }
    next() {
        while(true){
            const result = this._firstIterator.next();
            if (result.done) {
                return done(this);
            } else {
                const key = this._compareOn ? this._compareOn(result.value) : result.value;
                if (!this._set.has(key)) {
                    this._set.add(key);
                    return result;
                }
            }
        }
    }
}
class LazyGroupByIterator {
    _resultSelector;
    _elementMapIterator;
    constructor(iterable, keyFn, elementSelector, _resultSelector){
        this._resultSelector = _resultSelector;
        const elementMap = new Map();
        for (const element of iterable){
            const key = keyFn(element);
            const result = elementSelector ? elementSelector(element) : element;
            const arr = elementMap.get(key);
            if (!arr) {
                elementMap.set(key, [
                    result
                ]);
            } else {
                arr.push(result);
            }
        }
        this._elementMapIterator = elementMap[Symbol.iterator]();
    }
    next() {
        const result = this._elementMapIterator.next();
        if (result.done) {
            return done(this);
        } else {
            const element = this._resultSelector ? this._resultSelector(result.value[0], result.value[1]) : {
                key: result.value[0],
                elements: result.value[1]
            };
            return {
                done: false,
                value: element
            };
        }
    }
}
class LazyGroupJoinIterator {
    _firstKeyFn;
    _joinFn;
    _firstIterator;
    _secondMap = new Map();
    constructor(firstIterable, secondIterable, _firstKeyFn, secondKeyFn, _joinFn){
        this._firstKeyFn = _firstKeyFn;
        this._joinFn = _joinFn;
        this._firstIterator = firstIterable[Symbol.iterator]();
        for (const secondElement of secondIterable){
            const key = secondKeyFn(secondElement);
            const arr = this._secondMap.get(key);
            if (!arr) {
                this._secondMap.set(key, [
                    secondElement
                ]);
            } else {
                arr.push(secondElement);
            }
        }
    }
    next() {
        while(true){
            const result = this._firstIterator.next();
            if (result.done) {
                return done(this);
            } else {
                const key = this._firstKeyFn(result.value);
                const secondElements = this._secondMap.get(key);
                if (secondElements) {
                    return {
                        done: false,
                        value: this._joinFn(result.value, secondElements)
                    };
                }
            }
        }
    }
}
class LazyIntersectIterator {
    _compareOn;
    _firstIterator;
    _set = new Set();
    constructor(firstIterable, secondIterable, _compareOn){
        this._compareOn = _compareOn;
        this._firstIterator = firstIterable[Symbol.iterator]();
        for (const element of secondIterable){
            const key = _compareOn ? _compareOn(element) : element;
            this._set.add(key);
        }
    }
    next() {
        while(true){
            const result = this._firstIterator.next();
            if (result.done) {
                return done(this);
            } else {
                const key = this._compareOn ? this._compareOn(result.value) : result.value;
                if (this._set.has(key)) {
                    this._set.delete(key);
                    return result;
                }
            }
        }
    }
}
class LazyJoinIterator {
    _firstKeyFn;
    _joinFn;
    _firstIterator;
    _secondMap;
    constructor(firstIterable, secondIterable, _firstKeyFn, secondKeyFn, _joinFn){
        this._firstKeyFn = _firstKeyFn;
        this._joinFn = _joinFn;
        this._firstIterator = firstIterable[Symbol.iterator]();
        this._secondMap = toMap(secondIterable, secondKeyFn);
    }
    next() {
        while(true){
            const result = this._firstIterator.next();
            if (result.done) {
                return done(this);
            } else {
                const key = this._firstKeyFn(result.value);
                const secondElement = this._secondMap.get(key);
                if (secondElement) {
                    return {
                        done: false,
                        value: this._joinFn(result.value, secondElement)
                    };
                }
            }
        }
    }
}
function defaultComparer(a, b) {
    return ('' + a).localeCompare('' + b);
}
function numericComparer(a, b) {
    return a - b;
}
function comparerFactory(keyFn, reverse, compareFn = defaultComparer) {
    return (a, b)=>{
        if (reverse) {
            const t = a;
            a = b;
            b = t;
        }
        return compareFn(keyFn(a), keyFn(b));
    };
}
function lazyOrderBy(iterable, keyFn, compareFn, decending) {
    const arr = toArray(iterable);
    arr.sort(comparerFactory(keyFn, decending, compareFn));
    return arr[Symbol.iterator]();
}
class LazyReverseIterator {
    _arr;
    _index;
    constructor(iterable){
        this._arr = toArray(iterable);
        this._index = this._arr.length - 1;
    }
    next() {
        if (this._index < 0) {
            return done(this);
        } else {
            const nextResult = {
                done: false,
                value: this._arr[this._index]
            };
            this._index--;
            return nextResult;
        }
    }
}
class LazySelectIterator {
    _selector;
    _iterator;
    _index = 0;
    constructor(iterable, _selector){
        this._selector = _selector;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        const result = this._iterator.next();
        if (result.done) {
            return done(this);
        } else {
            const nextResult = {
                done: false,
                value: this._selector(result.value, this._index)
            };
            this._index++;
            return nextResult;
        }
    }
}
class LazySelectManyIterator {
    _selector;
    _iterator;
    _internalIterator;
    _index = 0;
    constructor(iterable, _selector){
        this._selector = _selector;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            if (!this._internalIterator) {
                const result = this._iterator.next();
                if (result.done) {
                    return done(this);
                } else {
                    const element = this._selector(result.value, this._index);
                    this._index++;
                    this._internalIterator = element[Symbol.iterator]();
                }
            }
            const internalResult = this._internalIterator.next();
            if (internalResult.done) {
                this._internalIterator = undefined;
            } else {
                return internalResult;
            }
        }
    }
}
class LazySkipIterator {
    _count;
    _iterator;
    _skipped = 0;
    constructor(iterable, _count){
        this._count = _count;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                return done(this);
            } else {
                if (this._skipped < this._count) {
                    this._skipped++;
                } else {
                    return result;
                }
            }
        }
    }
}
class LazySkipLastIterator {
    _count;
    _iterator;
    _queue = new Queue();
    constructor(iterable, _count){
        this._count = _count;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                return done(this);
            } else {
                this._queue.enqueue(result.value);
                if (this._queue.length > this._count) {
                    return {
                        done: false,
                        value: this._queue.dequeue()
                    };
                }
            }
        }
    }
}
class LazySkipWhile {
    _predicate;
    _iterator;
    _index = 0;
    _yielding = false;
    constructor(iterable, _predicate){
        this._predicate = _predicate;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                return done(this);
            } else {
                if (!this._yielding) {
                    this._yielding = !this._predicate(result.value, this._index);
                    this._index++;
                }
                if (this._yielding) {
                    return result;
                }
            }
        }
    }
}
class LazyTakeIterator {
    _count;
    _iterator;
    _taken = 0;
    constructor(iterable, _count){
        this._count = _count;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        if (this._taken >= this._count) {
            return done(this);
        }
        const result = this._iterator.next();
        this._taken++;
        if (result.done) {
            return done(this);
        } else {
            return result;
        }
    }
}
class LazyTakeLastIterator {
    _queue = new Queue();
    constructor(iterable, count){
        if (count > 0) {
            for (const element of iterable){
                if (this._queue.length < count) {
                    this._queue.enqueue(element);
                } else {
                    this._queue.dequeue();
                    this._queue.enqueue(element);
                }
            }
        }
    }
    next() {
        if (this._queue.length === 0) {
            return done(this);
        } else {
            return {
                done: false,
                value: this._queue.dequeue()
            };
        }
    }
}
class LazyTakeWhileIterator {
    _predicate;
    _iterator;
    _index = 0;
    constructor(iterable, _predicate){
        this._predicate = _predicate;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        const result = this._iterator.next();
        if (result.done) {
            return done(this);
        } else {
            if (!this._predicate(result.value, this._index)) {
                return done(this);
            } else {
                this._index++;
                return result;
            }
        }
    }
}
class LazyUnionIterator {
    _compareOn;
    _firstIterator;
    _secondIterator;
    _set = new Set();
    _onSecond = false;
    constructor(firstIterable, secondIterable, _compareOn){
        this._compareOn = _compareOn;
        this._firstIterator = firstIterable[Symbol.iterator]();
        this._secondIterator = secondIterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._onSecond ? this._secondIterator.next() : this._firstIterator.next();
            if (result.done) {
                if (this._onSecond) {
                    return done(this);
                } else {
                    this._onSecond = true;
                }
            } else {
                const key = this._compareOn ? this._compareOn(result.value) : result.value;
                if (!this._set.has(key)) {
                    this._set.add(key);
                    return {
                        done: false,
                        value: result.value
                    };
                }
            }
        }
    }
}
class LazyWhereIterator {
    _predicate;
    _iterator;
    _index = 0;
    constructor(iterable, _predicate){
        this._predicate = _predicate;
        this._iterator = iterable[Symbol.iterator]();
    }
    next() {
        while(true){
            const result = this._iterator.next();
            if (result.done) {
                return done(this);
            } else {
                const shouldYield = this._predicate(result.value, this._index);
                this._index++;
                if (shouldYield) {
                    return {
                        done: false,
                        value: result.value
                    };
                }
            }
        }
    }
}
class LazyZipIterator {
    _selector;
    _firstIterator;
    _secondIterator;
    constructor(firstIterable, secondIterable, _selector){
        this._selector = _selector;
        this._firstIterator = firstIterable[Symbol.iterator]();
        this._secondIterator = secondIterable[Symbol.iterator]();
    }
    next() {
        const firstResult = this._firstIterator.next();
        if (firstResult.done) {
            return done(this);
        }
        const secondResult = this._secondIterator.next();
        if (secondResult.done) {
            return done(this);
        }
        return {
            done: false,
            value: this._selector ? this._selector(firstResult.value, secondResult.value) : [
                firstResult.value,
                secondResult.value
            ]
        };
    }
}
class Lazy {
    static empty() {
        return new LazyEmpty();
    }
    static from(iterable) {
        if (iterable instanceof Lazy) {
            return iterable;
        }
        return new LazyIterator(iterable);
    }
    static range(start, end) {
        return new LazyRange(start, end);
    }
    static repeat(element, count) {
        return new LazyRepeat(element, count);
    }
    aggregate(agg, seed) {
        if (arguments.length >= 2) {
            return aggregate(this, agg, seed);
        } else {
            return aggregate(this, agg);
        }
    }
    all(predicate) {
        return all(this, predicate);
    }
    any(predicate) {
        return any(this, predicate);
    }
    average(selector) {
        return average(this, selector);
    }
    contains(element, comparer) {
        return contains(this, element, comparer);
    }
    count(predicate) {
        return count(this, predicate);
    }
    elementAt(index) {
        return elementAt(this, index);
    }
    elementAtOrDefault(index, defaultValue) {
        return elementAtOrDefault(this, index, defaultValue);
    }
    first(predicate) {
        return first(this, predicate);
    }
    firstOrDefault(defaultValue, predicate) {
        return firstOrDefault(this, defaultValue, predicate);
    }
    forEach(callbackFn) {
        forEach(this, callbackFn);
    }
    iterableEquals(second, comparer) {
        return iterableEquals(this, second, comparer);
    }
    last(predicate) {
        return last(this, predicate);
    }
    lastOrDefault(defaultValue, predicate) {
        return lastOrDefault(this, defaultValue, predicate);
    }
    max(selector) {
        return max(this, selector);
    }
    min(selector) {
        return min(this, selector);
    }
    resolveAll() {
        return resolveAll(this).then((iterable)=>Lazy.from(iterable)
        );
    }
    single(predicate) {
        return single(this, predicate);
    }
    singleOrDefault(predicate, defaultValue) {
        return singleOrDefault(this, predicate, defaultValue);
    }
    stringJoin(separator, strFn) {
        return stringJoin(this, separator, strFn);
    }
    sum(selector) {
        return sum(this, selector);
    }
    toArray() {
        return toArray(this);
    }
    toJSON() {
        return this.toArray();
    }
    toMap(keyFn, valueFn) {
        return toMap(this, keyFn, valueFn);
    }
    append(element) {
        return new LazyAppendPrepend(this, element, false);
    }
    apply(fn) {
        return fn(this);
    }
    batchIn(batchSize, includeIncomplete = true) {
        return new LazyBatchIn(this, batchSize, includeIncomplete);
    }
    cache() {
        return Lazy.from(this.toArray());
    }
    concat(...iterables) {
        return new LazyConcat(this, ...iterables);
    }
    defaultIfEmpty(defaultValue) {
        return new LazyDefaultIfEmpty(this, defaultValue);
    }
    distinct(compareOn) {
        return new LazyDistinct(this, compareOn);
    }
    except(second, compareOn) {
        return new LazyExcept(this, second, compareOn);
    }
    groupBy(keyFn, elementSelector, resultSelector) {
        return new LazyGroupBy(this, keyFn, elementSelector, resultSelector);
    }
    groupJoin(second, firstKeyFn, secondKeyFn, joinFn) {
        return new LazyGroupJoin(this, second, firstKeyFn, secondKeyFn, joinFn);
    }
    intersect(second, compareOn) {
        return new LazyIntersect(this, second, compareOn);
    }
    join(second, firstKeyFn, secondKeyFn, joinFn) {
        return new LazyJoin(this, second, firstKeyFn, secondKeyFn, joinFn);
    }
    orderBy(keyFn, compareFn) {
        return new LazyOrderBy(this, keyFn, compareFn, false);
    }
    orderByDecending(keyFn, compareFn) {
        return new LazyOrderBy(this, keyFn, compareFn, true);
    }
    orderNumericallyBy(keyFn) {
        return this.orderBy(keyFn, numericComparer);
    }
    orderNumericallyByDecending(keyFn) {
        return this.orderByDecending(keyFn, numericComparer);
    }
    prepend(element) {
        return new LazyAppendPrepend(this, element, true);
    }
    reverse() {
        return new LazyReverse(this);
    }
    select(selector) {
        return new LazySelect(this, selector);
    }
    selectMany(selector) {
        return new LazySelectMany(this, selector);
    }
    skip(count) {
        return new LazySkip(this, count);
    }
    skipLast(count) {
        return new LazySkipLast(this, count);
    }
    skipWhile(predicate) {
        return new LazySkipWhile1(this, predicate);
    }
    take(count) {
        return new LazyTake(this, count);
    }
    takeLast(count) {
        return new LazyTakeLast(this, count);
    }
    takeWhile(predicate) {
        return new LazyTakeWhile(this, predicate);
    }
    union(second, compareOn) {
        return new LazyUnion(this, second, compareOn);
    }
    where(predicate) {
        return new LazyWhere(this, predicate);
    }
    zip(second, selector) {
        return new LazyZip(this, second, selector);
    }
}
class LazyEmpty extends Lazy {
    [Symbol.iterator]() {
        return {
            next () {
                return {
                    done: true,
                    value: undefined
                };
            }
        };
    }
}
class LazyIterator extends Lazy {
    _iterable;
    constructor(_iterable){
        super();
        this._iterable = _iterable;
    }
    count(predicate) {
        if (predicate) {
            return super.count(predicate);
        }
        if (Array.isArray(this._iterable)) {
            return this._iterable.length;
        }
        return super.count();
    }
    elementAt(index) {
        if (Array.isArray(this._iterable)) {
            if (index >= 0 && index < this._iterable.length) {
                return this._iterable[index];
            } else {
                throw new Error('Index out of array bounds');
            }
        }
        return super.elementAt(index);
    }
    elementAtOrDefault(index, defaultValue) {
        if (Array.isArray(this._iterable)) {
            if (index >= 0 && index < this._iterable.length) {
                return this._iterable[index];
            } else {
                return defaultValue;
            }
        }
        return super.elementAtOrDefault(index, defaultValue);
    }
    first(predicate) {
        if (predicate) {
            return super.first(predicate);
        }
        if (Array.isArray(this._iterable)) {
            if (this._iterable.length > 0) {
                return this._iterable[0];
            } else {
                throw new Error(Errors.Empty);
            }
        }
        return super.first();
    }
    firstOrDefault(defaultValue, predicate) {
        if (predicate) {
            return super.firstOrDefault(defaultValue, predicate);
        }
        if (Array.isArray(this._iterable)) {
            if (this._iterable.length > 0) {
                return this._iterable[0];
            } else {
                return defaultValue;
            }
        }
        return super.firstOrDefault(defaultValue);
    }
    last(predicate) {
        if (predicate) {
            return super.last(predicate);
        }
        if (Array.isArray(this._iterable)) {
            if (this._iterable.length > 0) {
                return this._iterable[this._iterable.length - 1];
            } else {
                throw new Error(Errors.Empty);
            }
        }
        return super.last();
    }
    lastOrDefault(defaultValue, predicate) {
        if (predicate) {
            return super.lastOrDefault(defaultValue, predicate);
        }
        if (Array.isArray(this._iterable)) {
            if (this._iterable.length > 0) {
                return this._iterable[this._iterable.length - 1];
            } else {
                return defaultValue;
            }
        }
        return super.lastOrDefault(defaultValue);
    }
    [Symbol.iterator]() {
        return this._iterable[Symbol.iterator]();
    }
}
class LazyRange extends Lazy {
    _start;
    _end;
    constructor(_start, _end = +Infinity){
        super();
        this._start = _start;
        this._end = _end;
    }
    [Symbol.iterator]() {
        return new LazyRangeIterator(this._start, this._end);
    }
}
class LazyRepeat extends Lazy {
    _element;
    _count;
    constructor(_element, _count = +Infinity){
        super();
        this._element = _element;
        this._count = _count;
        if (_count < 0) {
            throw new Error('Count cannot be < 0');
        }
    }
    [Symbol.iterator]() {
        return new LazyRepeatIterator(this._element, this._count);
    }
}
class LazyAppendPrepend extends Lazy {
    _iterable;
    _element;
    _atStart;
    constructor(_iterable, _element, _atStart){
        super();
        this._iterable = _iterable;
        this._element = _element;
        this._atStart = _atStart;
    }
    [Symbol.iterator]() {
        return new LazyAppendPrependIterator(this._iterable, this._element, this._atStart);
    }
}
class LazyBatchIn extends Lazy {
    _iterable;
    _batchSize;
    _includeComplete;
    constructor(_iterable, _batchSize, _includeComplete){
        super();
        this._iterable = _iterable;
        this._batchSize = _batchSize;
        this._includeComplete = _includeComplete;
    }
    [Symbol.iterator]() {
        return new LazyBatchInIterator(this._iterable, this._batchSize, this._includeComplete);
    }
}
class LazyConcat extends Lazy {
    _iterables;
    constructor(..._iterables){
        super();
        this._iterables = _iterables;
    }
    [Symbol.iterator]() {
        return new LazyConcatIterator(this._iterables);
    }
}
class LazyDefaultIfEmpty extends Lazy {
    _iterable;
    _defaultValue;
    constructor(_iterable, _defaultValue){
        super();
        this._iterable = _iterable;
        this._defaultValue = _defaultValue;
    }
    [Symbol.iterator]() {
        return new LazyDefaultIfEmptyIterator(this._iterable, this._defaultValue);
    }
}
class LazyDistinct extends Lazy {
    _iterable;
    _compareOn;
    constructor(_iterable, _compareOn){
        super();
        this._iterable = _iterable;
        this._compareOn = _compareOn;
    }
    [Symbol.iterator]() {
        return new LazyDistinctIterator(this._iterable, this._compareOn);
    }
}
class LazyExcept extends Lazy {
    _firstIterable;
    _secondIterable;
    _compareOn;
    constructor(_firstIterable, _secondIterable, _compareOn){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._compareOn = _compareOn;
    }
    [Symbol.iterator]() {
        return new LazyExceptIterator(this._firstIterable, this._secondIterable, this._compareOn);
    }
}
class LazyGroupBy extends Lazy {
    _iterable;
    _keyFn;
    _elementSelector;
    _resultSelector;
    constructor(_iterable, _keyFn, _elementSelector, _resultSelector){
        super();
        this._iterable = _iterable;
        this._keyFn = _keyFn;
        this._elementSelector = _elementSelector;
        this._resultSelector = _resultSelector;
    }
    [Symbol.iterator]() {
        return new LazyGroupByIterator(this._iterable, this._keyFn, this._elementSelector, this._resultSelector);
    }
}
class LazyGroupJoin extends Lazy {
    _firstIterable;
    _secondIterable;
    _firstKeyFn;
    _secondKeyFn;
    _joinFn;
    constructor(_firstIterable, _secondIterable, _firstKeyFn, _secondKeyFn, _joinFn){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._firstKeyFn = _firstKeyFn;
        this._secondKeyFn = _secondKeyFn;
        this._joinFn = _joinFn;
    }
    [Symbol.iterator]() {
        return new LazyGroupJoinIterator(this._firstIterable, this._secondIterable, this._firstKeyFn, this._secondKeyFn, this._joinFn);
    }
}
class LazyIntersect extends Lazy {
    _firstIterable;
    _secondIterable;
    _compareOn;
    constructor(_firstIterable, _secondIterable, _compareOn){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._compareOn = _compareOn;
    }
    [Symbol.iterator]() {
        return new LazyIntersectIterator(this._firstIterable, this._secondIterable, this._compareOn);
    }
}
class LazyJoin extends Lazy {
    _firstIterable;
    _secondIterable;
    _firstKeyFn;
    _secondKeyFn;
    _joinFn;
    constructor(_firstIterable, _secondIterable, _firstKeyFn, _secondKeyFn, _joinFn){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._firstKeyFn = _firstKeyFn;
        this._secondKeyFn = _secondKeyFn;
        this._joinFn = _joinFn;
    }
    [Symbol.iterator]() {
        return new LazyJoinIterator(this._firstIterable, this._secondIterable, this._firstKeyFn, this._secondKeyFn, this._joinFn);
    }
}
class LazyOrderBy extends Lazy {
    _iterable;
    _keyFn;
    _compareFn;
    _decending;
    constructor(_iterable, _keyFn, _compareFn, _decending){
        super();
        this._iterable = _iterable;
        this._keyFn = _keyFn;
        this._compareFn = _compareFn;
        this._decending = _decending;
    }
    [Symbol.iterator]() {
        return lazyOrderBy(this._iterable, this._keyFn, this._compareFn, this._decending);
    }
}
class LazyReverse extends Lazy {
    _iterable;
    constructor(_iterable){
        super();
        this._iterable = _iterable;
    }
    [Symbol.iterator]() {
        return new LazyReverseIterator(this._iterable);
    }
}
class LazySelect extends Lazy {
    _iterable;
    _selector;
    constructor(_iterable, _selector){
        super();
        this._iterable = _iterable;
        this._selector = _selector;
    }
    [Symbol.iterator]() {
        return new LazySelectIterator(this._iterable, this._selector);
    }
}
class LazySelectMany extends Lazy {
    _iterable;
    _selector;
    constructor(_iterable, _selector){
        super();
        this._iterable = _iterable;
        this._selector = _selector;
    }
    [Symbol.iterator]() {
        return new LazySelectManyIterator(this._iterable, this._selector);
    }
}
class LazySkip extends Lazy {
    _iterable;
    _count;
    constructor(_iterable, _count){
        super();
        this._iterable = _iterable;
        this._count = _count;
    }
    [Symbol.iterator]() {
        return new LazySkipIterator(this._iterable, this._count);
    }
}
class LazySkipLast extends Lazy {
    _iterable;
    _count;
    constructor(_iterable, _count){
        super();
        this._iterable = _iterable;
        this._count = _count;
    }
    [Symbol.iterator]() {
        return new LazySkipLastIterator(this._iterable, this._count);
    }
}
class LazySkipWhile1 extends Lazy {
    _iterable;
    _predicate;
    constructor(_iterable, _predicate){
        super();
        this._iterable = _iterable;
        this._predicate = _predicate;
    }
    [Symbol.iterator]() {
        return new LazySkipWhile(this._iterable, this._predicate);
    }
}
class LazyTake extends Lazy {
    _iterable;
    _count;
    constructor(_iterable, _count){
        super();
        this._iterable = _iterable;
        this._count = _count;
    }
    [Symbol.iterator]() {
        return new LazyTakeIterator(this._iterable, this._count);
    }
}
class LazyTakeLast extends Lazy {
    _iterable;
    _count;
    constructor(_iterable, _count){
        super();
        this._iterable = _iterable;
        this._count = _count;
    }
    [Symbol.iterator]() {
        return new LazyTakeLastIterator(this._iterable, this._count);
    }
}
class LazyTakeWhile extends Lazy {
    _iterable;
    _predicate;
    constructor(_iterable, _predicate){
        super();
        this._iterable = _iterable;
        this._predicate = _predicate;
    }
    [Symbol.iterator]() {
        return new LazyTakeWhileIterator(this._iterable, this._predicate);
    }
}
class LazyUnion extends Lazy {
    _firstIterable;
    _secondIterable;
    _compareOn;
    constructor(_firstIterable, _secondIterable, _compareOn){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._compareOn = _compareOn;
    }
    [Symbol.iterator]() {
        return new LazyUnionIterator(this._firstIterable, this._secondIterable, this._compareOn);
    }
}
class LazyWhere extends Lazy {
    _iterable;
    _predicate;
    constructor(_iterable, _predicate){
        super();
        this._iterable = _iterable;
        this._predicate = _predicate;
    }
    [Symbol.iterator]() {
        return new LazyWhereIterator(this._iterable, this._predicate);
    }
}
class LazyZip extends Lazy {
    _firstIterable;
    _secondIterable;
    _selector;
    constructor(_firstIterable, _secondIterable, _selector){
        super();
        this._firstIterable = _firstIterable;
        this._secondIterable = _secondIterable;
        this._selector = _selector;
    }
    [Symbol.iterator]() {
        return new LazyZipIterator(this._firstIterable, this._secondIterable, this._selector);
    }
}
Lazy.empty;
Lazy.from;
Lazy.range;
Lazy.repeat;
class HistoricalData {
    Records;
    constructor(Records){
        this.Records = Records;
    }
    FilterByCategories(pattern) {
        if (pattern.length == 0) return this.Records;
        const filteredRecords = [];
        for (const rec of this.Records){
            if (rec.Categories.length == 0) continue;
            let matchesPattern = true;
            for (const c of pattern){
                matchesPattern = rec.Categories.includes(c);
                if (matchesPattern == false) break;
            }
            if (matchesPattern) filteredRecords.push(rec);
        }
        return filteredRecords;
    }
    get DateRange() {
        const first = Lazy.from(this.Records).min((x)=>x.StartedOn.getTime()
        );
        const last = Lazy.from(this.Records).max((x)=>x.FinishedOn.getTime()
        );
        return [
            new Date(first),
            new Date(last)
        ];
    }
    get Calendar() {
        const calendar = [];
        const range = this.DateRange;
        var next = new Date(range[0].getTime());
        while(next <= range[1]){
            calendar.push(next);
            next = new Date(next.getTime());
            next.setDate(next.getDate() + 1);
        }
        return calendar;
    }
    get Throughputs() {
        const tpCollection = new Map();
        for (const d of this.Calendar){
            tpCollection.set(d.getTime(), 0);
        }
        for (const r of this.Records){
            tpCollection.set(r.FinishedOn.getTime(), tpCollection.get(r.FinishedOn.getTime()) + 1);
        }
        return Lazy.from(tpCollection.entries()).select((e)=>new HistoricalThroughput(new Date(e[0]), e[1])
        ).orderBy((tp)=>tp.Date.getTime()
        ).toArray();
    }
}
class HistoricalRecord {
    StartedOn;
    FinishedOn;
    _cycleTime = 0;
    Categories = [];
    constructor(StartedOn, FinishedOn, cycleTime = 0, categories = ""){
        this.StartedOn = StartedOn;
        this.FinishedOn = FinishedOn;
        this._cycleTime = cycleTime;
        this.Categories = categories.split(",").map((x)=>x.trim()
        ).filter((x)=>x != "*" && x != ""
        );
    }
    get CycleTimeDays() {
        if (this._cycleTime > 0) return this._cycleTime;
        return difference(this.FinishedOn, this.StartedOn).days;
    }
}
class HistoricalThroughput {
    Date;
    Throughput;
    constructor(Date, Throughput){
        this.Date = Date;
        this.Throughput = Throughput;
    }
}
function LoadHistory(sourceFilename, delimiter = ";") {
    const csv = LoadCsv(sourceFilename, delimiter);
    return CreateHistory(csv);
    function CreateHistory(csv) {
        const records = Array();
        for(let i = 1; i < csv.length; i++){
            let rec = new HistoricalRecord(parse1(csv[i].Cols[0], "yyyy-MM-dd"), parse1(csv[i].Cols[1], "yyyy-MM-dd"), Number(parseOptional(csv[i], 2, 0)), parseOptional(csv[i], 3, ""));
            records.push(rec);
        }
        return new HistoricalData(records);
        function parseOptional(row, i, defaultValue) {
            if (row.Cols.length <= i) return defaultValue;
            return row.Cols[i];
        }
    }
}
function CalculateForecast(values) {
    const lazyValues = Lazy.from(values);
    const uniqueValues = lazyValues.distinct().toArray().sort((n1, n2)=>n1 - n2
    );
    const valuesWithFrequencies = Lazy.from(uniqueValues).select((x)=>{
        return {
            ct: x,
            f: lazyValues.count((y)=>y == x
            )
        };
    });
    const cycleTimesWithProbabilities = valuesWithFrequencies.select((x)=>{
        return {
            ct: x.ct,
            f: x.f,
            p: x.f / values.length
        };
    });
    const forecast = [];
    let pSum = 0;
    for (const x of cycleTimesWithProbabilities){
        pSum = pSum + x.p;
        const f = {
            ct: x.ct,
            f: x.f,
            p: x.p,
            pSum: pSum
        };
        forecast.push(f);
    }
    return forecast;
}
function Plot(barItem) {
    const data = [];
    for (const v of barItem){
        const ctText = v.ct.toString().padStart(5);
        const pText = (100 * v.p).toFixed(1).padStart(5) + "%";
        const pSumText = (100 * v.pSum).toFixed(1).padStart(5) + "%";
        data.push({
            xLabel: `${ctText} ${pSumText}`,
            y: 100 * v.p,
            yLabel: pText
        });
    }
    console.log("--- FORECAST ---");
    console.log(DrawChart(data, true));
}
function DrawChart(data, showValue = false, maxBarLength = 100) {
    const maxValue = Lazy.from(data).max((x)=>x.y
    );
    const maxKeyNameLength = Lazy.from(data).max((x)=>x.xLabel.length
    );
    return Lazy.from(data).select((item)=>{
        const xLabel = item.xLabel.padStart(maxKeyNameLength);
        const bar = DrawBar(item.y, maxValue, maxBarLength);
        const yLabel = showValue ? item.yLabel : "";
        return xLabel + " " + bar + yLabel;
    }).toArray().join('\n');
}
function DrawBar(value, maxValue, maxBarLength) {
    const fractions = [
        '▏',
        '▎',
        '▍',
        '▋',
        '▊',
        '▉'
    ];
    const barLength = value * maxBarLength / maxValue;
    const wholeNumberPart = Math.floor(barLength);
    const fractionalPart = barLength - wholeNumberPart;
    let bar = fractions[fractions.length - 1].repeat(wholeNumberPart);
    if (fractionalPart > 0) bar += fractions[Math.floor(fractionalPart * fractions.length)];
    return bar;
}
function SimulateByPicking(historicalData, numberOfSimulations, aggregate) {
    const simulations = [];
    for(let i = 1; i <= numberOfSimulations; i += 1){
        simulations.push(aggregate(pickRandom));
    }
    return simulations;
    function pickRandom() {
        const index = Math.floor(Math.random() * historicalData.length);
        return historicalData[index];
    }
}
const args = parseCommandline(Deno.args);
console.log(`Parameters: ${args.HistoricalDataSourceFilename}, n:${args.Issues.length}, s:${args.NumberOfSimulations}`);
const history = LoadHistory(args.HistoricalDataSourceFilename);
const throughputs = history.Throughputs.map((x)=>x.Throughput
);
const forecastingValues = SimulateByPicking(throughputs, args.NumberOfSimulations, (pickRandom)=>{
    var totalThroughput = 0;
    var batchCycleTime = 0;
    while(totalThroughput < args.Issues.length){
        totalThroughput += pickRandom();
        batchCycleTime += 1;
    }
    return batchCycleTime;
});
const forecast = CalculateForecast(forecastingValues);
Plot(forecast);

