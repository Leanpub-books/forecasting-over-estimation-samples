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
const osType = (()=>{
    const { Deno  } = globalThis;
    if (typeof Deno?.build?.os === "string") {
        return Deno.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win") ?? false) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
            } else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno.cwd();
        } else {
            if (typeof Deno?.env?.get !== "function" || typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert1(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse1,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno  } = globalThis;
            if (typeof Deno?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename1(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse2(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse2,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse3 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2 ,  } = path1;
function existsSync(filePath) {
    try {
        Deno.lstatSync(filePath);
        return true;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
var EOL;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {
}));
class CommandlineParameters {
    HistoricalDataSourceFilename;
    Mode;
    N;
    NumberOfSimulations;
    LevelPrefix;
    constructor(HistoricalDataSourceFilename, Mode, N, NumberOfSimulations, LevelPrefix){
        this.HistoricalDataSourceFilename = HistoricalDataSourceFilename;
        this.Mode = Mode;
        this.N = N;
        this.NumberOfSimulations = NumberOfSimulations;
        this.LevelPrefix = LevelPrefix;
    }
}
function parseCommandline(args) {
    if (args.length == 0) args = LoadFromFile();
    if (args.length == 0) printUsageAndExit();
    const parsedArgs = parse(args, {
        default: {
            n: 1,
            s: 10000,
            m: "tp",
            l: ""
        }
    });
    if (parsedArgs.f == undefined) printUsageAndExit("Missing source of historical data (-f)!");
    return new CommandlineParameters(parsedArgs.f, parsedArgs.m, parsedArgs.n, parsedArgs.s, parsedArgs.l);
    function LoadFromFile() {
        const COMMANDLINE_PARAMETERS_FILENAME = ".commandline.txt";
        if (existsSync(COMMANDLINE_PARAMETERS_FILENAME) == false) return [];
        return Deno.readTextFileSync(COMMANDLINE_PARAMETERS_FILENAME).split(" ");
    }
    function printUsageAndExit(errorMsg = "") {
        if (errorMsg != "") {
            console.log(`*** ${errorMsg}`);
            console.log();
        }
        console.log("Use with: -f <historical data csv filename> [-m <mode: tp*|dl|ct>] [-n <number of issues>] [-l <level prefix>] [ -s <number of simulations, default: 10000> ]");
        Deno.exit(1);
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
function parse4(dateString, formatString) {
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
class HistoricalRecordGroup {
    Category;
    Records;
    constructor(Category, Records){
        this.Category = Category;
        this.Records = Records;
    }
}
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
    get Categories() {
        return Lazy.from(this.Records).selectMany((r)=>r.Categories
        ).distinct().orderBy((c)=>c
        ).toArray();
    }
    CategoriesWithPrefix(prefix) {
        return Lazy.from(this.Categories).where((c)=>c.startsWith(prefix)
        ).toArray();
    }
    GroupByCategories(includeUncategorizedRecords = true) {
        const recsWithNoCategories = includeUncategorizedRecords ? Lazy.from(this.Records).where((r)=>r.Categories.length == 0
        ).select((r)=>{
            return {
                Category: "",
                Record: r
            };
        }) : [];
        const recsWithCategories = Lazy.from(this.Records).selectMany((r)=>r.Categories.map((c)=>{
                return {
                    Category: c,
                    Record: r
                };
            })
        );
        return Lazy.from(recsWithNoCategories).concat(recsWithCategories).groupBy((x)=>x.Category
        , (x)=>x.Record
        , (c, rs)=>new HistoricalRecordGroup(c, Array.from(rs))
        ).orderBy((x)=>x.Category
        ).toArray();
    }
}
class HistoricalRecord {
    StartedOn;
    FinishedOn;
    Categories = [];
    constructor(StartedOn, FinishedOn, categories = ""){
        this.StartedOn = StartedOn;
        this.FinishedOn = FinishedOn;
        this.Categories = categories.split(",").map((x)=>x.trim()
        ).filter((x)=>x != "*" && x != ""
        );
    }
    get CycleTimeDays() {
        return difference(this.FinishedOn, this.StartedOn).days;
    }
    InCategory(categoryName) {
        return Lazy.from(this.Categories).count((c)=>c == categoryName
        ) > 0;
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
            let rec = new HistoricalRecord(parse4(csv[i].Cols[0], "yyyy-MM-dd"), parse4(csv[i].Cols[1], "yyyy-MM-dd"), parseOptional(csv[i], 2, ""));
            records.push(rec);
        }
        return new HistoricalData(records);
        function parseOptional(row, i, defaultValue) {
            if (row.Cols.length <= i) return defaultValue;
            return row.Cols[i];
        }
    }
}
function Plot(barItem) {
    const data = [];
    for (const i of barItem){
        const ctText = i.v.toString().padStart(5);
        const pText = (100 * i.p).toFixed(1).padStart(5) + "%";
        const pSumText = (100 * i.pSum).toFixed(1).padStart(5) + "%";
        data.push({
            xLabel: `${ctText} ${pSumText}`,
            y: 100 * i.p,
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
class Histogram {
    Items;
    constructor(items){
        this.Items = items;
    }
    static fromValues(values) {
        const lazyValues = Lazy.from(values);
        const uniqueValues = lazyValues.distinct().toArray().sort((n1, n2)=>n1 - n2
        );
        const items = Lazy.from(uniqueValues).select((x)=>{
            return {
                v: x,
                f: lazyValues.count((y)=>y == x
                )
            };
        }).toArray();
        return new Histogram(items);
    }
}
class ProbabilityDistribution {
    static fromValues(values) {
        return new ProbabilityDistribution(Histogram.fromValues(values));
    }
    _histogram;
    constructor(histogram){
        this._histogram = histogram;
    }
    Items(inverted = false) {
        var totalNumberOfSamples = this._histogram.Items.reduce((a, e)=>a + e.f
        , 0);
        var cycleTimesWithProbabilities = Lazy.from(this._histogram.Items).select((x)=>{
            return {
                v: x.v,
                f: x.f,
                p: x.f / totalNumberOfSamples
            };
        }).toArray().sort((a, b)=>a.v - b.v
        );
        if (inverted) cycleTimesWithProbabilities = cycleTimesWithProbabilities.reverse();
        const forecast = [];
        let pSum = 0;
        for (const x of cycleTimesWithProbabilities){
            pSum = pSum + x.p;
            const f = {
                v: x.v,
                f: x.f,
                p: x.p,
                pSum: pSum
            };
            forecast.push(f);
        }
        return forecast;
    }
}
function SimulateByServing(historicalData, numberOfRandomSamples, numberOfSimulations, aggregate) {
    const subsets = [];
    for(let i = 1; i <= numberOfRandomSamples; i += 1)subsets.push(historicalData);
    return SimulateByServingFromMultipleSubsets(subsets, numberOfSimulations, aggregate);
}
function SimulateByServingFromMultipleSubsets(historicalDataSubsets, numberOfSimulations, aggregate) {
    const simulations = [];
    for(let i = 1; i <= numberOfSimulations; i += 1){
        const samples = [];
        for(let s = 0; s < historicalDataSubsets.length; s += 1){
            const index = Math.floor(Math.random() * historicalDataSubsets[s].length);
            samples.push(historicalDataSubsets[s][index]);
        }
        simulations.push(aggregate(samples));
    }
    return simulations;
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
function ForecastBatchCycleTimeFromThroughputs(history, batchSize, simulationSize) {
    const throughputs = history.Throughputs.map((x)=>x.Throughput
    );
    const simulatedCycleTimes = SimulateBatchCycleTimeFromThroughputs(throughputs, batchSize, simulationSize);
    return ProbabilityDistribution.fromValues(simulatedCycleTimes).Items();
}
function SimulateBatchCycleTimeFromThroughputs(throughputs, batchSize, simulationSize) {
    return SimulateByPicking(throughputs, simulationSize, (pickRandom)=>{
        var totalThroughput = 0;
        var batchCycleTime = 0;
        while(totalThroughput < batchSize){
            totalThroughput += pickRandom();
            batchCycleTime += 1;
        }
        return batchCycleTime;
    });
}
function ForecastBatchsizeFromThroughputs(history, periodDuration, simulationSize) {
    const throughputs = history.Throughputs.map((x)=>x.Throughput
    );
    const simulatedBatchSizes = SimulateByServing(throughputs, periodDuration, simulationSize, (values)=>values.reduce((a, b)=>a + b
        , 0)
    );
    return ProbabilityDistribution.fromValues(simulatedBatchSizes).Items(true);
}
function ForecastBatchCycleTimeFromCycleTimes(history, batchSize, simulationSize) {
    const cycletimes = history.Records.map((x)=>x.CycleTimeDays
    );
    const simulatedCycleTimes = SimulateByServing(cycletimes, batchSize, simulationSize, (values)=>values.reduce((a, b)=>a + b
        , 0)
    );
    return ProbabilityDistribution.fromValues(simulatedCycleTimes).Items();
}
function ForecastHiLevelBatchCycleTimeFromThroughputs(history, levelPrefix, hiLevelBatchSize, simulationSize) {
    const throughputs = history.Throughputs.map((x)=>x.Throughput
    );
    const simulatedIssueBatchSizes = Phase1(history, levelPrefix, hiLevelBatchSize, simulationSize);
    const histogramItems = Phase2(simulatedIssueBatchSizes, throughputs, simulationSize);
    return new ProbabilityDistribution(new Histogram(histogramItems)).Items();
    function Phase1(history, levelPrefix, hiLevelBatchSize, simulationSize) {
        const issueFrequencies = CalculateHiLevelIssueFrequencies(history, levelPrefix);
        return SimulateIssueBatchSizes(issueFrequencies, hiLevelBatchSize, simulationSize);
    }
    function Phase2(simulatedIssueBatchSizes, throughputs, simulationSize) {
        const cycleTimeFrequencies = new CycleTimeFrequencies();
        for (const batchSize of simulatedIssueBatchSizes){
            const simulatedCylceTimes = SimulateBatchCycleTimeFromThroughputs(throughputs, batchSize, simulationSize);
            cycleTimeFrequencies.Update(simulatedCylceTimes);
        }
        return cycleTimeFrequencies.Histogram;
    }
}
function CalculateHiLevelIssueFrequencies(history, levelPrefix) {
    var levelCategories = Lazy.from(history.CategoriesWithPrefix(levelPrefix));
    return Lazy.from(history.GroupByCategories(false)).where((g)=>levelCategories.contains(g.Category)
    ).select((g)=>g.Records.length
    ).toArray();
}
function SimulateIssueBatchSizes(issueFrequencies, hiLevelBatchSize, simulationSize) {
    return SimulateByServing(issueFrequencies, hiLevelBatchSize, simulationSize, (values)=>values.reduce((a, b)=>a + b
        , 0)
    );
}
class CycleTimeFrequencies {
    cycleTimeFrequencies = new Map();
    Update(cycleTimes) {
        for (const ct of cycleTimes){
            if (this.cycleTimeFrequencies.has(ct) == false) this.cycleTimeFrequencies.set(ct, 0);
            this.cycleTimeFrequencies.set(ct, this.cycleTimeFrequencies.get(ct) + 1);
        }
    }
    get Histogram() {
        return Array.from(this.cycleTimeFrequencies.keys()).map((x)=>{
            return {
                v: x,
                f: this.cycleTimeFrequencies.get(x)
            };
        });
    }
}
const args = parseCommandline(Deno.args);
const history = LoadHistory(args.HistoricalDataSourceFilename);
console.log(`Parameters: ${args.HistoricalDataSourceFilename}, m:${args.Mode}, n:${args.N}, s:${args.NumberOfSimulations}, l:${args.LevelPrefix}`);
var forecast;
switch(args.Mode){
    case "tp":
        if (args.LevelPrefix == "") forecast = ForecastBatchCycleTimeFromThroughputs(history, args.N, args.NumberOfSimulations);
        else forecast = ForecastHiLevelBatchCycleTimeFromThroughputs(history, args.LevelPrefix, args.N, args.NumberOfSimulations);
        break;
    case "dl":
        forecast = ForecastBatchsizeFromThroughputs(history, args.N, args.NumberOfSimulations);
        break;
    case "ct":
        console.log("*** Please note: Calculating a batch cycle time based on issue cycle times is fairly inaccurate for teams. ***");
        forecast = ForecastBatchCycleTimeFromCycleTimes(history, args.N, args.NumberOfSimulations);
        break;
    default:
        throw new Error(`*** Unsupported mode ${args.Mode}!`);
}
Plot(forecast);

