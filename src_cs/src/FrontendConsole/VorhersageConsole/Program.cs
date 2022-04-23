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
            return new CommandLineArguments(args[0], int.Parse(args[1]), int.Parse(args[2]));
        }
    }


}
