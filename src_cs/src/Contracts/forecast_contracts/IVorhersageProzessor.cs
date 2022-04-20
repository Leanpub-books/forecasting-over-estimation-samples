using System.Threading.Tasks;

namespace forecast_contracts;

public interface IVorhersageProzessor
{
    public Task<VorhersageWerte> VorhersageErstellenAsync(VorhersageParameter vorhersageParameter);
}