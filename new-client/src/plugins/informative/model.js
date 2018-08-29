const url = "http://localhost:55630/informative/load/op";

class InformativeModel {
  constructor(settings) {
    this.olMap = settings.map;    
  }
  
  flyTo(view, location, zoom) {    
    const duration = 1500;      
    view.animate({
      zoom: zoom,
      center: location,
      duration: duration
    });
  }

  displayMap(visibleLayers, mapSettings) {    
    var layers = this.olMap.getLayers().getArray();    
    layers.filter(
      layer => 
        layer.getProperties()["layerInfo"] && 
        layer.getProperties()["layerInfo"]["layerType"] !== "base"
    )
    .forEach(
      layer => {
        if (visibleLayers.some(visibleLayer => 
          visibleLayer === layer.getProperties()["name"])) {
          layer.setVisible(true);
        } else {
          layer.setVisible(false);
      }
    });    
    
    this.flyTo(this.olMap.getView(), mapSettings.center, mapSettings.zoom);
  }

  load(callback) {
    fetch(url).then(response => {
      response.json().then(data => {        
        callback(data.chapters);
      });
    });
  }
}

export default InformativeModel;
