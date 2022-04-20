namespace forecast_contracts;

public interface IVorhersage
{
    public VorhersageWerte Berechnen(Historie historie, int issues, int anzahlSimulationen);
}