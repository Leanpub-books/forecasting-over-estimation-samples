using System.Globalization;
using System.Linq;
using forecast_contracts;

namespace forecast.ui.console;

class AsciiBarChart {
    private static CultureInfo _cultureInfo = CultureInfo.GetCultureInfo("EN-us");
    private const string FormatString = "N1";
        
    public string[] Bars { get; init; }

    public AsciiBarChart(VorhersageWerte vorhersageWerte) {
        this.Bars = vorhersageWerte.Werte.Select(Render).ToArray();
    }


    private string Render(VorhersageWert vorhersageWert) {
        var kumulierteformattiert = (vorhersageWert.KumulierteWahrscheinlichkeit * 100).ToString(FormatString, _cultureInfo);
        var balken = new string('█', (int)(vorhersageWert.RelativeHäufigkeit * 1000));
        var realitveFormattiert = (vorhersageWert.RelativeHäufigkeit * 100).ToString(FormatString, _cultureInfo);

        return $"{vorhersageWert.Dauer, 3} {kumulierteformattiert, 5}% {balken}  {realitveFormattiert}%";
    }
}