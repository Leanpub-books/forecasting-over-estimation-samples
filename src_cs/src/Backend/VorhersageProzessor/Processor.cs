using System.Threading.Tasks;
using forecast_contracts;

namespace forecast.backend
{
    public class Processor : IVorhersageProzessor
    {
        private readonly ICsvProvider csvProvider;
        private readonly IVorhersage vorhersage;

        public Processor(ICsvProvider csvProvider, IVorhersage vorhersage) {
            this.csvProvider = csvProvider;
            this.vorhersage = vorhersage;
        }

        public async Task<VorhersageWerte> VorhersageErstellenAsync(string filepath, int numberOfIssues, int numberOfSimulations) {
            var historie = await csvProvider.AuslesenAsync(filepath);
            return vorhersage.Berechnen(historie, numberOfIssues, numberOfSimulations);
        }
    }
}