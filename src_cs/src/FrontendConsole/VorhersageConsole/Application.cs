using System;
using System.Linq;
using forecast_contracts;

namespace forecast.ui.console
{
    internal class Application
    {
        private readonly IConsoleUi ui;
        private readonly IVorhersageProzessor processor;

        public Application(IConsoleUi ui, IVorhersageProzessor processor) {
            this.ui = ui;
            this.processor = processor;
        }

        public void Run(string path, int anzahlIssues, int anzahlSimulationen)
        {
            var ergebnis = processor.VorhersageErstellenAsync(path, anzahlIssues, anzahlSimulationen).Result;
            ui.ErgebnisseAnzeigen(ergebnis);
        }
    }
}
