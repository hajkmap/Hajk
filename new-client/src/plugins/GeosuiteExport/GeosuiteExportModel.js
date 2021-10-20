import Draw from "ol/interaction/Draw";
import DoubleClickZoom from "ol/interaction/DoubleClickZoom";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { within } from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";
import { WFS } from "ol/format";

class GeosuiteExportModel {
  config = {
    boreholes: {
      wfsUrl: "https://opengeodata.goteborg.se/services/borrhal-v2/wfs",
      geometryName: "geom", // Get from DescribeFeatureType? Config?
      featurePrefixName: "borrhal-v2",
      featureName: "borrhal",
      attributes: {
        external_id: "externt_id",
        external_project_id: "externt_projekt_id",
        //all_documents_url: "handlingar_url", // TODO: SBK-38: not yet defined if we get this attribute in the same WFS from SBK
      },
      maxFeatures: 100, // TODO: REMOVE
    },
    projects: {
      wfsUrl: "https://services.sbk.goteborg.se/geoteknik-v2-utv/wfs",
      geometryName: "geom",
      featurePrefixName: "borrhal-v2-utv",
      featureName: "geoteknisk_utredning",
      attributes: {
        project_name: "projektnamn",
        all_documents_url: "url", // TODO: SBK-38: not yet defined if we get this attribute in the borehole WFS from SBK
      },
      maxFeatures: 25, // TODO: REMOVE
    },
    trimble: {
      apiUrl: "https://geoarkiv-api.goteborg.se/test", // TODO: PROD
      projectDetailsMethod: "/investigation",
    },
  };

