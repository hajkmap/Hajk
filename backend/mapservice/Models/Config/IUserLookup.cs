using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapService.Models.Config
{
    interface IUserLookup
    {
        string [] GetGroups(string user);
        string GetActiveUser();
    }
}
