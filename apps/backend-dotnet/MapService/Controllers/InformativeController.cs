using MapService.Business.Ad;
using MapService.Business.Informative;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("api/v{version:apiVersion}/informative")]
    [ApiVersion("1.0")]
    [ApiVersion("2.0")]
    [Produces("application/json")]
    [ApiController]
    public class InformativeController : ControllerBase
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<InformativeController> _logger;

        public InformativeController(IMemoryCache memoryCache, ILogger<InformativeController> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <remarks>
        /// Return all available documents
        /// </remarks>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Return all available documents</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult GetDocumentList([FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            IEnumerable<string> documentList;

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                documentList = InformativeHandler.GetDocumentList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <remarks>
        /// Return available documents of a map
        /// </remarks>
        /// <param name="name">Name of the map for which connected documents will be returned</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Return available documents for the specified map</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list/{name}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult GetDocumentList(string name, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            IEnumerable<string> documentList;

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                documentList = InformativeHandler.GetDocumentList(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <remarks>
        /// Fetch contents of the whole document.
        /// </remarks>
        /// <param name="document">Name of the document to be fetched</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">Return the JSON file</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpGet]
        [Route("load/{document}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult GetDocument(string document, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            JsonObject documentAsJson;

            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);
                    
                    if (userPrincipalName == null || !adHandler.UserIsValid(userPrincipalName))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                documentAsJson = InformativeHandler.GetDocument(document);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentAsJson);
        }

        /// <remarks>
        /// Create a new map configuration
        /// </remarks>
        /// <param name="requestBody">The name of the document and the map</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPost]
        [Route("create")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult CreateDocumentPost([Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                InformativeHandler.CreateDocument(requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Create a new map configuration
        /// </remarks>
        /// <param name="requestBody">The name of the document and the map</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="204">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPut]
        [Route("create")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult CreateDocumentPut([Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                InformativeHandler.CreateDocument(requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <remarks>
        /// Save a document
        /// </remarks>
        /// <param name="name">Name of the document to be saved</param>
        /// <param name="requestBody">Settings from the request body</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPost]
        [Route("save/{name}")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult SaveDocumentPost(string name, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                InformativeHandler.SaveDocument(name, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK);
        }

        /// <remarks>
        /// Save a document
        /// </remarks>
        /// <param name="name">Name of the document to be saved</param>
        /// <param name="requestBody">Settings from the request body</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPut]
        [Route("save/{name}")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult SaveDocumentPut(string name, [Required][FromBody] JsonObject requestBody, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                InformativeHandler.SaveDocument(name, requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK);
        }

        /// <remarks>
        /// Delete an existing document
        /// </remarks>
        /// <param name="name">Document to be deleted</param>
        /// <param name="userPrincipalName">User name that will be supplied to AD. This header can be configured by the administrator to be named something other than X-Control-Header.</param>
        /// <response code="200">All good</response>
        /// <response code="403">Forbidden</response>
        /// <response code="500">Internal Server Error</response>
        [HttpDelete]
        [Route("delete/{name}")]
        [MapToApiVersion("1.0")]
        [MapToApiVersion("2.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult DeleteDocument(string name, [FromHeader(Name = "X-Control-Header")] string? userPrincipalName = null)
        {
            try
            {
                if (AdHandler.AdIsActive)
                {
                    var adHandler = new AdHandler(_memoryCache, _logger);

                    string? remoteIpAddress = adHandler.GetRemoteIpAddress(HttpContext);
                    if (!adHandler.IpRangeRestrictionIsSet())
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication is active but no IP range restriction is set in appsettings.json file."
                                               + " This means that you accept the value of X-Control-Header from any request, which is potentially a huge security risk!.");
                    }
                    if (!adHandler.RequestComesFromAcceptedIp(HttpContext))
                    {
                        return StatusCode(StatusCodes.Status500InternalServerError, "AD authentication does not allow requests from " + remoteIpAddress + ". Aborting.");
                    }

                    userPrincipalName = adHandler.PickUserNameToUse(Request, userPrincipalName);

                    if (!adHandler.UserIsValid(userPrincipalName) || !AdHandler.UserHasAdAccess(userPrincipalName, _logger))
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, "Forbidden");
                    }
                }

                InformativeHandler.DeleteDocument(name);
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found");
                return StatusCode(StatusCodes.Status500InternalServerError, "File not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, "Document deleted");
        }
    }
}