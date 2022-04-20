using System;
using System.Runtime.InteropServices.ComTypes;
using VorhersageContracts;

namespace RandomProvider
{
    public class RandomNumberProvider : IRandomProvider
    {
        private Random random = new();
        public int Next(int upper) => random.Next(upper);
    }
}