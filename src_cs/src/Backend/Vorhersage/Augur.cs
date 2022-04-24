using System.Runtime.CompilerServices;
using forecast_contracts;

[assembly: InternalsVisibleTo("VorhersageTests")]
namespace forecast.backend
{
    public class Augur : IVorhersagen
    {
        private readonly IRandomProvider _randomProvider;

        public Augur(IRandomProvider randomProvider) {
            _randomProvider = randomProvider;
        }
        
        public Vorhersage VorhersagenMitDurchsatz(Historie historie, int issues, int simulations) {
            var simulationsergebnis = new Simulator(simulations, _randomProvider).RunWithThroughputs(historie.Durchsätze, issues);
            return new Vorhersage(Statistiker.Auswerten(simulationsergebnis));
        }

        public Vorhersage VorhersagenMitCycleTime(Historie historie, int issues, int simulations) {
            var simulationsergebnis = new Simulator(simulations, _randomProvider).RunWithCycleTimes(historie.CycleTimes, issues);
            return new Vorhersage(Statistiker.Auswerten(simulationsergebnis));
        }
    }
}
