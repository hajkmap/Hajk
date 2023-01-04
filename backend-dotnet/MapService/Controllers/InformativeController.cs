using MapService.Business.Informative;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Nodes;

namespace MapService.Controllers
{
    [Route("informative")]
    [Produces("application/json")]
    [ApiController]
    public class InformativeController : ControllerBase
    {
        private readonly ILogger<InformativeController> _logger;

        public InformativeController(ILogger<InformativeController> logger)
        {
            _logger = logger;
        }

        /// <response code="200">Return all available documents</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult GetDocumentList()
        {
            IEnumerable<string> documentList;

            try
            {
                documentList = InformativeHandler.GetDocumentList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <param name="name">Name of the map for which connected documents will be returned</param>
        /// <response code="200">Return available documents for the specified map</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>List of string</returns>
        [HttpGet]
        [Route("list/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult GetDocumentList(string name)
        {
            IEnumerable<string> documentList;

            try
            {
                documentList = InformativeHandler.GetDocumentList(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, documentList);
        }

        /// <param name="name">Name of the document to be fetched</param>
        /// <response code="200">Return the JSON file</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpGet]
        [Route("load/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Client-accessible" })]
        public ActionResult GetDocument(string name)
        {
            JsonObject document;

            try
            {
                document = InformativeHandler.GetDocument(name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal Server Error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status200OK, document);
        }

        /// <param name="requestBody">The name of the document and the map</param>
        /// <response code="204">All good</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPost]
        [Route("create")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        [Obsolete]
        public ActionResult CreateDocumentPost([Required][FromBody] JsonObject requestBody)
        {
            try
            {
                InformativeHandler.CreateDocument(requestBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error");

                return StatusCode(StatusCodes.Status500InternalServerError, "Internal Server Error");
            }

            return StatusCode(StatusCodes.Status204NoContent);
        }

        /// <param name="requestBody">The name of the document and the map</param>
        /// <response code="204">All good</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPut]
        [Route("create")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult CreateDocumentPut([Required][FromBody] JsonObject requestBody)
        {
            try
            {
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
        /// <response code="200">All good</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPost]
        [Route("save/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        [Obsolete]
        public ActionResult SaveDocumentPost(string name, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
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
        /// <response code="200">All good</response>
        /// <response code="500">Internal Server Error</response>
        /// <returns>JsonObject</returns>
        [HttpPut]
        [Route("save/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult SaveDocumentPut(string name, [Required][FromBody] JsonObject requestBody)
        {
            try
            {
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
        [HttpDelete]
        [Route("delete/{name}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        [SwaggerOperation(Tags = new[] { "Admin - Informative/DocumentHandler" })]
        public ActionResult DeleteDocument(string name)
        {
            try
            {
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
