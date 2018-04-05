using System;
using System.Collections.Generic;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Net;
using System.IO;
using System.Text;
using System.Configuration;

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

        if(HttpContext.Current.User.Identity.Name != null)
        {
            if (IsAuthorizedInternetDomain(remoteUrl)) // Only add header for authorized domains (TODO: Maybe not do any call at all if the internet domain isn't valid?)
            {
                string userName = GetUserNameForHeader(HttpContext.Current.User.Identity.Name);
                string headerAttributeName = GetHeaderAttributeName();

                req.Headers.Add(headerAttributeName, userName);
            }
        }

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

    private bool IsAuthorizedInternetDomain(string url)
    {
        string confSetting = ConfigurationManager.AppSettings["authorizedInternetDomains"] == null ? "" : ConfigurationManager.AppSettings["authorizedInternetDomains"];
        List<string> authorizedInternetDomains = new List<string>(confSetting.Split(','));
        Uri uriUrl = new Uri(url);

        return authorizedInternetDomains.Contains(uriUrl.Authority);
    }

    private string GetUserNameForHeader(string userName)
    {
        int removeDomainFromUserName = ConfigurationManager.AppSettings["removeDomainNameFromUser"] == null ? 0 : int.Parse(ConfigurationManager.AppSettings["removeDomainNameFromUser"]);
        if (removeDomainFromUserName == 1)
        {
            int n = userName.IndexOf("\\");
            userName = userName.Substring(n < 0 ? 0 : n + 1);
        }
        return userName;
    }

    private string GetHeaderAttributeName()
    {
        string headerAttributeName = ConfigurationManager.AppSettings["headerAttributeName"];
        if (headerAttributeName == null)
            headerAttributeName = "X-Control-Header";
        return headerAttributeName;
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
