using MapService.DataAccess;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace MapService.Controllers
{
    public class ExtendedWMSLayerController : ApiController
    {
        private readonly SettingsDbContext _settingsDataContext;

        public ExtendedWMSLayerController()
        {
            try
            {
                _settingsDataContext = new DataAccess.SettingsDbContext();
            }
            catch (Exception ex)
            {
                Trace.TraceError("WMS save error on startup: {0}", ex);
                throw;
            }
        }

        // POST: api/ExtendedWMSLayer
        public IHttpActionResult Post([FromBody]Models.Config.ExtendedWmsConfig config)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    _settingsDataContext.AddExtendedWMSLayer(config);
                    return Ok();
                }
                Console.WriteLine(ModelState.ToString());
                return BadRequest(ModelState);
            }
            catch (Exception ex)
            {
                Trace.TraceError("{0}", ex);
                return InternalServerError();
            }
        }

        // PUT: api/ExtendedWMSLayer/
        public void Delete(string id)
        {
            this._settingsDataContext.RemoveExtendedWMSLayer(id);
        }

        public IHttpActionResult Put(Models.Config.ExtendedWmsConfig config)
        {
            if(ModelState.IsValid)
            {
                this._settingsDataContext.UpdateExtendedWMSLayer(config);
                return Ok();
            }
            return BadRequest(ModelState);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing && _settingsDataContext != null)
                _settingsDataContext.Dispose();
        }
    }
}
