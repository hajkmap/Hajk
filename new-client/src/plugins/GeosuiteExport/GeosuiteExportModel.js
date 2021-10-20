import Draw from "ol/interaction/Draw";
import DoubleClickZoom from "ol/interaction/DoubleClickZoom";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { within } from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";
import { WFS } from "ol/format";

class GeosuiteExportModel {
  selection = {
    boreHoleIds: [], // Member: String(Trimble project id)
    projects: {}, // Key: ProjectId, Value: Project. TODO: class Project? id, name, numBoreHolesSelected, numBoreHolesTotal, allDocumentsUrl
  };

  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      name: "geoSuiteDrawLayer",
    });
    this.style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
    });

    this.map.addLayer(this.vector);
    this.draw = null;
    this.doubleClick = this.getMapsDoubleClickInteraction();
    this.wfsParser = new WFS();
  }

  /**** General Model methods ****/

  handleWindowOpen = () => {
    //pass to the view, so we can re-set the view state.
    //TODO - can we just handle what we need to here in the model?
    this.localObserver.publish("window-opened");
  };

  handleWindowClose = () => {
    //pass to the view, so we can re-set the view state.
    this.localObserver.publish("window-closed");
  };

  handleDrawStart = (e) => {
    //When the user starts drawing a feature, remove any existing feature. We only want one shape.
    this.clearMapFeatures();
  };

  handleDrawEnd = (e) => {
    this.removeDrawInteraction();
    this.localObserver.publish("area-selection-complete");
  };

  removeDrawInteraction = () => {
    if (this.draw !== null) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
    this.map.clickLock.delete("geosuiteexport");

    /*
    Add the maps doubleclick zoom interaction back to map when we leave drawing mode (the doubleclick zoom interaction is removed from the map when we enter drawing mode, to avoid a zoom when doubleclicking to finish drawing).
    TODO - do this without a timeout. (timeout because otherwise the map still zooms).
    TODO - is there a better way to cancel the doubleclick zoom without removing and the re-adding the interaction?
    */
    if (this.doubleClick) {
      setTimeout(() => {
        this.map.addInteraction(this.doubleClick);
      }, 200);
    }
  };

  addDrawInteraction = () => {
    this.draw = new Draw({
      source: this.source,
      type: "Polygon",
    });
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);

    //When drawing starts, lock clicks to this tool, otherwise the InfoClick tool will fire on click.
    this.map.clickLock.add("geosuiteexport");

    //Remove the doubleClick interaction from the map. Otherwise when a user double clicks to finish drawing, the map will also zoom in.
    //The doubleClick interation is added back to the map when we end the drawInteraction.
    if (this.doubleClick) {
      this.map.removeInteraction(this.doubleClick);
    }
  };

  clearMapFeatures = () => {
    this.map.removeLayer(this.source.clear());
    this.localObserver.publish("area-selection-removed");
    //the map is cleared so the selection is no longer valid - clear the selection.
    this.#clearSelectionState();
  };

  getMapsDoubleClickInteraction = () => {
    let doubleClick = null;
    this.map
      .getInteractions()
      .getArray()
      .forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          doubleClick = interaction;
        }
      });

    return doubleClick;
  };

  getSelectedGeometry = () => {
    let geom = undefined;
    const features = this.source.getFeatures();
    if (features.length > 0) {
      const featureGeometry = features[0].getGeometry();
      console.log(featureGeometry);
      //return features[0].getGeometry().getArea();
      geom = features[0].getGeometry();
    }
    console.log("getSelectedGeometry: geom: ", geom);
    return geom;
  };

  /**** Anrop till wfs och trimble api - work in progress ****/

  setSelectionStateFromGeometry = (selectionGeometry) => {
    console.log(
      "setSelectionStateFromGeometry: Calling WFS GetFeature using spatial WITHIN filter from user selection geometry:",
      selectionGeometry
    );

    // TODO: SEMARA: FIXME: config/option?
    const wfsUrl = "https://opengeodata.goteborg.se/services/borrhal-v2/wfs";
    const geometryName = "geom"; // Get from DescribeFeatureType? Config?
    const featurePrefixName = "borrhal-v2";
    const featureName = "borrhal";
    const maxFeatures = 100;
    const trimbleApiUrl = "https://geoarkiv-api.goteborg.se/prod";
    const trimbleApiProjectDetails = "/investigation";

    const srsName = this.map.getView().getProjection().getCode();

    // TODO: Replace code-duplication with shared model with search (SearchModel) before PR is created.
    const filter = within(geometryName, selectionGeometry, srsName);

    const wfsGetFeatureOtions = {
      srsName: srsName,
      featureNS: "", // Must be blank for IE GML parsing
      featurePrefix: featurePrefixName,
      featureTypes: [featureName],
      outputFormat: "application/json",
      geometryName: geometryName,
      filter: filter,
      maxFeatures: maxFeatures,
    };

    const wfsBodyXml = new XMLSerializer().serializeToString(
      this.wfsParser.writeGetFeature(wfsGetFeatureOtions)
    );
    const controller = new AbortController();
    const signal = controller.signal;

    const wfsRequest = {
      credentials: "same-origin",
      signal: signal,
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: wfsBodyXml,
    };
    console.log(
      "GeoSuiteExportModel: createWfsRequest: Calling WFS GetFeature using body:",
      wfsRequest.body
    );
    hfetch(wfsUrl, wfsRequest)
      .then((response) => {
        if (!response.ok) {
          console.log(
            "GeoSuiteExportModel: createWfsRequest: WFS query rejected"
          );
          throw new TypeError("Rejected"); // E.g. CORS error or similar
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // TODO: REMOVE:
          response.text().then((body) => {
            console.log(
              "GeoSuiteExportModel: createWfsRequest: response is not JSON:",
              body
            );
          });
          throw new TypeError("Response is not JSON"); // E.g. server error or OGC XML for WFS exceptions
        }
        return response.json();
      })
      .then((featureCollection) => {
        console.log(
          "GeoSuiteExportModel: createWfsRequest: WFS response fetched:",
          featureCollection
        );
        console.log(
          "GeoSuiteExportModel: createWfsRequest: got %d features of matched %d (out of total %d)",
          featureCollection.numberReturned,
          featureCollection.numberMatched,
          featureCollection.totalFeatures
        );
        if (featureCollection.numberReturned > 0) {
          featureCollection.features.forEach((feature) => {
            this.#selectBoreHole(feature);
          });
          // TODO: FIXME!
          this.app.config.appConfig.searchProxy =
            "https://cors-anywhere.herokuapp.com/";
          // Example settle wait: await Promise.allSettled(promises)
          // then: this.localObserver.publish("borehole-selection-updated");
          // ...to trigger view observer signal
          Object.keys(this.selection.projects).forEach((projectId) => {
            const apiUrl = this.app.config.appConfig.searchProxy.concat(
              trimbleApiUrl,
              trimbleApiProjectDetails,
              "/",
              projectId
            );
            const apiRequestOptions = {
              credentials: "same-origin",
              signal: signal,
              method: "GET",
            };
            hfetch(apiUrl, apiRequestOptions)
              .then((response) => {
                if (!response.ok) {
                  console.log(
                    "GeoSuiteExportModel: createWfsRequest: API query rejected"
                  );
                  throw new TypeError("Rejected");
                }
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                  // TODO: REMOVE:
                  response.text().then((body) => {
                    console.log(
                      "GeoSuiteExportModel: createWfsRequest: API response is not JSON:",
                      body
                    );
                  });
                  throw new TypeError("Response is not JSON"); // E.g. server error or OGC XML for WFS exceptions
                }
                return response.json();
              })
              .then((investigationDetail) => {
                this.#updateProjectDetails(investigationDetail);
              })
              .catch((error) => {
                //TODO: Error handling
                console.log(
                  "GeoSuiteExportModel: createWfsRequest: API error",
                  error
                );
              });
          });
        }
      })
      .catch((error) => {
        //TODO: Error handling
        console.log("GeoSuiteExportModel: createWfsRequest: WFS error", error);
      });
  };

  /**** Methods for retrieving data from the model ****/

  /**
   * Returns an array of project detail objects for selected projects.
   * NB! Dependent on previous selection state update call, otherwise returned array will always be empty.
   * @returns array of project detail JSON-objects
   */
  getSelectedProjects = () => {
    const projects = [];
    Object.keys(this.selection.projects).forEach((projectId) => {
      projects.push(this.#getProjectById(projectId));
    });
    return projects;
  };

  #clearSelectionState = () => {
    this.selection.boreHoleIds.length = 0;
    delete this.selection.projects; // GC
    this.selection.projects = {};
  };

  #updateProjectDetails = (projectDetails) => {
    const project = this.#getProjectById(projectDetails.investigationId);
    project.name = projectDetails.name;
    project.numBoreHolesTotal = projectDetails.numberOfPoints;
  };

  #selectBoreHole = (feature) => {
    const props = feature.properties;
    // TODO: config for field names ("externt_id", "externt_projekt_id")
    // NB! "handlingar_url" is not the correct ZIP/PDF link - TO BE CHANGED BY SBK (new version of WFS prel. publish date: 2021-10-18)
    const boreHoleId = props.externt_id;
    const projectId = props.externt_projekt_id;
    const allDocumentsUrl = props.handlingar_url;

    if (!this.selection.boreHoleIds.includes(boreHoleId)) {
      this.selection.boreHoleIds.push(boreHoleId);
    }
    const project = this.#getProjectById(projectId);
    project.numBoreHolesSelected++;
    project.allDocumentsUrl = allDocumentsUrl;
  };

  #getProjectById = (projectId) => {
    let project = undefined;
    if (this.selection.projects[projectId]) {
      project = this.selection.projects[projectId];
    } else {
      project = {
        id: projectId,
        name: "",
        numBoreHolesSelected: 0,
        numBoreHolesTotal: 0,
        allDocumentsUrl: "",
      };
      this.selection.projects[projectId] = project;
    }
    return project;
  };
}

export default GeosuiteExportModel;
