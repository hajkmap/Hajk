import Draw from "ol/interaction/Draw";
import DoubleClickZoom from "ol/interaction/DoubleClickZoom";
import { Fill, Stroke, Style } from "ol/style";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { intersects, within } from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";
import { WFS } from "ol/format";

class GeosuiteExportModel {
  #selection = {
    borehole: {
      boreholeIds: [], // Member: String(Trimble borehole id)
      projects: {}, // Key: ProjectId, Value: JSON-object with Project details:
      // { id<String>, name<String>, boreholeIds<Array[String]>, numBoreHolesSelected<Number>, numBoreHolesTotal<Number> }
    },
    // In a future layer-agnostic extension of this tool the document selection can be keyed by e.g. WFS source key for multi-source capability
    document: {}, // DocumentSelection: key String<id>, value: { title: title<String>, link: String<download url> }
  };
  #map;
  #app;
  #config;
  #options;
  #localObserver;
  #vector;
  #draw;
  #source;
  #style;
  #doubleClick;
  #wfsParser;

  constructor(settings) {
    this.#map = settings.map;
    this.#app = settings.app;
    this.#options = settings.options;
    this.#localObserver = settings.localObserver;

    this.#source = new VectorSource();
    this.#vector = new VectorLayer({
      source: this.#source,
      name: "geoSuiteDrawLayer",
    });
    this.#style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
    });

    // Set WFS configuration from defaults and option overrides, if any
    this.#config = {
      boreholes: {
        url:
          this.#options.services?.wfs?.boreholes?.url ??
          "https://opengeodata.goteborg.se/services/borrhal-v2/wfs",
        featurePrefixName:
          this.#options.services?.wfs?.boreholes?.featurePrefixName ??
          "borrhal-v2",
        featureName:
          this.#options.services?.wfs?.boreholes?.featureName ?? "borrhal",
        srs: this.#options.services?.wfs?.boreholes?.srs ?? "EPSG:3006",
        geometryName:
          this.#options.services?.wfs?.boreholes?.geometryName ?? "geom",
        spatialFilter: this.#getSpatialFilter(
          this.#options.services?.wfs?.boreholes?.spatialFilter
        ),
        attributes: {
          external_id:
            this.#options.services?.wfs?.boreholes?.attributes?.external_id ??
            "externt_id",
          external_project_id:
            this.#options.services?.wfs?.boreholes?.attributes
              ?.external_project_id ?? "externt_projekt_id",
        },
        maxFeatures: this.#options.services?.wfs?.boreholes?.maxFeatures ?? -1,
      },
      projects: {
        url:
          this.#options.services?.wfs?.projects?.url ??
          "https://opengeodata.goteborg.se/services/borrhal-v2/wfs",
        featurePrefixName:
          this.#options.services?.wfs?.projects?.featurePrefixName ??
          "borrhal-v2-utv",
        featureName:
          this.#options.services?.wfs?.projects?.featureName ??
          "geoteknisk_utredning",
        srs: this.#options.services?.wfs?.projects?.srs ?? "EPSG:3006",
        geometryName:
          this.#options.services?.wfs?.projects?.geometryName ?? "geom",
        spatialFilter: this.#getSpatialFilter(
          this.#options.services?.wfs?.projects?.spatialFilter
        ),
        attributes: {
          title:
            this.#options.services?.wfs?.projects?.attributes?.title ??
            "projektnamn",
          link:
            this.#options.services?.wfs?.projects?.attributes?.link ?? "url",
        },
        maxFeatures: this.#options.services?.wfs?.projects?.maxFeatures ?? -1,
      },
    };

    this.#map.addLayer(this.#vector);
    this.#draw = null;
    this.#doubleClick = this.getMapsDoubleClickInteraction();
    this.#wfsParser = new WFS();
  }

  /**** General Model methods ****/

  handleWindowOpen = () => {
    //pass to the view, so we can re-set the view state.
    //TODO - can we just handle what we need to here in the model?
    this.#localObserver.publish("window-opened");
  };

  handleWindowClose = () => {
    //pass to the view, so we can re-set the view state.
    this.#localObserver.publish("window-closed");
  };

  handleDrawStart = (e) => {
    //When the user starts drawing a feature, remove any existing feature. We only want one shape.
    this.clearMapFeatures();
  };

  handleDrawEnd = (e) => {
    this.removeDrawInteraction();
    this.#localObserver.publish("area-selection-complete");
  };

  addDrawInteraction = () => {
    this.#draw = new Draw({
      source: this.#source,
      type: "Polygon",
    });
    this.#draw.on("drawstart", this.handleDrawStart);
    this.#draw.on("drawend", this.handleDrawEnd);
    this.#map.addInteraction(this.#draw);

    //When drawing starts, lock clicks to this tool, otherwise the InfoClick tool will fire on click.
    this.#map.clickLock.add("geosuiteexport");

    //Remove the doubleClick interaction from the map. Otherwise when a user double clicks to finish drawing, the map will also zoom in.
    //The doubleClick interation is added back to the map when we end the drawInteraction.
    if (this.#doubleClick) {
      this.#map.removeInteraction(this.#doubleClick);
    }
  };

  removeDrawInteraction = () => {
    console.log("removeDrawInteraction");
    if (this.#draw !== null) {
      this.#map.removeInteraction(this.#draw);
      this.#draw = null;
    }
    this.#map.clickLock.delete("geosuiteexport");

    /*
    Add the maps doubleclick zoom interaction back to map when we leave drawing mode (the doubleclick zoom interaction is removed from the map when we enter drawing mode, to avoid a zoom when doubleclicking to finish drawing).
    TODO - do this without a timeout. (timeout because otherwise the map still zooms).
    TODO - is there a better way to cancel the doubleclick zoom without removing and the re-adding the interaction?
    */
    if (this.#doubleClick) {
      setTimeout(() => {
        this.#map.addInteraction(this.#doubleClick);
      }, 500);
    }
  };

  clearMapFeatures = () => {
    this.#map.removeLayer(this.#source.clear());
    this.#localObserver.publish("area-selection-removed");
    //the map is cleared so the selection is no longer valid - clear the selection.
    this.#clearSelectionState();
  };

  getMapsDoubleClickInteraction = () => {
    let doubleClick = null;
    this.#map
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
    const features = this.#source.getFeatures();
    if (features.length > 0) {
      geom = features[0].getGeometry();
    }
    return geom;
  };

  /*Methods for GeoSuite-format exports*/

  /**
   * Performs a Trimble API call to export data in GeoSuite Toolbox format and publish result event to local observer.
   * @summary Constructs a promise to call the Trimble API for ordering of an export in GeoSuite Toolbox format.
   * The results will be packaged in DBSX format for each project and finally ZIP-compressed
   * and emailed to the recipient using GeoSuite Cloud (via Trimble's SendGrid implementation).
   * Local observer events: OK: geosuite-export-completed, failure: geosuite-export-failed.
   * @param {*} email recipient e-mail address, the recipient is expected to be a registered GeoSuite Cloud user
   * @param {*} boreholeIds array of strings, where each string represents the external identity of a bore hole to export
   * @param {*} projectIds array of strings, where each string represents the external identity of a full project to export
   */
  orderGeoSuiteExport = (email, boreholeIds, projectIds) => {
    console.log(
      "GeosuiteExportView: orderGeoSuiteExport. email=%s, boreholeIds, projectIds",
      email,
      boreholeIds,
      projectIds
    );
    if (
      !email ||
      ((!boreholeIds || boreholeIds.size === 0) &&
        (!projectIds || projectIds.size === 0))
    ) {
      throw new TypeError(
        "Cannot export without an e-mail address and at least one external identity"
      );
    }
    if (!boreholeIds) {
      boreholeIds = [];
    }
    if (!projectIds) {
      projectIds = [];
    }
    const body = {
      email: email,
      surveypointIds: boreholeIds,
      investigationIds: projectIds,
    };
    const controller = new AbortController();
    const signal = controller.signal;

    this.#trimbleApiFetch(
      signal,
      this.#options?.services?.trimble?.exportMethod ?? "/export",
      "POST",
      body
    )
      .then((response) => {
        if (!response.ok) {
          console.log("orderGeoSuiteExport: API query rejected");
          throw new TypeError("Rejected");
        }
        this.#localObserver.publish("geosuite-export-completed");
      })
      .catch((error) => {
        this.#localObserver.publish("geosuite-export-failed");
      });
  };

  /*Methods for fetching and updating borehole and document information*/

  updateBoreholeSelection = (selectionGeometry) => {
    this.#updateSelectionStateFromWfs(
      this.#config.boreholes,
      selectionGeometry,
      this.#selectBoreHole,
      this.#updateSelectedProjectsDetailsFromTrimbleApi
    );
  };

  updateDocumentSelection = (selectionGeometry) => {
    this.#updateSelectionStateFromWfs(
      this.#config.projects,
      selectionGeometry,
      this.#selectDocument,
      this.#updateDocumentDetails
    );
  };

  /**
   * Clear borehole and project selection state.
   */
  clearSelection = () => {
    console.log("GeosuiteExportModel: clearSelection");
    this.#clearSelectionState();
    this.#source.clear();
  };

  /**
   * @summary Returns an array of project detail objects for selected projects.
   * NB! Dependent on previous selection state update call, otherwise returned array will always be empty.
   * @returns array of project detail JSON-objects
   */
  getSelectedProjects = () => {
    const projects = [];
    Object.keys(this.#selection.borehole.projects).forEach((projectId) => {
      projects.push(this.#getBoreholeProjectById(projectId));
    });
    return projects;
  };

  /**
   * @summary Returns an array of document detail objects for selected documents.
   * NB! Dependent on previous selection state update call, otherwise returned array will always be empty.
   * @returns array of document detail JSON-objects
   */
  getSelectedDocuments = () => {
    const documents = [];
    Object.keys(this.#selection.document).forEach((featureId) => {
      documents.push(this.#getDocumentById(featureId));
    });
    return documents;
  };

  // Work in progress, re-use search model
  #updateSelectionStateFromWfs = (
    wfsConfig,
    selectionGeometry,
    featureSelectCallback,
    postFeatureSelectionCallback
  ) => {
    console.log(
      "#updateSelectionStateFromWfs: Calling WFS GetFeature using spatial filter from user selection geometry:",
      selectionGeometry
    );
    if (!selectionGeometry) {
      return;
    }

    const mapSrs = this.#map.getView().getProjection().getCode();
    const layerSrs = wfsConfig.srs ?? mapSrs;
    let filterGeometry = selectionGeometry;
    if (mapSrs !== layerSrs) {
      console.log(
        "Reprojecting selection geometry from %s to %s",
        mapSrs,
        layerSrs
      );
      filterGeometry = selectionGeometry.clone().transform(mapSrs, layerSrs);
    }

    // TODO: Replace code-duplication with shared model with search (SearchModel) before PR is created.
    const filter = wfsConfig.spatialFilter ?? within;
    const spatialFilter = filter(
      wfsConfig.geometryName,
      filterGeometry,
      layerSrs
    );

    const wfsGetFeatureOtions = {
      srsName: mapSrs,
      featureNS: "", // Must be blank for IE GML parsing
      featurePrefix: wfsConfig.featurePrefixName,
      featureTypes: [wfsConfig.featureName],
      outputFormat: "application/json",
      geometryName: wfsConfig.geometryName,
      filter: spatialFilter,
    };
    if (wfsConfig.maxFeatures > 0) {
      wfsGetFeatureOtions["maxFeatures"] = wfsConfig.maxFeatures;
    }

    const wfsBoreholesBodyXml = new XMLSerializer().serializeToString(
      this.#wfsParser.writeGetFeature(wfsGetFeatureOtions)
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
    hfetch(wfsConfig.url, wfsBoreholesRequest)
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

  /**
   * Updates state with document details from the specified feature.
   * @param {*} feature OL feature
   */
  // Feature selection callback for updating state with project details,
  // given a WFS project feature
  #selectDocument = (feature) => {
    const props = feature.properties;
    const featureId = feature.id;
    const title = props[this.#config.projects.attributes.title];
    const link = props[this.#config.projects.attributes.link];

    if (!featureId || !title || !link) {
      console.error(
        "#selectDocument: WFS is missing feature id, title (%s) or link attribute (%s). Feature=",
        this.#config.projects.attributes.title,
        this.#config.projects.attributes.link,
        feature
      );
      return;
    }
    const documentDetail = this.#getDocumentById(featureId);
    documentDetail.title = title;
    documentDetail.link = link;
  };

  // Feature selection callback for updating state with borehole and project details,
  // given a WFS borehole feature
  #selectBoreHole = (feature) => {
    const props = feature.properties;
    const boreholeId = props[this.#config.boreholes.attributes.external_id];
    const projectId =
      props[this.#config.boreholes.attributes.external_project_id];

    if (!boreholeId || !projectId) {
      console.log(
        "#selectBoreHole: WFS is missing id (%s) or project id attribute (%s)",
        this.#config.boreholes.attributes.external_id,
        this.#config.boreholes.attributes.external_project_id
      );
      throw new TypeError("Internt fel, identiteter saknas.");
    }
    const project = this.#getBoreholeProjectById(projectId);
    if (!this.#selection.borehole.boreholeIds.includes(boreholeId)) {
      this.#selection.borehole.boreholeIds.push(boreholeId);
      project.boreholeIds.push(boreholeId);
      project.numBoreHolesSelected++;
    }
  };

  #updateProjectDetails = (projectDetails) => {
    const projectId = projectDetails.investigationId;
    const projectName = projectDetails.name;
    const projectNumBoreHolesTotal = projectDetails.numberOfPoints;
    const project = this.#getBoreholeProjectById(projectId);
    project.name = projectName;
    project.numBoreHolesTotal = projectNumBoreHolesTotal;
  };

  #updateSelectedProjectsDetailsFromTrimbleApi = () => {
    console.log("#updateSelectedProjectsDetailsFromTrimbleApi");
    const controller = new AbortController();
    const signal = controller.signal;

    const projectIds = Object.keys(this.#selection.borehole.projects).filter(
      (projectId) => {
        // Optimized Trimble API usage: only fetch if we don't have the project details
        const project = this.#getBoreholeProjectById(projectId);
        return !project || !project.numBoreHolesTotal;
      }
    );

    /*
    Create all of the requests we need to make the the Trimble API as an array of promises.
    We only want to update the projects data if all the requests are successful. 
    */
    const requests = projectIds.map((projectId) => {
      const promise = new Promise((resolve, reject) => {
        const projectDetailsMethod =
          this.#options?.services?.trimble?.projectDetailsMethod ??
          "/investigation";
        this.#trimbleApiFetch(
          signal,
          projectDetailsMethod.concat("/", projectId),
          "GET"
        )
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
            this.#localObserver.publish("borehole-selection-updated");
          })
          .catch((error) => {
            console.error(error);
            this.#localObserver.publish("borehole-selection-failed");
          });
      })
      .catch((error) => {
        console.error(error);
        this.#localObserver.publish("borehole-selection-failed");
      });
  };

  /**
   * @summary Returns a hfetch promise for a method invocation on the Trimble REST API.
   * @param {*} signal abortcontroller signal
   * @param {*} endpointAddress relative address/endpoint, will be prefixed with the API base URL
   * @param {*} httpMethod "GET" or "POST"
   * @param {*} body optional body parameter if sending a POST request,
   * content type is expected to be application/json
   * @returns hfetch promise
   */
  #trimbleApiFetch = (signal, endpointAddress, httpMethod, body) => {
    const apiUrlPrefix =
      this.#options.services?.trimble?.url ??
      "https://geoarkiv-api.goteborg.se/prod";
    let apiUrl = apiUrlPrefix.concat(endpointAddress);

    // TODO: REMOVE: Work-around pending customer technical solution to CORS pre-flight for POST requests
    const proxy = this.#app.config?.appConfig?.searchProxy ?? "";
    apiUrl = proxy.concat(apiUrl);

    const apiRequestOptions = {
      credentials: "same-origin",
      signal: signal,
      method: httpMethod,
    };
    if (httpMethod === "POST" && body) {
      apiRequestOptions["body"] = JSON.stringify(body);
      apiRequestOptions["headers"] = {
        "Content-Type": "application/json",
      };
    }
    return hfetch(apiUrl, apiRequestOptions);
  };

  #getSpatialFilter = (filterName) => {
    if (filterName === "intersects") {
      return intersects;
    }
    return within;
  };

  #getBoreholeProjectById = (projectId) => {
    let project = undefined;
    if (this.#selection.borehole.projects[projectId]) {
      project = this.#selection.borehole.projects[projectId];
    } else {
      project = {
        id: projectId,
        name: "",
        boreholeIds: [],
        numBoreHolesSelected: 0,
        numBoreHolesTotal: 0,
      };
      this.#selection.borehole.projects[projectId] = project;
    }
    return project;
  };

  // Callback for updating document details. Currently a no-op/signal handler only since all document details
  // are returned in WFS query.
  #updateDocumentDetails = () => {
    console.log("#updateDocumentDetails");
    // TODO: Fix WFS call error handling: this.#localObserver.publish("document-selection-failed");
    this.#localObserver.publish("document-selection-updated");
  };

  #getDocumentById = (featureId) => {
    let documentDetail = undefined;
    if (this.#selection.document[featureId]) {
      documentDetail = this.#selection.document[featureId];
    } else {
      documentDetail = {
        id: featureId,
        title: "",
        link: "",
      };
      this.#selection.document[featureId] = documentDetail;
    }
    return documentDetail;
  };

  #clearSelectionState = () => {
    // First delete existing object reference, if any, for GC friendliness
    delete this.#selection.borehole.projects;
    delete this.#selection.document;
    // Reset borehole selection state
    this.#selection.borehole.boreholeIds.length = 0;
    this.#selection.borehole.projects = {};
    // Reset document selection state
    this.#selection.document = {};
  };
}

export default GeosuiteExportModel;
