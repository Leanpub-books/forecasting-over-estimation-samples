using System;
using System.Collections.Generic;
using System.Linq;

namespace forecast_contracts;

public record Historie(IEnumerable<Incident> Incidents) {
    public int[] CycleTimes => Incidents.Select(x => x.CycleTime).ToArray();
}

public record Incident {
    public DateTime Beginn { get; set; }
    public DateTime Ende { get; set; }
    public int CycleTime => (Ende - Beginn).Days;
}