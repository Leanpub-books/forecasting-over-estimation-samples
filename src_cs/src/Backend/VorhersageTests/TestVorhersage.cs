using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using forecast.backend;
using forecast_contracts;

#pragma warning disable CS8618

namespace VorhersageTests
{
    public class TestVorhersage
    {
        private IRandomProvider _testRandomProvider;
        private IVorhersagen _sut;

        [SetUp]
        public void Setup()
        {
            _testRandomProvider = new TestRandomProvider();
            _sut = new Augur(_testRandomProvider);
        }

        
        [Test]
        public void Test_SimulationGenerieren()
        {
            //Arrange
            int[] cycleTimes = { 1, 2, 3, 4, 5 };

            //Act
            var sut = new Simulator(4, _testRandomProvider);
            var gaussSimulation = sut.Run(cycleTimes, 3);

            //Assert
            var expectedResult = new List<int> { 11, 10, 14, 11};
            Assert.That(gaussSimulation, Is.EquivalentTo(expectedResult));
        }

        [Test]
        public void Test_Gruppieren()
        {
            //Arrange
            var input = new[] { 2, 4, 3, 3, 1, 0, 1, 2, 4, 0, 1, 3 };

            //Act
            IDictionary<int, int> gruppiert = Statistiker.Gruppieren(input);

            //Assert
            Dictionary<int, int> expected = new Dictionary<int, int>();
            expected.Add(0, 2);
            expected.Add(1, 3);
            expected.Add(2, 2);
            expected.Add(3, 3);
            expected.Add(4, 2);
            Assert.That(gruppiert, Is.EquivalentTo(expected));

            // Dict soll die Gruppen in aufsteigender Sortierung enthalten
            Assert.That(gruppiert.Keys.ToArray(), Is.EqualTo(new[]{0,1,2,3,4}));
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
            IEnumerable<VorhersageWert> vorhersagen = Statistiker.Normieren(gruppiert);

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
