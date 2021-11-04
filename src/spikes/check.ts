import { LoadCsv } from "../singleissueforecast/CsvReader.ts"

const r = LoadCsv("tests/testCsvReader.csv");
console.log(r);