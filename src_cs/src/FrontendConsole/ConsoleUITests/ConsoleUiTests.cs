using System;
using System.IO;
using NUnit.Framework;
using forecast_contracts;

namespace forecast.ui.console
{
    public class ConsoleUiTests
    {
        private MemoryStream? _ms;
        private TextReader? _reader;
        private TextWriter? _tw;

        [SetUp]
        public void Setup()
        {
            _ms = new MemoryStream();
            _tw = new StreamWriter(_ms);
            _reader = new StreamReader(_ms);

            Console.SetOut(_tw);
        }

        [TearDown]
        public void TearDown()
        {
            _reader?.Close();
            _reader?.Dispose();

            _tw?.Close();
            _tw?.Dispose();

            _reader?.Close();
            _reader?.Dispose();
        }

        private string? ReadStreamToEnd()
        {
            _tw?.Flush();
            _ms?.Seek(0, SeekOrigin.Begin);

            return _reader?.ReadToEnd();
        }
        
        [Test]
        public void Display_OneValue_ExpectOneLine()
        {
            var vorhersage = new VorhersageWert(5, 0.031, 1.0);
            var sut = new ConsoleUi();

            sut.ErgebnisseAnzeigen(new Vorhersage(new[] { vorhersage}));
            var result = ReadStreamToEnd();

            Assert.AreEqual($"  5 100.0% ███████████████████████████████  3.1%{Environment.NewLine}", result);
        }

        [Test]
        public void Display_TwoValues_ExpectTwoLines()
        {
            var vorhersage1 = new VorhersageWert(5, 0.031, 1.0);
            var vorhersage2 = new VorhersageWert(5, 0.021, 0.042);
            var sut = new ConsoleUi();

            sut.ErgebnisseAnzeigen(new Vorhersage(new[] { vorhersage1, vorhersage2 }));
            var result = ReadStreamToEnd();

            var expected = $"  5 100.0% ███████████████████████████████  3.1%{Environment.NewLine}" +
                                 $"  5   4.2% █████████████████████  2.1%{Environment.NewLine}";
            Assert.AreEqual(expected, result);
            //"  5 100.0% ███████████████████████████████  3.1%\r\n  5   4.2% █████████████████████  2.1%\r
        }
    }
}