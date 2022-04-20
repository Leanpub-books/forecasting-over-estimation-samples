using System.ComponentModel.DataAnnotations;
using NUnit.Framework;
using RandomProvider;
using VorhersageContracts;

namespace RandomProviderTests
{
    public class RandomNumberProviderTests
    {

        [Test]
        public void Liefere_Eine_Million_Zahlen()
        {
            IRandomProvider randomProvider = new RandomNumberProvider();
            for (int i = 0; i < 1000000; ++i)
            {
                try
                {
                    randomProvider.Next(4711);
                }
                catch
                {
                    Assert.Fail($@"RandomNumberProvider only provided {i} numbers.");
                }
            }
        }

        [Test]
        public void Liefere_Zahlen_Kleiner_Als_upper()
        {
            IRandomProvider randomProvider = new RandomNumberProvider();
            for (int i = 0; i < 10000; ++i)
            {
                Assert.That(randomProvider.Next(4711), Is.LessThan(4711));
            }
        }

        [Test]
        public void Liefere_Zahlen_GrößerGleich_Als_Null()
        {
            IRandomProvider randomProvider = new RandomNumberProvider();
            for (int i = 0; i < 10000; ++i)
            {
                Assert.That(randomProvider.Next(4711), Is.GreaterThanOrEqualTo(0));
            }
        }
    }
}