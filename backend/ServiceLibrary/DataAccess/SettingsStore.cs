using System;
using System.Linq;
using System.Data;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using System.ComponentModel.DataAnnotations.Schema;
using Sweco.Services.DataContracts;
using System.Web.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Sweco.Services.DataAccess
{      
    [Table("Bookmark")]
    class DataBookmark
    {
        [Key]
        [DatabaseGenerated(System.ComponentModel.DataAnnotations.Schema.DatabaseGeneratedOption.Identity)]
        [DataMember]
        public int Id { get; set; }

        /// <summary>
        /// Is the bookmark favourite
        /// </summary>            
        [DataMember(Name = "favourite")]
        public bool Favourite { get; set; }

        /// <summary>
        /// User who owns the bookmark
        /// </summary>
        [Required(ErrorMessage="Username is required")]
        [DataMember(Name = "username")]
        public string Username { get; set; }
            
        /// <summary>
        /// Name of the bookmark
        /// </summary>
        [Required(ErrorMessage = "Name is required")]
        [DataMember(Name = "name")]
        public string Name { get; set; }
            
        /// <summary>
        /// Blob of settings.
        /// </summary>
        [Required(ErrorMessage = "Settings is required")]
        [DataMember(Name = "settings")]
        [MaxLength]
        public string Settings { get; set; }
    }

    sealed class SettingsDbContext : DbContext
        {
            private string layerFile = "layers.json";
            /// <summary>
            /// 
            /// </summary>
            /// <returns></returns>
            private LayerConfig readLayerConfigFromFile()
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
                string jsonInput = System.IO.File.ReadAllText(file);
                return JsonConvert.DeserializeObject<LayerConfig>(jsonInput);
            }

            /// <summary>
            /// 
            /// </summary>
            /// <param name="layerConfig"></param>
            private void saveLayerConfigToFile(LayerConfig layerConfig) 
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
                string jsonOutput = JsonConvert.SerializeObject(layerConfig);
                System.IO.File.WriteAllText(file, jsonOutput);
            }

            /// <summary>
            /// Property bookmarks.
            /// </summary>
            public DbSet<DataBookmark> Bookmarks { get { return Set<DataBookmark>(); } }            

            /// <summary>
            /// Constructor
            /// </summary>
            public SettingsDbContext() 
                : base("SettingsDatabase")
            {
            }

            /// <summary>
            /// Get bookmars for users by username.
            /// </summary>
            /// <param name="username"></param>
            /// <returns></returns>
            public Bookmark[] GetBookmarks(string username)
            {
                DataBookmark[] dataBookmarks = this.Bookmarks.Where(b => b.Username == username).ToArray();                
                var bookmarks = dataBookmarks.Select(bookmark => {
                    return new Bookmark()
                    {
                        id = bookmark.Id,
                        name = bookmark.Name,
                        username = bookmark.Username,
                        settings = bookmark.Settings,
                        favourite = bookmark.Favourite
                    };
                });
                return bookmarks.OrderBy(a => a.name).ToArray();
            }

            /// <summary>
            /// Add new bookmark.
            /// </summary>
            /// <param name="bookmark"></param>
            public void SaveBookmark(Bookmark bookmark) 
            {
                DataBookmark dataBookmark = new DataBookmark() {
                    Id = bookmark.id,
                    Name = bookmark.name,
                    Username = bookmark.username,
                    Settings = bookmark.settings,
                    Favourite = bookmark.favourite
                };
                this.Bookmarks.Add(dataBookmark);
                this.SaveChanges();
            }

            /// <summary>
            /// Update existing bookmark by ID.
            /// </summary>
            /// <param name="id"></param>
            /// <param name="bookmark"></param>
            public void UpdateBookmark(Bookmark bookmark)
            {
                var userBookmarks = this.Bookmarks.Where(b => b.Username == bookmark.username);
                foreach (var b in userBookmarks)
                {
                    b.Favourite = false;
                }
                
                DataBookmark dataBookmark = this.Bookmarks.Where(b => b.Id == bookmark.id).FirstOrDefault();

                if (bookmark != null)
                {
                    dataBookmark.Favourite = bookmark.favourite;                 
                    dataBookmark.Id = bookmark.id;                    
                    dataBookmark.Name = bookmark.name;
                    dataBookmark.Settings = bookmark.settings;
                    dataBookmark.Username = bookmark.username;
                    this.SaveChanges();
                }
            }

            /// <summary>
            /// Remove existing bookmark by ID.
            /// </summary>
            /// <param name="id"></param>
            public void RemoveBookmark(int id) 
            {                
                DataBookmark bookmark = this.Bookmarks.Where(b => b.Id == id).FirstOrDefault();
                if (bookmark != null) {
                    this.Bookmarks.Remove(bookmark);
                    this.SaveChanges();
                }
            }
       
            /// <summary>
            /// 
            /// </summary>
            /// <param name="layer"></param>
            public void AddWMSLayer(WMSConfig layer) 
            {                                
                LayerConfig layerConfig = this.readLayerConfigFromFile();
                layerConfig.layers.Add(layer);  
                this.saveLayerConfigToFile(layerConfig);              
            }

            /// <summary>
            /// 
            /// </summary>
            /// <param name="layer"></param>
            public void UpdateWMSLayer(WMSConfig layer)
            {                
                LayerConfig layerConfig = this.readLayerConfigFromFile();
                var index = layerConfig.layers.FindIndex(item => item.id == layer.id);
                if (index != -1)
                {
                    layerConfig.layers[index] = layer;
                }
                this.saveLayerConfigToFile(layerConfig);
            }
            
            /// <summary>
            /// 
            /// </summary>
            /// <param name="id"></param>
            public void RemoveWMSLayer(string id)
            {
                LayerConfig layerConfig = this.readLayerConfigFromFile();
                var index = layerConfig.layers.FindIndex(item => item.id == id);
                if (index != -1) 
                {
                    layerConfig.layers.RemoveAt(index);
                }
                this.saveLayerConfigToFile(layerConfig);
            }
    }
}