using System.Threading.Tasks;

namespace forecast_contracts;

public interface ICsvProvider
{
    public Task<Historie> AuslesenAsync(string path);
}