using Json.Path;
using System.Text.Json;

namespace MapService.Utility
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
            return GetJsonElement(jsonDocument.RootElement, input);
        }

        /// <summary>
        /// Parses a JsonElement with JsonPath input and returns a JsonElement.
        /// </summary>
        /// <param name="jsonElement">JsonElement to be parsed.</param>
        /// <param name="input">JsonPath to evaluate.</param>
        /// <returns>Parsed JsonElement</returns>
        /// <exception cref="Exception">Configuration Error</exception>
        public static JsonElement? GetJsonElement(JsonElement jsonElement, string input)
        {
            var path = JsonPath.Parse(input);

            var result = path.Evaluate(jsonElement);

            if (result.Error != null) { throw new Exception("Configuration Error"); }
            if (result.Matches == null) { return null; }
            if (result.Matches.Count > 1) { throw new Exception("Configuration Error"); }
            if (result.Matches.Count == 0) { return null; }

            return result.Matches[0].Value;
        }

        /// <summary>
        /// Parses a JsonArray with JsonPath input and returns an array.
        /// </summary>
        /// <param name="jsonDocument">JsonDocument to be parsed.</param>
        /// <param name="input">JsonPath to evaluate.</param>
        /// <returns>Returns parsed array</returns>
        /// <exception cref="Exception">Configuration Error</exception>
        public static IReadOnlyList<PathMatch>? GetJsonArray(JsonDocument jsonDocument, string input)
        {
            return GetJsonArray(jsonDocument.RootElement, input); ;
        }

        /// <summary>
        /// Parses a JsonArray with JsonPath input and returns an array.
        /// </summary>
        /// <param name="jsonElement">JsonElement to be parsed.</param>
        /// <param name="input">JsonPath to evaluate.</param>
        /// <returns>Returns parsed array</returns>
        /// <exception cref="Exception">Configuration Error</exception>
        public static IReadOnlyList<PathMatch>? GetJsonArray(JsonElement jsonElement, string input)
        {
            var path = JsonPath.Parse(input);
            var result = path.Evaluate(jsonElement);

            if (result.Error != null) { throw new Exception("Configuration Error"); }
            if (result.Matches == null) { return null; }

            return result.Matches;
        }
    }
}