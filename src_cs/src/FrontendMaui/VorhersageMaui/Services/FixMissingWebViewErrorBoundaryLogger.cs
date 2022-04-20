// Fix from Preview 6.3 #40508
// https://github.com/dotnet/aspnetcore/pull/40508/files/984c37f7ff32035b0e4baa1b5fea706e5081d8e2

using Microsoft.AspNetCore.Components.Web;
using Microsoft.Extensions.Logging;

namespace VorhersageMaui.Services;

public class FixMissingWebViewErrorBoundaryLogger : IErrorBoundaryLogger
{
    private readonly ILogger<ErrorBoundary> _errorBoundaryLogger;

    public FixMissingWebViewErrorBoundaryLogger(ILogger<ErrorBoundary> errorBoundaryLogger)
    {
        _errorBoundaryLogger = errorBoundaryLogger;
    }

    public ValueTask LogErrorAsync(Exception exception)
    {
        // For, client-side code, all internal state is visible to the end user. We can just
        // log directly to the console.
        _errorBoundaryLogger.LogError(exception, exception.ToString());
        return ValueTask.CompletedTask;
    }
}