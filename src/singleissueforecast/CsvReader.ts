export type CsvRow = {
    Cols: string[];
}
export function LoadCsv(sourceFilename: string, delimiter: string = ";") : CsvRow[]  {
    const text = Deno.readTextFileSync(sourceFilename);
    const rows = text.split("\n");

    const result = new Array<CsvRow>();
    for(const row of rows) {
        const cols = row.trim().split(delimiter);
        result.push({Cols:cols});
    }
    return result;
}