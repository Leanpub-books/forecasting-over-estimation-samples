using System;
using forecast_contracts;

namespace forecast.RandomProvider
{
    public class RandomNumberProvider : IRandomProvider
    {
        private Random random = new();
        public int Next(int upper) => random.Next(upper);
    }
}