using System;
using forecast_contracts;
using NUnit.Framework;

namespace test_forecast_contracts;

public class test_Historie
{
    [Test]
    public void Durchsätze()
    {
        /*
            27.1 28.1. 29.1. 30.1. 31.1. 1.2. 2.2. 3.2.
            0    0     0     1     1     2    0    3
         */
        var sut = new Historie(new[] {
            new Incident(new DateTime(2022, 1, 29), new DateTime(2022, 1, 30)),
            new Incident(new DateTime(2022, 1, 28), new DateTime(2022, 1, 31)),
            new Incident(new DateTime(2022, 1, 28), new DateTime(2022, 2, 1)),
            new Incident(new DateTime(2022, 1, 27), new DateTime(2022, 2, 3)),
            new Incident(new DateTime(2022, 1, 28), new DateTime(2022, 2, 1)),
            new Incident(new DateTime(2022, 1, 29), new DateTime(2022, 2, 3)),
            new Incident(new DateTime(2022, 1, 30), new DateTime(2022, 2, 3)),
        });
        
        Assert.That(sut.Durchsätze, Is.EqualTo(new[]{0,0,0,1,1,2,0,3}));
    }
}