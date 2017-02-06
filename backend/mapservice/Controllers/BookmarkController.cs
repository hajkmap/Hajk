using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Mvc;
using MapService.Models;
using MapService.DataAccess;

namespace MapService.Controllers
{
    public class BookmarkController : ApiController
    {
        private readonly SettingsDbContext settingsDataContext = new SettingsDbContext();

        private string GetUserName()
        {
            var userName = "NOT_AUTH_USER";

            string name = User.Identity.Name;        
            name = name.ToUpper();

            string[] splitted = name.Split('\\');

            // Hämta användarnamnet utan ev. domänprefix.
            if (splitted.Count() == 2)
            {
                userName = splitted[1];
            }
            else if (splitted.Count() == 1)
            {
                userName = splitted[0];
            }                            
            return userName.ToUpper();
        }
        
        public Bookmark[] Get()
        {
            string username = this.GetUserName();
            return this.settingsDataContext.GetBookmarks(username);            
        }
        
        public Bookmark[] Post(Bookmark bookmark)
        {
            string username = this.GetUserName();            
            bookmark.username = username;
            this.settingsDataContext.SaveBookmark(bookmark);
            return this.settingsDataContext.GetBookmarks(username);                             
        }

        public Bookmark[] Delete(string id)
        {
            int uid = int.Parse(id);
            this.settingsDataContext.RemoveBookmark(uid);
            string username = this.GetUserName();
            return this.settingsDataContext.GetBookmarks(username);
        }

        public Bookmark[] Put(Bookmark bookmark)
        {
            this.settingsDataContext.UpdateBookmark(bookmark);
            string username = this.GetUserName();
            return this.settingsDataContext.GetBookmarks(username);
        }
    }
}
