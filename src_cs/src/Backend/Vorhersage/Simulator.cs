using System;
using System.Collections.Generic;
using System.Linq;
using forecast_contracts;

namespace forecast.backend;

class Simulator {
    private readonly int _numberOfSimulations;
    private readonly IRandomProvider _randomProvider;

    public Simulator(int numberOfSimulations, IRandomProvider randomProvider) {
        _numberOfSimulations = numberOfSimulations;
        _randomProvider = randomProvider;
    }
        
        
    public List<int> Run(int[] cycleTimes, int issues) {
        var max = cycleTimes.Length;

        return Enumerable.Range(1, _numberOfSimulations).Select(_ => {
            return Enumerable.Range(1, issues).Aggregate(0, (prognosis, _) => {
                var randomNumber = _randomProvider.Next(max-1);
                return prognosis + cycleTimes[randomNumber];
            });
        }).ToList();
    }
}