  selection = {
    boreHoleIds: [], // Member: String(Trimble project id)
    projects: {}, // Key: ProjectId, Value: Project. TODO: class Project? { id, name, numBoreHolesSelected, numBoreHolesTotal, allDocumentsUrl }
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
      geom = features[0].getGeometry();
    }
    return geom;
  };

  /*Methods for fetching and updating borehole/project information*/

  updateBoreholeSelection = (selectionGeometry) => {
    this.#updateSelectionStateFromWfs(
      this.config.boreholes,
      selectionGeometry,
      this.#selectBoreHole,
      this.#updateSelectedProjectsDetailsFromTrimbleApi
    );
  };

  updateProjectsSelection = (selectionGeometry) => {
    this.#updateSelectionStateFromWfs(
      this.config.projects,
      selectionGeometry,
      this.#selectProject
    );
  };

  /**
   * Clear borehole and project selection state.
   */
  clearSelection = () => {
    console.log("GeosuiteExportModel: clearSelection");
    this.#clearSelectionState();
    this.source.clear();
  };

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

  // Work in progress, re-use search model
  #updateSelectionStateFromWfs = (
    wfsConfig,
    selectionGeometry,
    featureSelectCallback,
    postFeatureSelectionCallback
  ) => {
    console.log(
      "#updateSelectionStateFromWfs: Calling WFS GetFeature using spatial WITHIN filter from user selection geometry:",
      selectionGeometry
    );
    if (!selectionGeometry) {
      return;
    }

    const srsName = this.map.getView().getProjection().getCode();

    // TODO: Replace code-duplication with shared model with search (SearchModel) before PR is created.
    const spatialFilter = within(
      wfsConfig.geometryName,
      selectionGeometry,
      srsName
    );

    const wfsGetFeatureOtions = {
      srsName: srsName,
      featureNS: "", // Must be blank for IE GML parsing
      featurePrefix: wfsConfig.featurePrefixName,
      featureTypes: [wfsConfig.featureName],
      outputFormat: "application/json",
      geometryName: wfsConfig.geometryName,
      filter: spatialFilter,
      maxFeatures: wfsConfig.maxFeatures,
    };

    const wfsBoreholesBodyXml = new XMLSerializer().serializeToString(
      this.wfsParser.writeGetFeature(wfsGetFeatureOtions)
    );
    const controller = new AbortController();
    const signal = controller.signal;

    const wfsBoreholesRequest = {
      credentials: "same-origin",
      signal: signal,
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: wfsBoreholesBodyXml,
    };
    console.log(
      "#updateSelectionStateFromWfs: Calling boreholes WFS GetFeature using body:",
      wfsBoreholesRequest.body
    );
    hfetch(wfsConfig.wfsUrl, wfsBoreholesRequest)
      .then((response) => {
        if (!response.ok) {
          console.log("#updateSelectionStateFromWfs: WFS query rejected");
          throw new TypeError("Rejected"); // E.g. CORS error or similar
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // TODO: REMOVE:
          response.text().then((body) => {
            console.log(
              "#updateSelectionStateFromWfs: response is not JSON:",
              body
            );
          });
          throw new TypeError("Response is not JSON"); // E.g. server error or OGC XML for WFS exceptions
        }
        return response.json();
      })
      .then((featureCollection) => {
        console.log(
          "#updateSelectionStateFromWfs: WFS response fetched:",
          featureCollection
        );
        console.log(
          "#updateSelectionStateFromWfs: got %d features of matched %d (out of total %d)",
          featureCollection.numberReturned,
          featureCollection.numberMatched,
          featureCollection.totalFeatures
        );
        if (featureCollection.numberReturned > 0) {
          featureCollection.features.forEach((feature) => {
            featureSelectCallback(feature);
          });
        }
        if (postFeatureSelectionCallback) {
          postFeatureSelectionCallback();
        }
      })
      .catch((error) => {
        //TODO: Error handling
        console.log("#updateSelectionStateFromWfs: WFS error", error);
      });
  };

  // Feature selection callback for updating state with project details,
  // given a WFS project feature
  #selectProject = (feature) => {
    console.log("#selectProject", feature);
    const props = feature.properties;
    const projectId = feature.id;
    const projectName = props[this.config.projects.attributes.project_name];

    if (!projectId || !projectName) {
      console.log(
        "#selectProject: WFS is missing feature id or project name attribute (%s)",
        this.config.projects.attributes.project_name
      );
      throw new TypeError("Internt fel, identiteter saknas.");
    }
    const project = this.#getProjectById(projectId);
    project.name = projectName;
    if (this.config.projects.attributes.all_documents_url) {
      const allDocumentsUrl =
        props[this.config.projects.attributes.all_documents_url];
      project.allDocumentsUrl = allDocumentsUrl;
    }
  };

  // Feature selection callback for updating state with borehole and project details,
  // given a WFS borehole feature
  #selectBoreHole = (feature) => {
    console.log("#selectBoreHole", feature);
    const props = feature.properties;
    const boreHoleId = props[this.config.boreholes.attributes.external_id];
    const projectId =
      props[this.config.boreholes.attributes.external_project_id];

    if (!boreHoleId || !projectId) {
      console.log(
        "#selectBoreHole: WFS is missing id (%s) or project id attribute (%s)",
        this.config.boreholes.attributes.external_id,
        this.config.boreholes.attributes.external_project_id
      );
      throw new TypeError("Internt fel, identiteter saknas.");
    }
    if (!this.selection.boreHoleIds.includes(boreHoleId)) {
      this.selection.boreHoleIds.push(boreHoleId);
    }
    const project = this.#getProjectById(projectId);
    project.numBoreHolesSelected++;
    if (this.config.boreholes.attributes.all_documents_url) {
      const allDocumentsUrl =
        props[this.config.boreholes.attributes.all_documents_url];
      project.allDocumentsUrl = allDocumentsUrl;
    }
  };

  #updateProjectDetails = (projectDetails) => {
    const projectId = projectDetails.investigationId;
    const projectName = projectDetails.name;
    const projectNumBoreHolesTotal = projectDetails.numberOfPoints;
    console.log(
      "#updateProjectDetails - project %s: name=%s, total boreholes=%s",
      projectId,
      projectName,
      projectNumBoreHolesTotal
    );
    const project = this.#getProjectById(projectId);
    project.name = projectName;
    project.numBoreHolesTotal = projectNumBoreHolesTotal;
  };

  #updateSelectedProjectsDetailsFromTrimbleApi = () => {
    console.log("#updateSelectedProjectsDetailsFromTrimbleApi");
    const controller = new AbortController();
    const signal = controller.signal;

    const projectIds = Object.keys(this.selection.projects).filter(
      (projectId) => {
        // Optimized Trimble API usage: only fetch if we don't have the project details
        const project = this.#getProjectById(projectId);
        return !project || !project.numBoreHolesTotal;
      }
    );

    /*
    Create all of the requests we need to make the the Trimble API as an array of promises.
    We only want to update the projects data if all the requests are successful. 
    */
    const requests = projectIds.map((projectId) => {
      const apiUrl = this.config.trimble.apiUrl.concat(
        this.config.trimble.projectDetailsMethod,
        "/",
        projectId
      );
      const apiRequestOptions = {
        credentials: "same-origin",
        signal: signal,
        method: "GET",
      };

      const promise = new Promise((resolve, reject) => {
        hfetch(apiUrl, apiRequestOptions)
          .then((response) => {
            if (!response.ok) {
              reject("Trimble response not ok.");
              console.log(response);
            }
            resolve(response);
          })
          .catch((error) => reject(error));
      });
      return promise;
    });

    /*
    If all of our Trimble requests are successful, get the json, update the projects data and inform the view.
    If something is wrong with one of our requests, inform the view that updating the project has failed.
    */
    Promise.all(requests)
      .then((responses) => {
        const jsonData = responses.map((res) => {
          return res.json();
        });
        /*
        Perhaps a little over the top, but we want to know that all of our response can be resolved to json
        before we make any updates to the project data. 
        */
        Promise.all(jsonData)
          .then((investigationDetails) => {
            investigationDetails.forEach((investigationDetail) => {
              this.#updateProjectDetails(investigationDetail);
            });
            this.localObserver.publish("borehole-selection-updated");
          })
          .catch((error) => {
            this.localObserver.publish("borehole-selection-failed");
          });
      })
      .catch((error) => {
        this.localObserver.publish("borehole-selection-failed");
      });
  };

  #getProjectById = (projectId) => {
    let project = undefined;
    if (this.selection.projects[projectId]) {
      project = { ...this.selection.projects[projectId] };
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

  #clearSelectionState = () => {
    this.selection.boreHoleIds.length = 0;
    delete this.selection.projects; // GC
    this.selection.projects = {};
  };
}

export default GeosuiteExportModel;
