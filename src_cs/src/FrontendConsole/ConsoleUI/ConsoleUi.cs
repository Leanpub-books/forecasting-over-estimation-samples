using System;
using forecast_contracts;

namespace forecast.ui.console
{
    public class ConsoleUi: IConsoleUi {
        public void ErgebnisseAnzeigen(VorhersageWerte vorhersageWerte) {
            var bc = new AsciiBarChart(vorhersageWerte);
            foreach (var bar in bc.Bars)
                Console.WriteLine(bar);
        }
    }
}