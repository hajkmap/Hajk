const fetchConfig = {
  credentials: "same-origin"
};

class InformativeModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.url = settings.app.config.appConfig.proxy + settings.url;
    this.globalObserver = settings.app.globalObserver;
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
    layers
      .filter(
        layer =>
          layer.getProperties()["layerInfo"] &&
          layer.getProperties()["layerInfo"]["layerType"] !== "base"
      )
      .forEach(layer => {
        if (
          visibleLayers.some(
            visibleLayer => visibleLayer === layer.getProperties()["name"]
          )
        ) {
          if (layer.layerType === "group") {
            this.globalObserver.publish("showLayer", layer);
          } else {
            layer.setVisible(true);
          }
        } else {
          if (layer.layerType === "group") {
            this.globalObserver.publish("hideLayer", layer);
          } else {
            layer.setVisible(false);
          }
        }
      });

    this.flyTo(this.olMap.getView(), mapSettings.center, mapSettings.zoom);
  }

  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setParentChapter(child, chapter);
      });
    }
  }

  load(callback) {
    fetch(this.url, fetchConfig).then(response => {
      response.json().then(data => {
        data.chapters.forEach(chapter => {
          this.setParentChapter(chapter, undefined);
        });
        callback(data.chapters);
        this.chapters = data.chapters;
      });
    });
  }
}

export default InformativeModel;
