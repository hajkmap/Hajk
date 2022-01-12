import React from "react";
import $ from "jquery";

class VectorLayerForm extends React.Component {
  state = {
    addedLayers: [],
    attribution: "",
    caption: "",
    internalLayerName: "",
    content: "",
    dataFormat: "WFS",
    date: "Fylls i per automatik",
    drawOrder: 1,
    filterAttribute: "",
    filterComparer: "eq",
    filterValue: "",
    filterable: false,
    id: "",
    imageLoad: false,
    infoOwner: "",
    infoText: "",
    infoTitle: "",
    infoUrl: "",
    infoUrlText: "",
    infoVisible: false,
    infobox: "",
    timeSliderVisible: false,
    timeSliderStart: "",
    timeSliderEnd: "",
    layer: "",
    layerType: "Vector",
    legend: "",
    legendIcon: "",
    load: false,
    maxZoom: -1,
    minZoom: -1,
    opacity: 1,
    projection: "",
    queryable: true,
    hideExpandArrow: false,
    sldStyle: "Default Styler",
    sldText: "",
    sldUrl: "",
    url: "",
    validationErrors: [],
    version: "1.1.0",
  };

  componentDidMount() {
    this.props.model.on("change:select-image", () => {
      this.setState(
        {
          legend: this.props.model.get("select-image"),
        },
        () => this.validateField("select-image")
      );
    });
    this.props.model.on("change:select-legend-icon", () => {
      this.setState(
        {
          legendIcon: this.props.model.get("select-legend-icon"),
        },
        () => this.validateField("select-legend-icon")
      );
    });
  }

  componentWillUnmount() {
    this.props.model.off("change:legend");
    this.props.model.off("change:legendIcon");
  }

  describeLayer(layer) {
    this.props.model.getWFSLayerDescription(
      this.state.url,
      layer.name,
      (layerDescription) => {
        if (Array.isArray(layerDescription)) {
          this.props.parent.setState({
            layerProperties: layerDescription.map((d) => {
              return {
                name: d.name,
                type: d.localType,
              };
            }),
          });
        }
      }
    );
  }

  getLayer() {
    return {
      attribution: this.getValue("attribution"),
      caption: this.getValue("caption"),
      internalLayerName: this.getValue("internalLayerName"),
      content: this.getValue("content"),
      dataFormat: this.getValue("dataFormat"),
      date: this.getValue("date"),
      filterAttribute: this.getValue("filterAttribute"),
      filterComparer: this.getValue("filterComparer"),
      filterValue: this.getValue("filterValue"),
      filterable: this.getValue("filterable"),
      id: this.state.id,
      infoOwner: this.getValue("infoOwner"),
      infoText: this.getValue("infoText"),
      infoTitle: this.getValue("infoTitle"),
      infoUrl: this.getValue("infoUrl"),
      infoUrlText: this.getValue("infoUrlText"),
      infoVisible: this.getValue("infoVisible"),
      infobox: this.getValue("infobox"),
      timeSliderVisible: this.getValue("timeSliderVisible"),
      timeSliderStart: this.getValue("timeSliderStart"),
      timeSliderEnd: this.getValue("timeSliderEnd"),
      layer: this.state.addedLayers[0],
      legend: this.getValue("legend"),
      legendIcon: this.getValue("legendIcon"),
      maxZoom: this.getValue("maxZoom"),
      minZoom: this.getValue("minZoom"),
      opacity: this.getValue("opacity"),
      projection: this.getValue("projection"),
      queryable: this.getValue("queryable"),
      hideExpandArrow: this.getValue("hideExpandArrow"),
      sldStyle: this.getValue("sldStyle"),
      sldText: this.getValue("sldText"),
      sldUrl: this.getValue("sldUrl"),
      url: this.getValue("url"),
      type: this.state.layerType,
      version: this.getValue("version"),
    };
  }

