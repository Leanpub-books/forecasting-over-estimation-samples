using System;

namespace forecast_contracts;

public class Incident
{
    public DateTime Beginn { get; set; }
    public DateTime Ende { get; set; }
    public int Tage => (Ende - Beginn).Days;
}