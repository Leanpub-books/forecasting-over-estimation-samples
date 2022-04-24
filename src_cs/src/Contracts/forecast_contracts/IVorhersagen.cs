namespace forecast_contracts;

public interface IVorhersagen
{
    public Vorhersage Vorhersagen(Historie historie, int issues, int anzahlSimulationen);
}