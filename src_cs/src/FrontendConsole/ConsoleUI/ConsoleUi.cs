using System;
using forecast_contracts;

namespace forecast.ui.console
{
    public class ConsoleUi: IConsoleUi {
        public void ErgebnisseAnzeigen(Vorhersage vorhersage) {
            var bc = new AsciiBarChart(vorhersage);
            foreach (var bar in bc.Bars)
                Console.WriteLine(bar);
        }
    }
}