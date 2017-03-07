using System;
using System.Linq;
using System.Data;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Web.Hosting;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;

using MapService.Models;
using MapService.Models.Config;
using MapService.Models.ToolOptions;

namespace MapService.DataAccess
{      
    [Table("Bookmark")]
    class DataBookmark
    {
        [Key]
        [DatabaseGenerated(System.ComponentModel.DataAnnotations.Schema.DatabaseGeneratedOption.Identity)]        
        public int Id { get; set; }

        /// <summary>
        /// Is the bookmark favourite
        /// </summary>                    
        public bool Favourite { get; set; }

        /// <summary>
        /// User who owns the bookmark
        /// </summary>
        [Required(ErrorMessage="Username is required")]        
        public string Username { get; set; }
            
        /// <summary>
        /// Name of the bookmark
        /// </summary>
        [Required(ErrorMessage = "Name is required")]        
        public string Name { get; set; }
            
        /// <summary>
        /// Blob of settings.
        /// </summary>
        [Required(ErrorMessage = "Settings is required")]        
        [MaxLength]
        public string Settings { get; set; }
    }

    sealed class SettingsDbContext : DbContext
    {
        //private string mapFile = "map_1.json";
        private string layerFile = "layers.json";
        /// <summary>
        /// Read layer config from JSON-file
        /// </summary>
        /// <returns></returns>
        private LayerConfig readLayerConfigFromFile()
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
            string jsonInput = System.IO.File.ReadAllText(file);
            return JsonConvert.DeserializeObject<LayerConfig>(jsonInput);
        }