  getValue(fieldName) {
    function create_date() {
      return new Date().getTime().toString();
    }

    const input = this.refs["input_" + fieldName];
    let value = input ? input.value : "";

    // We must cast the following to Number, as String won't be accepted for those:
    if (["maxZoom", "minZoom", "opacity"].includes(fieldName)) {
      value = Number(value);
    }

    if (fieldName === "date") value = create_date();
    if (fieldName === "queryable") value = input.checked;
    if (fieldName === "filterable") value = input.checked;
    if (fieldName === "infoVisible") value = input.checked;
    if (fieldName === "timeSliderVisible") value = input.checked;
    if (fieldName === "hideExpandArrow") value = input.checked;

    return value;
  }

  validate() {
    var validationFields = ["url", "caption", "projection"];
    if (this.state.dataFormat !== "GeoJSON") {
      validationFields.push("layer");
    }

    var errors = [];

    validationFields.forEach((field) => {
      var valid = this.validateField(field, false, false);
      if (!valid) {
        errors.push(field);
      }
    });

    this.setState({
      validationErrors: errors,
    });

    return errors.length === 0;
  }

  validateField(fieldName, forcedValue, updateState) {
    var value = this.getValue(fieldName),
      valid = true;

    function number(v) {
      return !empty(v) && !isNaN(Number(v));
    }

    function empty(v) {
      return typeof v === "string"
        ? v.trim() === ""
        : Array.isArray(v)
        ? v[0] === ""
        : false;
    }

    switch (fieldName) {
      case "layer":
        if (
          this.state &&
          this.state.addedLayers &&
          this.state.addedLayers.length === 0
        ) {
          valid = false;
        }
        break;
      case "opacity":
      case "minZoom":
      case "maxZoom":
        if (!number(value) || empty(value)) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
      case "legend":
      case "projection":
        if (empty(value)) {
          valid = false;
        }
        break;
      default:
        break;
    }

    if (updateState !== false) {
      if (!valid) {
        this.setState({
          validationErrors: [...this.state.validationErrors, fieldName],
        });
      } else {
        this.setState({
          validationErrors: this.state.validationErrors.filter(
            (v) => v !== fieldName
          ),
        });
      }
    }

    return valid;
  }

  getValidationClass(inputName) {
    return this.state.validationErrors.find((v) => v === inputName)
      ? "validation-error"
      : "";
  }

