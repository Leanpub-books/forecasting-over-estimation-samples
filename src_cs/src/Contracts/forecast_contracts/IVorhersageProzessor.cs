using System.Threading.Tasks;

namespace forecast_contracts;

public interface IVorhersageProzessor {
    public Task<Vorhersage> VorhersageErstellenAsync(string filepath, int numberOfIssues, int numberOfSimulations);
}