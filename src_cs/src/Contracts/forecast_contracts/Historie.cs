using System;
using System.Collections.Generic;
using System.Linq;

namespace forecast_contracts;

public record Historie(IEnumerable<Incident> Incidents) {
    public int[] CycleTimes => Incidents.Select(x => x.CycleTime).ToArray();

    public int[] Durchsätze {
        get {
            var ersterTag = this.Incidents.Min(x => x.Beginn);
            var letzterTag = this.Incidents.Max(x => x.Ende);
            
            var durchsatzKalender = new SortedDictionary<DateTime,int>();
            for (var tag = ersterTag; tag <= letzterTag; tag = tag.AddDays(1))
                durchsatzKalender.Add(tag, 0);

            foreach (var incident in this.Incidents)
                durchsatzKalender[incident.Ende]++;

            return durchsatzKalender.Values.ToArray();
        }
    }
}


public record Incident(DateTime Beginn, DateTime Ende) {
    public int CycleTime => (Ende - Beginn).Days;
}