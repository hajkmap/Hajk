using MapService.DataAccess;
using System.Text.Json.Nodes;

namespace MapService.Business
{
    public static class SpecificationHandler
    {
        public static JsonObject GetSpecification()
        {
            return JsonFileDataAccess.GetSpecification();
        }
    }
}