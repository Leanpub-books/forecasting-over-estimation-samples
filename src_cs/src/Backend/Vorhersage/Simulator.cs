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
    
    
    public IEnumerable<int> RunWithThroughputs(int[] throughputs, int issues) {
        return Enumerable.Range(1, _numberOfSimulations).Select(_ => {
            var totalCycleTime = 0;
            var issuesDelivered = 0;
            while (issuesDelivered < issues) {
                totalCycleTime++;
                var i = _randomProvider.Next(throughputs.Length - 1);
                issuesDelivered += throughputs[i];
            }
            return totalCycleTime;
        });
    }
        
        
    public IEnumerable<int> RunWithCycleTimes(int[] cycleTimes, int issues) {
        return Enumerable.Range(1, _numberOfSimulations).Select(_ => {
            return Enumerable.Range(1, issues).Aggregate(0, (prognosis, _) => {
                var i = _randomProvider.Next(cycleTimes.Length - 1);
                return prognosis + cycleTimes[i];
            });
        });
    }
}