using System.Globalization;
using System.Linq;
using forecast_contracts;

namespace forecast.ui.console;

class AsciiBarChart {
    private static CultureInfo _cultureInfo = CultureInfo.GetCultureInfo("EN-us");
    private const string FormatString = "N1";
        
    public string[] Bars { get; init; }

    public AsciiBarChart(Vorhersage vorhersage) {
        this.Bars = vorhersage.Werte.Select(Render).ToArray();
    }


    private string Render(VorhersageWert wert) {
        var kumulierteformattiert = (wert.KumulierteWahrscheinlichkeit * 100).ToString(FormatString, _cultureInfo);
        var balken = new string('█', (int)(wert.RelativeHäufigkeit * 1000));
        var realitveFormattiert = (wert.RelativeHäufigkeit * 100).ToString(FormatString, _cultureInfo);

        return $"{wert.Dauer, 3} {kumulierteformattiert, 5}% {balken}  {realitveFormattiert}%";
    }
}