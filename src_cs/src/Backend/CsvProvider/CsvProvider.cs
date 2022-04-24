using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using forecast_contracts;

namespace forecast.backend
{
    public class CsvProvider : ICsvProvider
    {
        private const char Trenner = ';';
        private const string DatumsFormat = "yyyy-MM-dd";

        public async Task<Historie> AuslesenAsync(string path) {
            var zeilen  = await File.ReadAllLinesAsync(path);
            return ParseIssues(zeilen.Skip(1));
        }

        private static Historie ParseIssues(IEnumerable<string> zeilen) {
            var incidents = zeilen.Select(x => ParseIssue(x)).ToList();
            return new Historie(incidents);
        }

        private static Incident ParseIssue(string zeile) {
            var kandidaten = zeile.Split(Trenner, StringSplitOptions.TrimEntries | 
                                                         StringSplitOptions.RemoveEmptyEntries);

            var start = DateTime.ParseExact(kandidaten[0], DatumsFormat, CultureInfo.InvariantCulture);
            var end = DateTime.ParseExact(kandidaten[1], DatumsFormat, CultureInfo.InvariantCulture);
            return new Incident(start, end); 
        }
    }
}