using System.Threading.Tasks;
using forecast_contracts;

namespace forecast.backend
{
    public class Processor : IVorhersageProzessor
    {
        private readonly ICsvProvider csvProvider;
        private readonly IVorhersagen vorhersage;

        public Processor(ICsvProvider csvProvider, IVorhersagen vorhersage) {
            this.csvProvider = csvProvider;
            this.vorhersage = vorhersage;
        }

        public async Task<Vorhersage> VorhersageErstellenAsync(string filepath, int numberOfIssues, int numberOfSimulations) {
            var historie = await csvProvider.AuslesenAsync(filepath);
            return vorhersage.Vorhersagen(historie, numberOfIssues, numberOfSimulations);
        }
    }
}