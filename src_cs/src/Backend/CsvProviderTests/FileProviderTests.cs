using System;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using forecast.backend;

namespace CsvProviderTests
{
    public class Tests
    {
        [ExcludeFromCodeCoverage]
        public class LeseIssuesAsyncTests
        {
            private string _pathHistorie1Csv = "../../../../../../Daten/Historie1.csv";
            private string _HistorieZeile1 = "Beginn;Ende";
            private CsvProvider _sut = new();

            [Test]
            public async Task Lese_Historie1_20Issues()
            {
                // act
                var actual = await _sut.AuslesenAsync(_pathHistorie1Csv);
                
                // assert
                actual.Incidents.Count().Should().Be(20);
            }

            [TestCase("bla")]
            [TestCase("bla;blubb")]
            [TestCase("2021-10-18;2021-13-19")]
            [TestCase("bla;2021-10-18")]
            public async Task Lese_Historie_KeinDatumException(string wrong)
            {
                // arrange
                var tempFileName = Path.GetTempFileName();

                await using StreamWriter outFile = new StreamWriter(tempFileName);
                await outFile.WriteLineAsync(_HistorieZeile1);
                await outFile.WriteLineAsync("2021-10-11;2021-10-13");
                await outFile.WriteLineAsync(wrong);
                await outFile.WriteLineAsync("2021-10-11;2021-10-13");
                await outFile.FlushAsync();
                outFile.Close();

                Func<Task> act = async () => await _sut.AuslesenAsync(tempFileName);

                // act and assert
                await act.Should().ThrowAsync<FormatException>();

                // cleanup
                var file = new FileInfo(tempFileName);
                file.Delete();
            }

            [Test]
            public async Task Lese_Historie_LeereZeileException()
            {
                // arrange
                var tempFileName = Path.GetTempFileName();

                await using StreamWriter outFile = new StreamWriter(tempFileName);
                await outFile.WriteLineAsync(_HistorieZeile1);
                await outFile.WriteLineAsync("2021-10-11;2021-10-13");
                await outFile.WriteLineAsync("");
                await outFile.WriteLineAsync("2021-10-11;2021-10-13");
                await outFile.FlushAsync();
                outFile.Close();

                Func<Task> act = async () => await _sut.AuslesenAsync(tempFileName);

                // act and assert
                await act.Should().ThrowAsync<IndexOutOfRangeException>();

                // cleanup
                var file = new FileInfo(tempFileName);
                file.Delete();
            }
        }
    }
}