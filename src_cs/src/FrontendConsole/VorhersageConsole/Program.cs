using System;
using forecast.backend;

namespace forecast.ui.console;


internal class Program
{
    static void Main(string[] args)
    {
        // construction
        var cla = new CommandlineArguments(args);
        var ui = new ConsoleUi();
        var csvAdapter = new CsvProvider();
        var randomProvider = new RandomNumberProvider();
        var domain = new Augur(randomProvider);
        var processor = new Processor(csvAdapter, domain);
        var app = new Application(ui, processor);

        // execution
        app.Run(cla.Filename, cla.NumberOfIssues, cla.NumberOfSimulations);
    }
}