using System.Threading.Tasks;
using forecast_contracts;

namespace VorhersageProzessor
{
    public class Processor : IVorhersageProzessor
    {
        private readonly ICsvProvider csvProvider;
        private readonly IVorhersage vorhersage;

        public Processor(
            ICsvProvider csvProvider,
            IVorhersage vorhersage)
        {
            this.csvProvider = csvProvider;
            this.vorhersage = vorhersage;
        }

        public async Task<VorhersageWerte> VorhersageErstellenAsync(VorhersageParameter vorhersageParameter)
        {
            var historie = await csvProvider.AuslesenAsync(vorhersageParameter.Pfad);
            return vorhersage.Berechnen(historie, vorhersageParameter.Issues, vorhersageParameter.AnzahlSimulationen);
        }
    }
}