        /// <summary>
        /// Read config from JSON-file
        /// </summary>
        /// <returns></returns>
        private MapConfig readMapConfigFromFile(string mapFile)
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, mapFile);
            string jsonInput = System.IO.File.ReadAllText(file);
            return JsonConvert.DeserializeObject<MapConfig>(jsonInput);
        }

        /// <summary>
        /// Save config as JSON-file
        /// </summary>
        /// <param name="mapConfig"></param>
        private void saveMapConfigToFile(MapConfig mapConfig, string mapFile)
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, mapFile);
            string jsonOutput = JsonConvert.SerializeObject(mapConfig, Formatting.Indented);
            System.IO.File.WriteAllText(file, jsonOutput);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layerConfig"></param>
        private void saveLayerConfigToFile(LayerConfig layerConfig) 
        {
            string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
            string jsonOutput = JsonConvert.SerializeObject(layerConfig, Formatting.Indented);
            System.IO.File.WriteAllText(file, jsonOutput);
        }
            
        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        /// <param name="groups"></param>
        private void removeLayer(string id, List<LayerGroup> groups)
        {
            groups.ForEach(group => {                    
                MapWMSLayerInfo layer = group.layers.FirstOrDefault(l => l.id == id);
                if (layer != null)
                {
                    group.layers.Remove(layer);                        
                }
                else
                {
                    if (group.groups != null)
                    {
                        this.removeLayer(id, group.groups);
                    }
                }
            });                
        }
            
        /// <summary>
        /// Remove baselayer
        /// </summary>
        /// <param name="id"></param>
        /// <param name="layers"></param>
        private void removeLayer(string id, List<string> layers)
        {                
            var layer = layers.FirstOrDefault(l => l == id);
            if (layer != null)
            {
                layers.Remove(layer);
            }
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

        private int highest(string id, int high)
        {
            int i = 0;
            int.TryParse(id, out i);
            if (i > high)
            {
                high = i;
            }
            return high;
        }

        public int GenerateLayerId(LayerConfig layerConfig)
        {
            int high = 0;

            var a = layerConfig.arcgislayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var b = layerConfig.wfslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var c = layerConfig.wfstlayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var d = layerConfig.wmslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var e = layerConfig.wmtslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var f = layerConfig.vectorlayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();

            if (a != null) high = this.highest(a.id, high);
            if (b != null) high = this.highest(b.id, high);
            if (c != null) high = this.highest(c.id, high);
            if (d != null) high = this.highest(d.id, high);
            if (e != null) high = this.highest(e.id, high);
            if (f != null) high = this.highest(f.id, high);

            return high + 1;
        }

        /// <summary>
        /// Add wms layer
        /// </summary>
        /// <param name="layer"></param>
        public void AddWMSLayer(WMSConfig layer) 
        {            
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            layerConfig.wmslayers.Add(layer);  
            this.saveLayerConfigToFile(layerConfig);              
        }

        /// <summary>
        /// Add wmts layer
        /// </summary>
        /// <param name="layer"></param>
        public void AddWMTSLayer(WMTSConfig layer)
        {            
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            if (layerConfig.wmtslayers == null)
            {
                layerConfig.wmtslayers = new List<WMTSConfig>();
            }
            layerConfig.wmtslayers.Add(layer);

            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Add arcgis layer
        /// </summary>
        /// <param name="layer"></param>
        public void AddArcGISLayer(ArcGISConfig layer)
        {            
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            if (layerConfig.arcgislayers == null)
            {
                layerConfig.arcgislayers = new List<ArcGISConfig>();
            }
            layerConfig.arcgislayers.Add(layer);

            this.saveLayerConfigToFile(layerConfig);
        }

        public void RemoveArcGISLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.arcgislayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.arcgislayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        public void UpdateArcGISLayer(ArcGISConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
                var index = layerConfig.arcgislayers.FindIndex(item => item.id == layer.id);
                if (index != -1)
                {
                    layerConfig.arcgislayers[index] = layer;
                }
                this.saveLayerConfigToFile(layerConfig);
            }

            /// <summary>
            /// Update WMS-layer with new config-options.
            /// </summary>
            /// <param name="layer"></param>
            public void UpdateWMSLayer(WMSConfig layer)
            {                
                LayerConfig layerConfig = this.readLayerConfigFromFile();
                var index = layerConfig.wmslayers.FindIndex(item => item.id == layer.id);
                if (index != -1)
                {
                    layerConfig.wmslayers[index] = layer;
                }
                this.saveLayerConfigToFile(layerConfig);
            }

            /// <summary>
            /// Update WMS-layer with new config-options.
            /// </summary>
            /// <param name="layer"></param>
            public void UpdateWMTSLayer(WMTSConfig layer)
            {
                LayerConfig layerConfig = this.readLayerConfigFromFile();
                var index = layerConfig.wmtslayers.FindIndex(item => item.id == layer.id);
                if (index != -1)
                {
                    layerConfig.wmtslayers[index] = layer;
                }
                this.saveLayerConfigToFile(layerConfig);
            }

            private List<string> getMapConfigFiles()
            {            
                string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
                IEnumerable<string> files = Directory.EnumerateFiles(folder);
                List<string> fileList = new List<string>();
                foreach (string file in files)
                {
                    string fileName = Path.GetFileName(file);
                    if (fileName != "layers.json" && fileName != "data.json")
                    {                        
                        fileList.Add(fileName);
                    }
                }
                return fileList;
            }

        /// <summary>
        /// Removes WMS-layer from config
        /// </summary>
        /// <param name="id"></param>
        private void removeLayerFromConfig(string id)
        {
            List<string> configFiles = this.getMapConfigFiles();
            configFiles.ForEach(mapFile =>
            {
                MapConfig config = readMapConfigFromFile(mapFile);
                var tool = config.tools.Find(t => t.type == "layerswitcher");
                LayerMenuOptions options = JsonConvert.DeserializeObject<LayerMenuOptions>(tool.options.ToString());
                this.removeLayer(id, options.groups);
                this.removeLayer(id, options.baselayers);
                config.tools.Where(t => t.type == "layerswitcher").FirstOrDefault().options = options;
                this.saveMapConfigToFile(config, mapFile);
            });
        }        

        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        public void RemoveWMSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();                
            this.removeLayerFromConfig(id);
            var index = layerConfig.wmslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wmslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        public void RemoveWMTSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wmtslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wmtslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update layer menu
        /// </summary>
        /// <param name="layerMenu"></param>
        public void UpdateLayerMenu(LayerMenuOptions layerMenu, string mapFile)
        {
            MapConfig config = readMapConfigFromFile(mapFile);
            var tool = config.tools.Find(t => t.type == "layerswitcher");
            tool.options = layerMenu;
            this.saveMapConfigToFile(config, mapFile);
        }

        /// <summary>
        /// Update map settings
        /// </summary>
        /// <param name="mapSettings"></param>
        public void UpdateMapSettings(MapSetting mapSettings, string mapFile)
        {
            MapConfig config = readMapConfigFromFile(mapFile);
            config.map = mapSettings;
            this.saveMapConfigToFile(config, mapFile);
        }

        /// <summary>
        /// Update map settings
        /// </summary>
        /// <param name="mapSettings"></param>
        public void UpdateToolSettings(List<Tool> toolSettings, string mapFile)
        {            
            MapConfig config = readMapConfigFromFile(mapFile);
            config.tools = toolSettings;                        
            this.saveMapConfigToFile(config, mapFile);
        }

        /// <summary>
        /// Remove WFS-layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveWFSLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wfslayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wfslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WFS-layer
        /// </summary>
        /// <param name="layer"></param>
        internal void UpdateWFSLayer(WFSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wfslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wfslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWFSLayer(WFSConfig layer)
        {            
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            layerConfig.wfslayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig); ;
        }

        /// <summary>
        /// Remove WFS-layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveWFSTLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.wfstlayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.wfstlayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update WFS-layer
        /// </summary>
        /// <param name="layer"></param>
        internal void UpdateWFSTLayer(WFSTConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wfstlayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wfstlayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWFSTLayer(WFSTConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            layerConfig.wfstlayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig);
        }        

        /// <summary>
        /// Add vector layer to config.
        /// </summary>
        /// <param name="vectorConfig"></param>
        internal void AddVectorLayer(VectorConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            if (layerConfig.vectorlayers == null)
            {
                layerConfig.vectorlayers = new List<VectorConfig>();
            }
            layerConfig.vectorlayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Remove vector layer from config.
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveVectorLayer(string id)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(id);
            var index = layerConfig.vectorlayers.FindIndex(item => item.id == id);
            if (index != -1)
            {
                layerConfig.vectorlayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Update vector layer in config.
        /// </summary>
        /// <param name="vectorConfig"></param>
        internal void UpdateVectorLayer(VectorConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.vectorlayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.vectorlayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="groups"></param>
        /// <param name="oldLayerId"></param>
        /// <param name="newLayerId"></param>
        internal void findAndUpdateLayerInGroup(List<LayerGroup> groups, string oldLayerId, string newLayerId)
        {
            bool found = false;
            groups.ForEach(group =>
            {
                MapWMSLayerInfo layer = group.layers.Find(l => l.id == oldLayerId);
                if (layer != null)
                {
                    layer.id = newLayerId;
                    found = true;
                }
                if (group.groups == null)
                {
                    group.groups = new List<LayerGroup>();
                }
                if (!found && group.groups.Count > 0)
                {
                    this.findAndUpdateLayerInGroup(group.groups, oldLayerId, newLayerId);
                }             
            });            
        }

        /// <summary>
        /// Re index the layers in the application.        
        /// </summary>
        internal void IndexLayerMenu(string mapFile)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            MapConfig mapConfig = this.readMapConfigFromFile(mapFile);

            Tool layerSwitcher = mapConfig.tools.Find(a => a.type == "layerswitcher");
            LayerMenuOptions options = JsonConvert.DeserializeObject<LayerMenuOptions>(layerSwitcher.options.ToString());

            List<ILayerConfig> layers = new List<ILayerConfig>();           
            layerConfig.arcgislayers.ForEach((layer) => layers.Add(layer));
            layerConfig.wfstlayers.ForEach((layer) => layers.Add(layer));
            layerConfig.wmslayers.ForEach((layer) => layers.Add(layer));
            layerConfig.wmtslayers.ForEach((layer) => layers.Add(layer));

            int newLayerId = 0;
            layers.ForEach(layer =>
            {
                string oldLayerId = layer.id;   
                
                for (int i = 0; i < options.baselayers.Count; i++)
                {
                    if (options.baselayers[i] == oldLayerId)
                    { 
                        options.baselayers[i] = newLayerId.ToString();
                    }
                }    

                this.findAndUpdateLayerInGroup(options.groups, oldLayerId, newLayerId.ToString());                                
                layer.id = newLayerId.ToString();
                newLayerId += 1;
            });

            layerSwitcher.options = options;            
            mapConfig.tools[mapConfig.tools.IndexOf(layerSwitcher)] = layerSwitcher;

            this.saveLayerConfigToFile(layerConfig);
            this.saveMapConfigToFile(mapConfig, mapFile);
        }
    }
}