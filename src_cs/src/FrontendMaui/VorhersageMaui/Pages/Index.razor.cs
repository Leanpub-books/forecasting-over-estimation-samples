using System.Globalization;
using Microsoft.AspNetCore.Components;
using CsvProvider;
using RandomProvider;
using Vorhersage;
using VorhersageContracts;
using VorhersageProzessor;
using VorhersageMaui.Shared;

namespace VorhersageMaui.Pages;

public partial class Index
{
    [Inject]
    protected IVorhersageProzessor Prozessor { get; set; }

    private VorhersageViewModel _viewModel = new();

    protected async Task PickFile()
    {
        _viewModel.ChartVisible = false;
        var fileResult = await FilePicker.PickAsync();
        _viewModel.HistoryFile = fileResult?.FullPath;
        _viewModel.ChartVisible = false;
    }

    private async Task ChartAnzeigen()
    {
        var vorhersageparameter = new VorhersageParameter(_viewModel.HistoryFile, _viewModel.Incidents, _viewModel.Simulations);
        var vorhersage = await Prozessor.VorhersageErstellenAsync(vorhersageparameter);

        _viewModel.ChartData = PrepareChartData(vorhersage);
        _viewModel.ChartVisible = true;
    }

    private ChartDisplayData PrepareChartData(VorhersageWerte vorhersage)
    {
        var labels = vorhersage.Werte.Select(x => x.Dauer.ToString()).ToArray();
        var barData = vorhersage.Werte
            .Select(x => (x.RelativeHäufigkeit * 100)
            .ToString(CultureInfo.InvariantCulture))
            .ToArray();
        var lineData = vorhersage.Werte
            .Select(x => (x.KumulierteWahrscheinlichkeit * 100)
            .ToString(CultureInfo.InvariantCulture))
            .ToArray();
        return new ChartDisplayData(barData, lineData, labels);
    }
}
