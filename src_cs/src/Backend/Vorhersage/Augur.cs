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

        public Vorhersage Vorhersagen(Historie historie, int issues, int simulations) {
            var gaussSimulation = new Simulator(simulations, _randomProvider).Run(historie.CycleTimes, issues);
            return new Vorhersage(Statistiker.Auswerten(gaussSimulation));
        }



        
    }
}
