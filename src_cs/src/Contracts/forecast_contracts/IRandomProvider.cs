namespace forecast_contracts;

public interface IRandomProvider
{
    public int Next(int upper);
}