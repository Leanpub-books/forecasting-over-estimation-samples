namespace forecast_contracts;

public interface IVorhersagen
{
    public Vorhersage VorhersagenMitCycleTime(Historie historie, int issues, int anzahlSimulationen);
    public Vorhersage VorhersagenMitDurchsatz(Historie historie, int issues, int anzahlSimulationen);
}