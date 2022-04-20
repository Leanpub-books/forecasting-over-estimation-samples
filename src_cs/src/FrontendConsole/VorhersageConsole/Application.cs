using System;
using ConsoleUI;
using VorhersageContracts;

namespace VorhersageConsole
{
    internal class Application
    {
        private readonly IConsoleUi ui;
        private readonly IVorhersageProzessor processor;

        public Application(IConsoleUi ui, IVorhersageProzessor processor)
        {
            this.ui = ui ?? throw new ArgumentNullException(nameof(ui));
            this.processor = processor ?? throw new ArgumentNullException(nameof(processor));
        }

        public void Run(string path, int anzahlIssues, int anzahlSimulationen)
        {
            var ergebnis = processor.VorhersageErstellenAsync(new VorhersageParameter(path, anzahlIssues, anzahlSimulationen)).Result;
            ui.ErgebnisseAnzeigen(ergebnis);
        }
    }
}
