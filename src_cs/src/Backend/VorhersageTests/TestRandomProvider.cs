using forecast_contracts;

namespace VorhersageTests
{
    public class TestRandomProvider : IRandomProvider
    {
        private readonly int[] _randomNumbers = { 4, 3, 1, 2, 3, 2, 3, 4, 4, 4, 3, 1 };
        private int _pointer = 0;

        public int Next(int upper)
        {
            int currentRandomNumber = _randomNumbers[_pointer];

            if (_pointer == 11)
                _pointer = 0;

            _pointer++;
            return currentRandomNumber;
        }
    }
}
