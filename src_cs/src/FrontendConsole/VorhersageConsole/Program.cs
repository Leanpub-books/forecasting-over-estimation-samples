using System;
using forecast.backend;

namespace forecast.ui.console
{
    internal record CommandLineArguments(string Path, int AnzahlIncidents, int AnzahlSimualtionen);
    internal class Program
    {
        static void Main(string[] args)
        {
            var ui = new ConsoleUi();
            var csvAdapter = new CsvProvider();
            var randomProvider = new RandomNumberProvider();
            var domain = new Vorhersage(randomProvider);
            var processor = new Processor(csvAdapter, domain);
            var app = new Application(ui, processor);

            var argumente = ParseArguments(args);
            app.Run(argumente.Path, argumente.AnzahlIncidents, argumente.AnzahlSimualtionen);
        }

        static CommandLineArguments ParseArguments(string[] args)
        {
            if (args.Length < 2) {
                Console.Error.WriteLine("Usage: forecast <Dateiname der hist. Daten> <Anzahl Issues> [<Anzahl Simulationsläufe>]");
                Environment.Exit(1);
            }

            var filename = args[0];
            var numberOfIssues = int.Parse(args[1]);
            var numberOfSimilations = 1000;
            if (args.Length == 3) numberOfSimilations = int.Parse(args[2]);
            
            return new CommandLineArguments(filename, numberOfIssues, numberOfSimilations);
        }
    }


}
