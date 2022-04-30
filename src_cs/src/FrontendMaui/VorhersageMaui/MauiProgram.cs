using forecast.backend;
using forecast_contracts;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebView.Maui;
using Microsoft.Extensions.DependencyInjection.Extensions;
using VorhersageMaui.Services;

namespace VorhersageMaui;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
			});

        builder.Services.AddMauiBlazorWebView();
		// Workaround for still(!) missing registration in AddBlazorWebView, should have be fixed for WebView.Maui > 6.200
		builder.Services.TryAddScoped<IErrorBoundaryLogger, FixMissingWebViewErrorBoundaryLogger>();
		builder.Services.TryAddSingleton<IVorhersageProzessor>(new Processor(new CsvProvider(), new Augur(new RandomNumberProvider())));
		return builder.Build();
	}
}
