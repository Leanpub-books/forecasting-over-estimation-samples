using VorhersageContracts;

namespace VorhersageMaui.Pages
{
    internal class VorhersageViewModel
    {
        internal string HistoryFile { get; set; } = string.Empty;
        private int _incidents = 5;
        private int _simulations = 1000;

        internal VorhersageParameter VorhersageParameter { get; set; } = new VorhersageParameter(string.Empty, 5, 1000);
        internal ChartDisplayData ChartData { get; set; } = new ChartDisplayData(new[] { "1", "2" }, new[] { "3", "4" }, new[] { "x", "z" });

        internal bool ChartVisible { get; set; }


        internal int Simulations
        {
            get => _simulations;
            set
            {
                _simulations = value;
                ChartVisible = false;
            }
        }

        internal int Incidents
        {
            get => _incidents;
            set
            {
                _incidents = value;
                ChartVisible = false;
            }
        }
    }
}