  loadWFSCapabilities(e, callback) {
    if (e) {
      e.preventDefault();
    }

    this.setState({
      load: true,
      addedLayers: [],
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined,
    });

    if (this.state.capabilities) {
      this.state.capabilities.forEach((layer, i) => {
        this.refs[layer.name].checked = false;
      });
    }

    this.props.model.getWFSCapabilities(this.state.url, (capabilities) => {
      var projection = "";
      if (Array.isArray(capabilities) && capabilities.length > 0) {
        projection = capabilities[0].projection;
      }

      this.setState({
        capabilities: capabilities,
        projection: this.state.projection || projection || "",
        legend: this.state.legend || capabilities.legend || "",
        legendIcon: this.state.legendIcon || "",
        hideExpandArrow: capabilities.hideExpandArrow ?? false,
        load: false,
      });

      this.validate();

      if (capabilities === false) {
        this.props.parent.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL.",
        });
      }
      if (callback) {
        callback();
      }
    });
  }

  loadLegend(e) {
    $("#select-image").attr("caller", "select-image");
    $("#select-image").trigger("click");
  }

  loadLegendIcon(e) {
    $("#select-legend-icon").attr("caller", "select-legend-icon");
    $("#select-legend-icon").trigger("click");
  }

  setLineWidth(e) {
    this.setState({
      lineWidth: e.target.value,
    });
  }

  setFilterAttribute(e) {
    this.setState({
      filterAttribute: e.target.value,
    });
  }

  setFilterValue(e) {
    this.setState({
      filterValue: e.target.value,
    });
  }

  setFilterComparer(e) {
    this.setState({
      filterComparer: e.target.value,
    });
  }

  appendLayer(e, checkedLayer) {
    if (e.target.checked === true) {
      this.setState(
        {
          addedLayers: [checkedLayer],
        },
        () => this.validate()
      );
    } else {
      this.setState(
        {
          addedLayers: this.state.addedLayers.filter(
            (layer) => layer !== checkedLayer
          ),
        },
        () => this.validate()
      );
    }
  }

  loadLayers(layer, callback) {
    if (this.state.dataFormat === "WFS") {
      this.loadWFSCapabilities(undefined, () => {
        this.setState({
          addedLayers: [layer.layer],
        });
        Object.keys(this.refs).forEach((element) => {
          if (this.refs[element].dataset.type === "wms-layer") {
            this.refs[element].checked = false;
          }
        });
        this.refs[layer.layer].checked = true;
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.map((layer, i) => {
        var classNames =
          this.state.layerPropertiesName === layer.name
            ? "fa fa-info-circle active"
            : "fa fa-info-circle";
        return (
          <li key={i}>
            <input
              ref={layer.name}
              id={"layer" + i}
              type="radio"
              name="featureType"
              data-type="wms-layer"
              onChange={(e) => {
                this.appendLayer(e, layer.name);
              }}
            />
            &nbsp;
            <label htmlFor={"layer" + i}>{layer.title}</label>
            <i
              className={classNames}
              onClick={(e) => this.describeLayer(layer)}
            />
          </li>
        );
      });
    } else {
      return null;
    }
  }

  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer(
        {
          target: {
            checked: false,
          },
        },
        layer
      );
      this.refs[layer].checked = false;
    }

    return this.state.addedLayers.map((layer, i) => (
      <li className="layer" key={i}>
        <span>{layer}</span>
        &nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)} />
      </li>
    ));
  }

  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>{layers}</ul>
      </div>
    );
  }

  render() {
    const loader = this.state.load ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const imageLoader = this.state.imageLoad ? (
      <i className="fa fa-refresh fa-spin" />
    ) : null;
    const infoClass = this.state.infoVisible ? "tooltip-info" : "hidden";
    const timeSliderClass = this.state.timeSliderVisible
      ? "tooltip-timeSlider"
      : "hidden";

    return (
      <fieldset>
        <legend>Vektorlager</legend>
        <div className="separator">Anslutning</div>
        <div>
          <label>
            Dataformat (
            <abbr title="Styr 'outputFormat'. 'WFS' efterfrågar 'GML2' eller 'GML3' (se nästa). 'GeoJSON' efterfrågar 'application/json'.">
              ?
            </abbr>
            )
          </label>
          <select
            ref="input_dataFormat"
            value={this.state.dataFormat}
            className="control-fixed-width"
            onChange={(e) => {
              this.setState({
                dataFormat: e.target.value,
              });
            }}
          >
            <option>WFS</option>
            <option>GeoJSON</option>
          </select>
        </div>
        <div>
          <label>
            WFS-version (
            <abbr title="Styr 'outputFormat' om WFS är valt. 1.0.0 ger GML2. 1.1.0 och 2.0.0 ger GML3.">
              ?
            </abbr>
            )
          </label>
          <select
            ref="input_version"
            value={this.state.version}
            className="control-fixed-width"
            onChange={(e) => {
              this.setState({
                version: e.target.value,
              });
            }}
          >
            {["1.0.0", "1.1.0", "2.0.0"].map((v, i) => {
              return (
                <option key={i} value={v}>
                  {v}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label>
            URL{" "}
            <abbr title="URL till WFS endpoint, ex: 'https://geoserver.example.com/geoserver/wfs'.">
              ?
            </abbr>
          </label>
          <input
            type="text"
            ref="input_url"
            value={this.state.url}
            className={this.getValidationClass("url")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ url: v }, () => this.validateField("url"));
            }}
          />
          <span
            onClick={(e) => {
              this.loadWFSCapabilities(e);
            }}
            className="btn btn-default"
          >
            Ladda {loader}
          </span>
        </div>
        <div className="separator">Tillgängliga lager</div>
        <div>
          <label>Lagerlista</label>
          {this.renderLayerList()}
        </div>
        <div className="separator">Hantera valda lager</div>
        <div>
          <label>Valt lager*</label>
          <div
            ref="input_layer"
            className={"layer-list-choosen " + this.getValidationClass("layer")}
          >
            <ul>{this.renderSelectedLayers()}</ul>
          </div>
        </div>
        <div>
          <label>Stäng av möjlighet att expandera</label>
          <input
            type="checkbox"
            ref="input_hideExpandArrow"
            id="hideExpandArrow"
            onChange={(e) => {
              this.setState({ hideExpandArrow: e.target.checked });
            }}
            checked={this.state.hideExpandArrow}
          />
        </div>
        <div>
          <label>Visningsnamn*</label>
          <input
            type="text"
            ref="input_caption"
            value={this.state.caption}
            className={this.getValidationClass("caption")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ caption: v }, () =>
                this.validateField("caption")
              );
            }}
          />
        </div>
        <div>
          <label>Visningsnamn Admin</label>
          <input
            type="text"
            ref="input_internalLayerName"
            value={this.state.internalLayerName || ""}
            onChange={(e) => {
              this.setState({ internalLayerName: e.target.value });
              this.validateField("internalLayerName");
            }}
          />
        </div>
        <div>
          <label>Projektion*</label>
          <input
            type="text"
            ref="input_projection"
            value={this.state.projection}
            className={this.getValidationClass("projection")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ projection: v }, () =>
                this.validateField("projection")
              );
            }}
          />
        </div>
        <div>
          <label>Opacitet*</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            ref="input_opacity"
            value={this.state.opacity}
            className={
              (this.getValidationClass("opacity"), "control-fixed-width")
            }
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ opacity: v }, () =>
                this.validateField("opacity")
              );
            }}
          />
        </div>
        <div>
          <label>
            Min zoom{" "}
            <abbr title="Lägsta zoomnivå där lagret visas. OBS! Om man vill att lagret ska visas för skala 1:10 000, 1:5 000, 1:2 000 osv måste man ange den zoomnivå som skalsteget ovanför skala 1:10 000 har (t ex 1:20 000). Om 5 motsvarar 1:10 000 ska man då ange 4. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den lägsta zoomnivån. Se även inställning för Max zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_minZoom"
            value={this.state.minZoom}
            className={this.getValidationClass("minZoom")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ minZoom: v });
            }}
          />
        </div>
        <div>
          <label>
            Max zoom{" "}
            <abbr title="Högsta zoomnivå vid vilket lagret visas. Om man t ex anger 5 för skala 1:10 000 kommer lagret att visas för skala 1:10 000 men inte för skala 1:5000. Värdet på zoomnivån beror på aktuella inställningar i map_1.json, avsnitt ”map.resolutions”. '-1' betyder att lagret är synligt hela vägen till den sista zoomnivån. Se även inställning för Min zoom.">
              (?)
            </abbr>
          </label>
          <input
            type="number"
            step="1"
            min="-1"
            max="100"
            ref="input_maxZoom"
            value={this.state.maxZoom}
            className={this.getValidationClass("maxZoom")}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ maxZoom: v }, () =>
                this.validateField("maxZoom")
              );
            }}
          />
        </div>
        <div>
          <label>
            URL till SLD-filen
            <abbr title="URL till fil som innehåller SLD-data som stilsätter lagret. Antingen detta eller nästa inställning måste anges (se även nästa inställning). Om varken URL eller SLD anges kommer lagret att renderas med OpenLayers default-stil.">
              (?)
            </abbr>
          </label>
          <input
            type="text"
            ref="input_sldUrl"
            value={this.state.sldUrl}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ sldUrl: v });
            }}
          />
        </div>
        <div>
          <label>
            SLD (XML){" "}
            <abbr title="SLD (i textform, XML-likt format) som stilsätter lagret. Antingen detta eller föregående inställning måste anges (se även föregående inställning). Om varken URL eller SLD anges kommer lagret att renderas med OpenLayers default-stil.">
              (?)
            </abbr>
          </label>
          <textarea
            ref="input_sldText"
            value={this.state.sldText}
            onChange={(e) => this.setState({ sldText: e.target.value })}
          />
        </div>
        <div>
          <label>
            Namn på stilen (inuti SLD-definitionen)
            <abbr title="Värdet på attributet Name från UserStyle, så som den anges i SLD. Exempelvis, 'En stil' är korrekt värde om SLD innehåller: '<NamedLayer><Name>Ett lager</Name><UserStyle><Name>En stil</Name>'">
              (?)
            </abbr>
          </label>
          <input
            type="text"
            ref="input_sldStyle"
            value={this.state.sldStyle}
            onChange={(e) => {
              const v = e.target.value;
              this.setState({ sldStyle: v });
            }}
          />
        </div>
        <div>
          <label>
            Upphovsrätt (
            <abbr title="Styr OpenLayers 'attributions' för lagret, visas i kartan.">
              ?
            </abbr>
            )
          </label>
          <input
            type="text"
            ref="input_attribution"
            onChange={(e) => {
              this.setState({ attribution: e.target.value });
              this.validateField("attribution", e);
            }}
            value={this.state.attribution}
            className={this.getValidationClass("attribution")}
          />
        </div>
        <div>
          <input
            type="checkbox"
            ref="input_queryable"
            id="queryable"
            onChange={(e) => {
              this.setState({ queryable: e.target.checked });
            }}
            checked={this.state.queryable}
          />
          &nbsp;
          <label htmlFor="queryable">Infoklickbar</label>
        </div>
        <div>
          <label>Inforuta</label>
          <textarea
            ref="input_infobox"
            value={this.state.infobox}
            onChange={(e) => this.setState({ infobox: e.target.value })}
          />
        </div>
        <div className="separator">Filtrering</div>
        <div>
          <input
            type="checkbox"
            ref="input_filterable"
            id="filterable"
            onChange={(e) => {
              this.setState({ filterable: e.target.checked });
            }}
            checked={this.state.filterable}
          />
          &nbsp;
          <label htmlFor="filterable">
            Tillåt användaren att filtrera features{" "}
            <abbr title="Ger användaren möjlighet att via Lagerhanteraren styra vilka features som visas.">
              ?
            </abbr>
          </label>
        </div>
        <div>
          <label>Filterattribut vid start</label>
          <input
            type="text"
            ref="input_filterAttribute"
            value={this.state.filterAttribute}
            onChange={(e) => {
              this.setState({ filterAttribute: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Filterjämförare vid start</label>
          <select
            ref="input_filterComparer"
            value={this.state.filterComparer}
            className="control-fixed-width"
            onChange={(e) => {
              this.setState({
                filterComparer: e.target.value,
              });
            }}
          >
            <option value="lt">Mindre än</option>
            <option value="gt">Större än</option>
            <option value="eq">Lika med</option>
            <option value="not">Skilt från</option>
          </select>
        </div>
        <div>
          <label>Filtervärde vid start</label>
          <input
            type="text"
            ref="input_filterValue"
            value={this.state.filterValue}
            onChange={(e) => {
              this.setState({ filterValue: e.target.value });
            }}
          />
        </div>
        <div className="separator">Inställningar för objekt</div>
        <div>
          <label>Ikon</label>
          <input
            type="text"
            ref="input_legend"
            value={this.state.legend}
            className={this.getValidationClass("legend")}
            onChange={(e) => {
              this.setState({ legend: e.target.value });
            }}
          />
          <span
            onClick={(e) => {
              this.loadLegend(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div>
          <label>
            Teckenförklar
            <br />
            ingsikon
          </label>
          <input
            type="text"
            ref="input_legendIcon"
            value={this.state.legendIcon}
            onChange={(e) => this.setState({ legendIcon: e.target.value })}
          />
          <span
            onClick={(e) => {
              this.loadLegendIcon(e);
            }}
            className="btn btn-default"
          >
            Välj fil {imageLoader}
          </span>
        </div>
        <div className="separator">Metadata</div>
        <div>
          <label>Innehåll</label>
          <input
            type="text"
            ref="input_content"
            value={this.state.content}
            onChange={(e) => {
              this.setState({ content: e.target.value });
            }}
          />
        </div>
        <div>
          <label>Senast ändrad</label>
          <span ref="input_date">
            <i>{this.props.model.parseDate(this.state.date)}</i>
          </span>
        </div>

        <div className="info-container">
          <div>
            <input
              type="checkbox"
              ref="input_infoVisible"
              id="info-document"
              onChange={(e) => {
                this.setState({ infoVisible: e.target.checked });
              }}
              checked={this.state.infoVisible}
            />
            &nbsp;
            <label htmlFor="info-document">Infodokument</label>
          </div>
          <div className={infoClass}>
            <label>Rubrik</label>
            <input
              type="text"
              ref="input_infoTitle"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoTitle: v }, () =>
                  this.validateField("infoTitle", v)
                );
              }}
              value={this.state.infoTitle}
              className={this.getValidationClass("infoTitle")}
            />
          </div>
          <div className={infoClass}>
            <label>Text</label>
            <textarea
              type="text"
              ref="input_infoText"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoText: v }, () =>
                  this.validateField("infoText", v)
                );
              }}
              value={this.state.infoText}
              className={this.getValidationClass("infoText")}
            />
          </div>
          <div className={infoClass}>
            <label>Länk (ex. till PDF)</label>
            <input
              type="text"
              ref="input_infoUrl"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoUrl: v }, () =>
                  this.validateField("infoUrl", v)
                );
              }}
              value={this.state.infoUrl}
              className={this.getValidationClass("infoUrl")}
            />
          </div>
          <div className={infoClass}>
            <label>Länktext</label>
            <input
              type="text"
              ref="input_infoUrlText"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoUrlText: v }, () =>
                  this.validateField("infoUrlText", v)
                );
              }}
              value={this.state.infoUrlText}
              className={this.getValidationClass("infoUrlText")}
            />
          </div>
          <div className={infoClass}>
            <label>Ägare</label>
            <input
              type="text"
              ref="input_infoOwner"
              onChange={(e) => {
                const v = e.target.value;
                this.setState({ infoOwner: v }, () =>
                  this.validateField("infoOwner", v)
                );
              }}
              value={this.state.infoOwner}
              className={this.getValidationClass("infoOwner")}
            />
          </div>
        </div>
        <div className="timeSlider-container">
          <div>
            <input
              type="checkbox"
              ref="input_timeSliderVisible"
              id="timeSlider"
              onChange={(e) => {
                this.setState({ timeSliderVisible: e.target.checked });
              }}
              checked={this.state.timeSliderVisible}
            />
            &nbsp;
            <label htmlFor="timeSlider">Tidslinjedatum</label>
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje start</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderStart"
              onChange={(e) => {
                this.setState({ timeSliderStart: e.target.value });
              }}
              value={this.state.timeSliderStart}
            />
          </div>
          <div className={timeSliderClass}>
            <label>Tidslinje slut</label>
            <input
              type="text"
              placeholder="ÅÅÅÅMMDD"
              ref="input_timeSliderEnd"
              onChange={(e) => {
                this.setState({ timeSliderEnd: e.target.value });
              }}
              value={this.state.timeSliderEnd}
            />
          </div>
        </div>
      </fieldset>
    );
  }
}

export default VectorLayerForm;
