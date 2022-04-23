using System;

namespace forecast.ui.console;

record CommandlineArguments
{
    public string Filename { get; init; }
    public int NumberOfIssues { get; init; }
    public int NumberOfSimulations { get; init; }
        
    public CommandlineArguments(string[] args) {
        if (args.Length < 2) {
            Console.Error.WriteLine("Usage: forecast <Dateiname der hist. Daten> <Anzahl Issues> [<Anzahl Simulationsläufe>]");
            Environment.Exit(1);
        }

        Filename = args[0];
        NumberOfIssues = int.Parse(args[1]);
        NumberOfSimulations = 1000;
        if (args.Length == 3) NumberOfSimulations = int.Parse(args[2]);
    }
}