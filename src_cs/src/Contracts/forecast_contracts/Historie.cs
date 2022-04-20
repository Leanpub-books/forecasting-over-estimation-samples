using System.Collections.Generic;

namespace forecast_contracts;

public record Historie (
    IEnumerable<Incident> Incidents
);