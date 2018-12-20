using System;
using System.Linq;
using System.Data;
using System.Data.Entity;
using System.Web.Hosting;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using log4net;

using MapService.Models;
using MapService.Models.Config;
using MapService.Models.ToolOptions;

namespace MapService.DataAccess
{      
    sealed class SettingsDbContext : DbContext
    {
        //private string mapFile = "map_1.json";
        private string layerFile = "layers.json";

        ILog _log = LogManager.GetLogger(typeof(SettingsDbContext));
        /// <summary>
        /// Read layer config from JSON-file
        /// </summary>
        /// <returns></returns>
        private LayerConfig readLayerConfigFromFile()
        {
            try
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
                _log.DebugFormat("readLayerConfigFromFile: Reading config from file: {0}", file);
                string jsonInput = System.IO.File.ReadAllText(file);
                var config = JsonConvert.DeserializeObject<LayerConfig>(jsonInput);
                //New wms config
                if (config != null && config.extendedwmslayers == null)
                    config.extendedwmslayers = new List<ExtendedWmsConfig>();
                return config;

            }
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in readLayerConfigFromFile: {0}", e.Message);
                throw e;
            }
        }

        /// <summary>
        /// Read config from JSON-file
        /// </summary>
        /// <returns></returns>
        private MapConfig readMapConfigFromFile(string mapFile)
        {
            try
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, mapFile);
                _log.DebugFormat("readMapConfigFromFile: Reading config from file: {0}", file);
                string jsonInput = System.IO.File.ReadAllText(file);
                return JsonConvert.DeserializeObject<MapConfig>(jsonInput);

            }
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in readMapConfigFromFile: {0}", e.Message);
                throw e;
            }
        }

        /// <summary>
        /// Save config as JSON-file
        /// </summary>
        /// <param name="mapConfig"></param>
        private void saveMapConfigToFile(MapConfig mapConfig, string mapFile)
        {
            try
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, mapFile);
                _log.DebugFormat("saveMapConfigToFile: Saving config to file: {0}", file);
                string jsonOutput = JsonConvert.SerializeObject(mapConfig, Formatting.Indented);
                System.IO.File.WriteAllText(file, jsonOutput);
            }
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in saveMapConfigToFile: {0}", e.Message);
                throw e;
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="layerConfig"></param>
        private void saveLayerConfigToFile(LayerConfig layerConfig) 
        {
            try
            {
                string file = String.Format("{0}App_Data\\{1}", HostingEnvironment.ApplicationPhysicalPath, this.layerFile);
                _log.DebugFormat("saveLayerConfigToFile: Saving config to file: {0}", file);
                string jsonOutput = JsonConvert.SerializeObject(layerConfig, Formatting.Indented);
                System.IO.File.WriteAllText(file, jsonOutput);
            }
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in saveLayerConfigToFile: {0}", e.Message);
                throw e;
            }
        }

        /// <summary>
        /// Find all config files in App_Data folder.
        /// </summary>
        /// <returns></returns>
        private List<string> getMapConfigFiles()
        {
            try
            {
                string folder = String.Format("{0}App_Data", HostingEnvironment.ApplicationPhysicalPath);
                IEnumerable<string> files = Directory.EnumerateFiles(folder, "*.json");
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
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in getMapConfigFiles: {0}", e.Message);
                throw e;
            }
        }

        /// <summary>
        /// Removes WMS-layer from config
        /// </summary>
        /// <param name="id"></param>
        private void removeLayerFromConfig(string id)
        {
            try
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
            catch (Exception e)
            {
                _log.ErrorFormat("Exception in removeLayerFromConfig: {0}", e.Message);
                throw e;
            }
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
        private void removeLayer(string id, List<MapWMSLayerInfo> layers)
        {                
            var layer = layers.FirstOrDefault(l => l.id == id);
            if (layer != null)
            {
                layers.Remove(layer);
            }
        }

        /// <summary>
        /// Find layer with highest unique id.
        /// </summary>
        /// <param name="id"></param>
        /// <param name="high"></param>
        /// <returns></returns>
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

        /// <summary>
        /// Create unique id for new layer.
        /// </summary>
        /// <param name="layerConfig"></param>
        /// <returns></returns>
        internal int GenerateLayerId(LayerConfig layerConfig)
        {
            int high = 0;

            var a = layerConfig.arcgislayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var b = layerConfig.wfslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var c = layerConfig.wfstlayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var d = layerConfig.wmslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var e = layerConfig.wmtslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var f = layerConfig.vectorlayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();
            var g = layerConfig.extendedwmslayers.OrderByDescending(l => int.Parse(l.id)).FirstOrDefault();

            if (a != null) high = this.highest(a.id, high);
            if (b != null) high = this.highest(b.id, high);
            if (c != null) high = this.highest(c.id, high);
            if (d != null) high = this.highest(d.id, high);
            if (e != null) high = this.highest(e.id, high);
            if (f != null) high = this.highest(f.id, high);
            if (g != null) high = this.highest(g.id, high);

            return high + 1;
        }

        /// <summary>
        /// Add wms layer
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWMSLayer(WMSConfig layer) 
        {            
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            layerConfig.wmslayers.Add(layer);  
            this.saveLayerConfigToFile(layerConfig);              
        }

        internal void AddExtendedWMSLayer(ExtendedWmsConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            layer.id = this.GenerateLayerId(layerConfig).ToString();
            layerConfig.extendedwmslayers.Add(layer);
            this.saveLayerConfigToFile(layerConfig);
        }

        internal void UpdateExtendedWMSLayer(ExtendedWmsConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();

            var index = layerConfig.extendedwmslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.extendedwmslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }


        internal void RemoveExtendedWMSLayer(string layerId)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            this.removeLayerFromConfig(layerId);
            var index = layerConfig.extendedwmslayers.FindIndex(item => item.id == layerId);
            if (index != -1)
            {
                layerConfig.extendedwmslayers.RemoveAt(index);
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Add wmts layer
        /// </summary>
        /// <param name="layer"></param>
        internal void AddWMTSLayer(WMTSConfig layer)
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
        internal void AddArcGISLayer(ArcGISConfig layer)
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

        /// <summary>
        /// Remove ArcGIS layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveArcGISLayer(string id)
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

        /// <summary>
        /// Update ArcGIS layer
        /// </summary>
        /// <param name="layer"></param>
        internal void UpdateArcGISLayer(ArcGISConfig layer)
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
        internal void UpdateWMSLayer(WMSConfig layer)
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
        internal void UpdateWMTSLayer(WMTSConfig layer)
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();
            var index = layerConfig.wmtslayers.FindIndex(item => item.id == layer.id);
            if (index != -1)
            {
                layerConfig.wmtslayers[index] = layer;
            }
            this.saveLayerConfigToFile(layerConfig);
        }

        /// <summary>
        /// Remove WMS-layer
        /// </summary>
        /// <param name="id"></param>
        internal void RemoveWMSLayer(string id)
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
        internal void RemoveWMTSLayer(string id)
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
        internal void UpdateLayerMenu(LayerMenuOptions layerMenu, string mapFile)
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
        internal void UpdateMapSettings(MapSetting mapSettings, string mapFile)
        {
            MapConfig config = readMapConfigFromFile(mapFile);
            config.map = mapSettings;
            this.saveMapConfigToFile(config, mapFile);
        }

        /// <summary>
        /// Update map settings
        /// </summary>
        /// <param name="mapSettings"></param>
        internal void UpdateToolSettings(List<Tool> toolSettings, string mapFile)
        {            
            MapConfig config = readMapConfigFromFile(mapFile);
            toolSettings = toolSettings.Where(t => t.type.ToLower() != "layerswitcher").ToList();
            var layerSwitcher = config.tools.Find(t => t.type.ToLower() == "layerswitcher");            
            config.tools = toolSettings;
            if (layerSwitcher != null)
            {
                config.tools.Insert(0, layerSwitcher);
            }
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
        /// Find and update layer in group.
        /// </summary>
        /// <param name="groups"></param>
        /// <param name="oldLayerId"></param>
        /// <param name="newLayerId"></param>
        internal void FindAndUpdateLayerInGroup(List<LayerGroup> groups, string oldLayerId, string newLayerId)
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
                    this.FindAndUpdateLayerInGroup(group.groups, oldLayerId, newLayerId);
                }             
            });            
        }

        /// <summary>
        /// Re index the layers in the application.        
        /// </summary>
        internal void IndexLayerMenu()
        {
            LayerConfig layerConfig = this.readLayerConfigFromFile();

            this.getMapConfigFiles().ForEach(mapFile =>
            {
                layerConfig = this.readLayerConfigFromFile();
                List<ILayerConfig> layers = new List<ILayerConfig>();
                layerConfig.arcgislayers.ForEach((layer) => layers.Add(layer));
                layerConfig.wfstlayers.ForEach((layer) => layers.Add(layer));
                layerConfig.wmslayers.ForEach((layer) => layers.Add(layer));
                layerConfig.wmtslayers.ForEach((layer) => layers.Add(layer));
                layerConfig.vectorlayers.ForEach((layer) => layers.Add(layer));

                MapConfig mapConfig = this.readMapConfigFromFile(mapFile);
                Tool layerSwitcher = mapConfig.tools.Find(a => a.type == "layerswitcher");
                LayerMenuOptions options = JsonConvert.DeserializeObject<LayerMenuOptions>(layerSwitcher.options.ToString());
                
                int newLayerId = 0;
                layers.ForEach(layer =>
                {
                    string oldLayerId = layer.id;

                    for (int i = 0; i < options.baselayers.Count; i++)
                    {
                        if (options.baselayers[i].id == oldLayerId)
                        {
                            options.baselayers[i].id = newLayerId.ToString();
                        }
                    }

                    this.FindAndUpdateLayerInGroup(options.groups, oldLayerId, newLayerId.ToString());
                    layer.id = newLayerId.ToString();
                    newLayerId += 1;
                });                
                
                layerSwitcher.options = options;
                mapConfig.tools[mapConfig.tools.IndexOf(layerSwitcher)] = layerSwitcher;
                this.saveMapConfigToFile(mapConfig, mapFile);
            });

            this.saveLayerConfigToFile(layerConfig);
        }
    }
}