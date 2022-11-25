using Json.Path;
using System.Text.Json;

namespace MapService.Business
{
    /// <summary>
    /// JsonPath utility class
    /// </summary>
    public static class JsonPathUtility
    {
        /// <summary>
        /// Parses a JsonDocument with JsonPath input and returns a JsonElement.
        /// </summary>
        /// <param name="jsonDocument">JsonDocument to be parsed.</param>
        /// <param name="input">JsonPath to evaluate.</param>
        /// <returns>Parsed JsonElement</returns>
        /// <exception cref="Exception">Configuration Error</exception>
        public static JsonElement? GetJsonElement(JsonDocument jsonDocument, string input)
        {
            var path = JsonPath.Parse(input);

            var result = path.Evaluate(jsonDocument.RootElement);

            if (result.Error != null) { throw new Exception("Configuration Error"); }
            if (result.Matches == null) { return null; }
            if (result.Matches.Count > 1) { throw new Exception("Configuration Error"); }
            if (result.Matches.Count == 0) { return null; }

            return result.Matches[0].Value;
        }
    }
}