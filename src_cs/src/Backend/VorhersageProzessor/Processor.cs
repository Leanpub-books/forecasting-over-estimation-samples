using System.Threading.Tasks;
using forecast_contracts;

namespace forecast.backend
{
    public class Processor : IVorhersageProzessor
    {
        private readonly ICsvProvider csvProvider;
        private readonly IVorhersagen augur;

        public Processor(ICsvProvider csvProvider, IVorhersagen augur) {
            this.csvProvider = csvProvider;
            this.augur = augur;
        }

        public async Task<Vorhersage> VorhersageErstellenAsync(string filepath, int numberOfIssues, int numberOfSimulations) {
            var historie = await csvProvider.AuslesenAsync(filepath);
            return augur.VorhersagenMitDurchsatz(historie, numberOfIssues, numberOfSimulations);
        }
    }
}