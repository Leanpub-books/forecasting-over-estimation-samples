using System;
using System.Globalization;
using System.Linq;
using forecast_contracts;

namespace forecast.ui.console
{
    public class ConsoleUi: IConsoleUi
    {
        private static CultureInfo _cultureInfo = CultureInfo.GetCultureInfo("EN-us");
        private const string FormatString = "N1";

        public void ErgebnisseAnzeigen(VorhersageWerte vorhersageWerte)
        {
            foreach (var vorhersageWert in vorhersageWerte.Werte.ToArray())
            {
                DisplayValue(vorhersageWert);
            }
        }

        private void DisplayValue(VorhersageWert vorhersageWert)
        {
            string line = CreateLine(vorhersageWert);

            DisplayLine(line);
        }

        private void DisplayLine(string line)
        {
            Console.WriteLine(line);
        }

        private string CreateLine(VorhersageWert vorhersageWert)
        {
            var kumulierteformattiert = (vorhersageWert.KumulierteWahrscheinlichkeit * 100).ToString(FormatString, _cultureInfo);
            var balken = new string('█', (int)(vorhersageWert.RelativeHäufigkeit * 1000));
            var realitveFormattiert = (vorhersageWert.RelativeHäufigkeit * 100).ToString(FormatString, _cultureInfo);

            return 
                $"{vorhersageWert.Dauer, 3} {kumulierteformattiert, 5}% {balken}  {realitveFormattiert}%";
        }
    }
}