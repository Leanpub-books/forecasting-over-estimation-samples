using System;
using forecast_contracts;

namespace forecast.backend
{
    public class RandomNumberProvider : IRandomProvider
    {
        private Random random = new();
        public int Next(int upper) => random.Next(upper);
    }
}