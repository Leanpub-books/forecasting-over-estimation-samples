using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using forecast_contracts;

[assembly: InternalsVisibleTo("VorhersageTests")]
namespace forecast.backend
{
    public class Vorhersage : IVorhersage
    {
        private readonly IRandomProvider _randomProvider;

        public Vorhersage(IRandomProvider randomProvider) {
            _randomProvider = randomProvider;
        }

        public VorhersageWerte Berechnen(Historie historie, int issues, int simulations)
        {
            List<int> gaussSimulation = new Simulator(simulations, _randomProvider).Run(historie.Incidents.Select(x => x.Tage).ToArray(), issues);
            return new VorhersageWerte(Statistik(gaussSimulation));
        }



        internal IEnumerable<VorhersageWert> Statistik(List<int> gaussSimulation)
        {
            var gruppiert = Gruppieren(gaussSimulation);
            var vorhersagen = Normieren(gruppiert);
            return vorhersagen;
        }

        internal Dictionary<int, int> Gruppieren(List<int> gaussSimulation)
        {
            Dictionary<int, int> result = new();
            int min = gaussSimulation.Min();
            int max = gaussSimulation.Max();

            for (int index = min; index <= max; index++)
            {
                if(!gaussSimulation.Contains(index))
                    continue;

                int occurrence = gaussSimulation.Count(x => x.Equals(index));
                result.Add(index, occurrence);
            }

            return result;
        }

        internal IEnumerable<VorhersageWert> Normieren(Dictionary<int, int> gruppierteVerteilung)
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
}
