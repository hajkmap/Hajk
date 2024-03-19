using MapService.DataAccess;

namespace MapService.Business
{
    internal static class SpecificationHandler
    {
        internal static string GetOpenApiSpecification()
        {
            return JsonFileDataAccess.GetOpenApiSpecification();
        }
    }
}