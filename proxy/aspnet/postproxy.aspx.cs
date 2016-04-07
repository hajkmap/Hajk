using System;
using System.Collections.Generic;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;
using System.IO;
using System.Text;

public partial class postProxy : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        
        var remoteUrl = Request.QueryString["url"];

        var req = (HttpWebRequest)WebRequest.Create(remoteUrl);
        req.AllowAutoRedirect = false;
        req.Method = Request.HttpMethod;
        req.ContentType = Request.ContentType;
        req.UserAgent = Request.UserAgent;
        req.PreAuthenticate = true;
        req.Headers["Remote-User"] = HttpContext.Current.User.Identity.Name;
        foreach (string each in Request.Headers)
            if (!WebHeaderCollection.IsRestricted(each) && each != "Remote-User")
                req.Headers.Add(each, Request.Headers.Get(each));
        if (Request.HttpMethod == "POST")
        {
            var outputStream = req.GetRequestStream();
            CopyStream(Request.InputStream, outputStream);
            outputStream.Close();
        }

        HttpWebResponse response;
        try
        {
            response = (HttpWebResponse)req.GetResponse();
        }
        catch (WebException we)
        {
            response = (HttpWebResponse)we.Response;
            if (response == null)
            {
                Response.StatusCode = 13;
                Response.Write("Could not contact back-end site");
                Response.End();
                return;
            }
        }

        Response.StatusCode = (int)response.StatusCode;
        Response.StatusDescription = response.StatusDescription;
        Response.ContentType = response.ContentType;
        if (response.Headers.Get("Location") != null)
        {
            var urlSuffix = response.Headers.Get("Location");
            //if (urlSuffix.ToLower().StartsWith(ConfigurationSettings.AppSettings["ProxyUrl"].ToLower()))
            //    urlSuffix = urlSuffix.Substring(ConfigurationSettings.AppSettings["ProxyUrl"].Length);
            Response.AddHeader("Location", Request.Url.GetLeftPart(UriPartial.Authority) + urlSuffix);
        }
        foreach (string each in response.Headers)
            if (each != "Location" && !WebHeaderCollection.IsRestricted(each))
                Response.AddHeader(each, response.Headers.Get(each));

        CopyStream(response.GetResponseStream(), Response.OutputStream);
        response.Close();
        Response.End();
    }

    static public void CopyStream(Stream input, Stream output)
    {
        var buffer = new byte[1024];
        int bytes;
        while ((bytes = input.Read(buffer, 0, 1024)) > 0)
            output.Write(buffer, 0, bytes);
    }

    public bool IsReusable
    {
        get { return false; }
    }
}
