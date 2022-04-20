using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VorhersageContracts
{
    public record VorhersageWerte(
        IEnumerable<VorhersageWert> Werte
        );

    public record VorhersageWert(
            int    Dauer,
            double RelativeHäufigkeit,
            double KumulierteWahrscheinlichkeit
        );

    public record Historie (
        IEnumerable<Incident> Incidents
        );

    public class Incident
    {
        public DateTime Beginn { get; set; }
        public DateTime Ende { get; set; }
        public int Tage => (Ende - Beginn).Days;
    }

    public record VorhersageParameter(
        string Pfad,
        int Issues,
        int AnzahlSimulationen
        );

    public interface IRandomProvider
    {
        public int Next(int upper);
    }

    public interface ICsvProvider
    {
        public Task<Historie> AuslesenAsync(string path);
    }

    public interface IVorhersage
    {
        public VorhersageWerte Berechnen(Historie historie, int issues, int anzahlSimulationen);
    }

    public interface IVorhersageProzessor
    {
        public Task<VorhersageWerte> VorhersageErstellenAsync(VorhersageParameter vorhersageParameter);
    }
}