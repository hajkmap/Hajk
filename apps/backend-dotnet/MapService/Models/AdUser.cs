using System.Text.Json.Serialization;

namespace MapService.Models
{
    public class AdUser
    {
        [JsonPropertyName("dn")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Dn { get; set; }

        [JsonPropertyName("distinguishedName")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? DistinguishedName { get; set; }

        [JsonPropertyName("userPrincipalName")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? UserPrincipalName { get; set; }

        [JsonPropertyName("sAMAccountName")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? SAMAccountName { get; set; }

        [JsonPropertyName("mail")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Mail { get; set; }

        [JsonPropertyName("whenCreated")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? WhenCreated { get; set; }

        [JsonPropertyName("pwdLastSet")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? PwdLastSet { get; set; }

        [JsonPropertyName("userAccountControl")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? UserAccountControl { get; set; }

        [JsonPropertyName("sn")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Sn { get; set; }

        [JsonPropertyName("givenName")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? GivenName { get; set; }

        [JsonPropertyName("cn")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Cn { get; set; }

        [JsonPropertyName("displayName")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? DisplayName { get; set; }
    }
}