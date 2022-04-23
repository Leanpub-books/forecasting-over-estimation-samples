using System.Collections.Generic;
using NUnit.Framework;
using forecast.Vorhersage;
using forecast_contracts;

#pragma warning disable CS8618

namespace VorhersageTests
{
    public class UnitTest1
    {
        private IRandomProvider _testRandomProvider;
        private VorhersageImpl _sut;

        [SetUp]
        public void Setup()
        {
            _testRandomProvider = new TestRandomProvider();
            _sut = new VorhersageImpl(_testRandomProvider);
        }

        [Test]
        public void Test_SimulationGenerieren()
        {
            //Arrange
            int[] cycleTimes = { 1, 2, 3, 4, 5 };

            //Act
            List<int> gaussSimulation = _sut.SimulationGenerieren(cycleTimes, 3, 4);

            //Assert
            List<int> expectedResult = new List<int> { 11, 10, 14, 11};
            Assert.That(gaussSimulation, Is.EquivalentTo(expectedResult));
        }

        [Test]
        public void Test_Gruppieren()
        {
            //Arrange
            List<int> input = new List<int>() { 2, 4, 3, 3, 1, 0, 1, 2, 4, 0, 1, 3 };

            //Act
            Dictionary<int, int> gruppiert = _sut.Gruppieren(input);

            //Assert
            Dictionary<int, int> expected = new Dictionary<int, int>();
            expected.Add(0, 2);
            expected.Add(1, 3);
            expected.Add(2, 2);
            expected.Add(3, 3);
            expected.Add(4, 2);

            Assert.That(gruppiert, Is.EquivalentTo(expected));
        }

        [Test]
        public void Test_Normieren()
        {
            //Arrange
            Dictionary<int, int> gruppiert = new Dictionary<int, int>();
            gruppiert.Add(0, 2);
            gruppiert.Add(1, 3);
            gruppiert.Add(2, 2);
            gruppiert.Add(3, 3);
            gruppiert.Add(4, 2);

            //Act
            IEnumerable<VorhersageWert> vorhersagen = _sut.Normieren(gruppiert);

            //Assert
            List<VorhersageWert> expected = new List<VorhersageWert>
            {
                new(0, 1/(double)6, 1/(double)6),
                new(1, 0.25, 1/(double)6 + 0.25),
                new(2, 1/(double)6, (double)1/6 + 0.25 + 1/(double)6),
                new(3, 0.25, 1/(double)6 + 0.25 + 1/(double)6 + 0.25),
                new(4, 1/(double)6, 1/(double)6 + 0.25 + 1/(double)6 + 0.25 + 1/(double)6)
            };

            Assert.That(vorhersagen, Is.EquivalentTo(expected));
        }
    }
}
