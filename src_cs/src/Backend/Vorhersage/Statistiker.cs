using System.Collections.Generic;
using System.Linq;
using forecast_contracts;

namespace forecast.backend;

class Statistiker
{
    public static IEnumerable<VorhersageWert> Auswerten(IEnumerable<int> gaussSimulation) {
        var gruppiert = Gruppieren(gaussSimulation.ToArray());
        var vorhersagen = Normieren(gruppiert);
        return vorhersagen;
    }

    internal static IDictionary<int, int> Gruppieren(int[] simulationsergebnisse)
    {
        var min = simulationsergebnisse.Min();
        var max = simulationsergebnisse.Max();

        return simulationsergebnisse.Aggregate(
            new SortedDictionary<int,int>(),
            (gruppen, wert) => {
                if (!gruppen.ContainsKey(wert)) gruppen.Add(wert, 0);
                gruppen[wert]++;
                return gruppen;
            });
    }

    internal static IEnumerable<VorhersageWert> Normieren(IDictionary<int, int> gruppierteVerteilung)
    {
        int area = gruppierteVerteilung.Sum(x => x.Value);

        List<VorhersageWert> alleVorhersagewerte = new();
        double kumulierteWahrscheinlichkeit = 0.0;

        foreach (KeyValuePair<int, int> oneKeyValuePair in gruppierteVerteilung)
        {
            double relHäufigkeit = oneKeyValuePair.Value / (double) area;
            kumulierteWahrscheinlichkeit += relHäufigkeit;

            VorhersageWert vorhersageWert = new VorhersageWert(oneKeyValuePair.Key, relHäufigkeit, kumulierteWahrscheinlichkeit);
            alleVorhersagewerte.Add(vorhersageWert);
        }

        return alleVorhersagewerte;
    }
}