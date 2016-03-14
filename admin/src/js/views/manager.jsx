var Alert = require('react-simple-alert');
/**
 *
 */
class Manager extends React.Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = {
      load: false,
      capabilities: false,
      alert: false,
      alertMessage: "",
      validationErrors: [],
      mode: "add",
      layers: [],
      addedLayers: [],
      caption: "",
      content: "",
      date: "Fylls i per automatik",
      infobox: "",
      legend: "",
      owner: "a",
      searchFields: "",
      url: "194.71.132.27/geoserver/wms",
      visibleAtStart: false
    };
  }
  /**
   *
   */
  componentDidMount() {
    this.props.model.getConfig('/mapservice/settings/config/layers');
    this.props.model.on('change:layers', () => {
      this.setState({
        layers: this.props.model.get('layers')
      })
    });
  }
  /**
   *
   */
  componentWillUnmount() {

    this.props.model.off('change:layers');
  }
  /**
   *
   */
  removeLayer(e) {
    e.stopPropagation();
    console.log("Remove");
  }
  /**
   *
   */
  loadLayer(e, layer) {

    this.setState({
      mode: "edit",
      caption: layer.caption,
      content: layer.content,
      date: layer.date,
      infobox: layer.infobox,
      legend: layer.legend,
      owner: layer.owner,
      searchFields: layer.searchFields,
      url: layer.url,
      visibleAtStart: layer.visibleAtStart
    });

    setTimeout(() => {
      this.loadWMSCapabilities(undefined, () => {
        this.setState({
          addedLayers: layer.layers
        });
        layer.layers.forEach(layer => {
          this.refs[layer].checked = true;
        });
      });
    }, 0);
  }
  /**
   *
   */
  loadWMSCapabilities(e, callback) {
    if (e)
      e.preventDefault();

    this.setState({
      load: true,
      alert: false,
      addedLayers: [],
      capabilities: false,
      layerProperties: undefined,
      layerPropertiesName: undefined
    });

    if (this.state.capabilities) {
      this.state.capabilities.Capability.Layer.Layer.forEach((layer, i) => {
        this.refs[layer.Name].checked = false;
      });
    }

    this.props.model.getWMSCapabilities(this.state.url, (capabilities) => {
      this.setState({
        capabilities: capabilities,
        load: false
      });
      if (capabilities === false) {
        this.setState({
          alert: true,
          alertMessage: "Server svarar inte. Försök med en annan URL."
        })
      }
      if (callback) {
        callback();
      }
    });
  }
  /**
   *
   */
  describeLayer(e, layerName) {
    this.props.model.getLayerDescription(this.refs.input_url.value, layerName, (properties) => {
      this.setState({
        layerProperties: properties,
        layerPropertiesName: layerName
      });
    });
  }
  /**
   *
   */
  closeDetails() {
    this.setState({
      layerProperties: undefined,
      layerPropertiesName: undefined
    });
  }
  /**
   *
   */
  renderLayerProperties() {
    if (this.state.layerProperties === undefined) {
      return null;
    }
    if (this.state.layerProperties === false) {
      return (
        <div>
          <i className="fa fa-times" onClick={() => this.closeDetails()}></i>
          <div>Information saknas</div>
        </div>
      )
    }
    var rows = this.state.layerProperties.map((property, i) =>
      <tr key={i}>
        <td>{property.name}</td>
        <td>{property.localType}</td>
        <td>{property.nillable == true ? "Nej" : "Ja"}</td>
      </tr>
    );
    return (
      <div>
        <i className="fa fa-times" onClick={() => this.closeDetails()}></i>
        <table>
          <thead>
            <tr>
              <th>Namn</th>
              <th>Typ</th>
              <th>Obligatorisk</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    )
  }
  /**
   *
   */
  appendLayer(e, checkedLayer) {
    if (e.target.checked === true) {
      this.state.addedLayers.push(checkedLayer);
    } else {
      this.state.addedLayers = this.state.addedLayers.filter(layer =>
        layer !== checkedLayer
      );
    }
    this.forceUpdate();
    this.validate("layers");
  }
  /**
   *
   */
  renderSelectedLayers() {
    if (!this.state.addedLayers) return null;

    function uncheck(layer) {
      this.appendLayer({
        target: {
          checked: false
        }
      }, layer);
      this.refs[layer].checked = false;
    }

    return this.state.addedLayers.map((layer, i) =>
      <li className="layer" key={i}>
        <span>{layer}</span>&nbsp;
        <i className="fa fa-times" onClick={uncheck.bind(this, layer)}></i>
      </li>
    )
  }
  /**
   *
   */
  renderLayersFromCapabilites() {
    if (this.state && this.state.capabilities) {
      return this.state.capabilities.Capability.Layer.Layer.map((layer, i) => {
        var classNames = this.state.layerPropertiesName === layer.Name ?
                         "fa fa-info-circle active" : "fa fa-info-circle";
        return (
          <li key={i}>
            <input ref={layer.Name} id={"layer" + i} type="checkbox" onChange={(e) => { this.appendLayer(e, layer.Name) }}/>&nbsp;
            <label htmlFor={"layer" + i}>{layer.Name}</label>
            <i className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)}></i>
          </li>
        )
      });
    } else {
      return null;
    }
  }
  /**
   *
   */
  renderLayerList() {
    var layers = this.renderLayersFromCapabilites();
    return (
      <div className="layer-list">
        <ul>
          {layers}
        </ul>
      </div>
    )
  }
  /**
   *
   */
  renderOwnerOptions() {
    if (this.props.config && this.props.config.owner_options) {
      return this.props.config.owner_options.map((option, i) =>
        <option value={option.value} key={i}>{option.title}</option>
      );
    } else {
      return null;
    }
  }
  /**
   *
   */
  filterLayers(e) {
    this.setState({
      filter: e.target.value
    });
  }
  /**
   *
   */
  getLayersWithFilter(filter) {
    return this.props.model.get('layers').filter(layer =>
      (new RegExp(this.state.filter)).test(layer.options.caption.toLowerCase())
    );
  }
  /**
   *
   */
  renderLayersFromConfig(layers) {
    layers = this.state.filter ? this.getLayersWithFilter() : this.props.model.get('layers');
    return layers.map((layer, i) =>
      <li onClick={(e) => this.loadLayer(e, layer)} key={Math.random()}>
        <span>{layer.caption}</span>
        <i title="Radera lager" onClick={this.removeLayer} className="fa fa-trash"></i>
      </li>
    );
  }
  /**
   *
   */
  abort (e) {
    this.setState({
      mode: "add",
      capabilities: false,
      validationErrors: [],
      layers: [],
      addedLayers: [],
      caption: "",
      content: "",
      date: "Fylls i per automatik",
      infobox: "",
      legend: "",
      owner: "a",
      searchFields: "",
      url: "194.71.132.27/geoserver/wms",
      visibleAtStart: false
    });
  }
  /**
   *
   */
  validate (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;

    switch (fieldName) {
      case "layers":
        if (value.length === 0) {
          valid = false;
        }
        break;
      case "url":
      case "caption":
      case "content":
        if (value === "") {
          valid = false;
        }
        break;
    }

    if (!valid) {
      this.state.validationErrors.push(fieldName);
    } else {
      this.state.validationErrors = this.state.validationErrors.filter(v => v !== fieldName);
    }

    if (e) {
      let state = {};
      state[fieldName] = e.target.value;
      this.setState(state);
    } else {
      this.forceUpdate();
    }

    return valid;
  }
  /**
   *
   */
  getValue(fieldName) {

    function create_date() {
      return (new Date()).toLocaleString();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'searchFields') value = value.split(',');

    return value;
  }
  /**
   *
   */
  submit(e) {

    var validations = [
      this.validate("url"),
      this.validate("caption"),
      this.validate("content"),
      this.validate("layers")
    ];

    if (validations.every(v => v === true)) {
      $.ajax({
        url: "/mapservice/settings/layer",
        method: this.state.mode === 'edit' ? 'PUT' : 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          caption: this.getValue("caption"),
          url: this.getValue("url"),
          owner: this.getValue("owner"),
          date: this.getValue("date"),
          content: this.getValue("content"),
          legend: this.getValue("legend"),
          layers: this.getValue("layers"),
          infobox: this.getValue("infobox"),
          searchFields: this.getValue("searchFields"),
          visibleAtStart: this.getValue("visibleAtStart")
        })
      });
    }

    e.preventDefault();
  }
  /**
   *
   */
  getAlertOptions() {
    return {
      title: "Meddelande",
      message: this.state.alertMessage,
      alert: this.state.alert
    };
  }
  /**
   *
   */
  getValidationClass(inputName) {
    return valid = this.state.validationErrors.find(v => v === inputName) ? "validation-error" : "";
  }
  /**
   *
   */
  render() {

    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;
    var abort = this.state.mode === "edit" ? <span className="btn btn-danger" onClick={(e) => this.abort(e)}>Avbryt</span> : null;

    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <aside>
          <input placeholder="fitrera" type="text" onChange={(e) => this.filterLayers(e)} />
          <ul className="config-layer-list">
            {this.renderLayersFromConfig()}
          </ul>
        </aside>
        <article>
          <form method="post" action="/mapservice/settings/layer" onSubmit={(e) => { this.submit(e) }}>
            <fieldset>
              <legend>Lägg till WMS-lager</legend>
              <div>
                <label>Visningsnamn*</label>
                <input
                  type="text"
                  ref="input_caption"
                  value={this.state.caption}
                  onChange={(e) => this.validate("caption", e)}
                  className={this.getValidationClass("caption")}
                />
              </div>
              <div>
                <label>Url*</label>
                <input
                  type="text"
                  ref="input_url"
                  value={this.state.url}
                  onChange={(e) => this.validate("url", e)}
                  className={this.getValidationClass("url")}
                />
                <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default">Ladda lager {loader}</span>
              </div>
              <div>
                <label>Dataägare</label>
                <select ref="input_owner" value={this.state.owner} onChange={(e) => this.validate("owner", e)}>
                  {this.renderOwnerOptions()}
                </select>
              </div>
              <div>
                <label>Senast ändrad</label>
                <span ref="input_date"><i>{this.state.date}</i></span>
              </div>
              <div>
                <label>Innehåll*</label>
                <input
                  type="text"
                  ref="input_content"
                  value={this.state.content}
                  onChange={(e) => this.validate("content", e)}
                  className={this.getValidationClass("content")}
                />
              </div>
              <div>
                <label>Teckenförklaring</label>
                <input
                  type="text"
                  ref="input_legend"
                  value={this.state.legend}
                  onChange={(e) => this.validate("legend", e)}
                />
              </div>
              <div>
                <label>Valda lager*</label>
                <div ref="input_layers" className={"layer-list-choosen " + this.getValidationClass("layers")}>
                  <ul>
                    {this.renderSelectedLayers()}
                  </ul>
                </div>
              </div>
              <div>
                <label>Lagerlista</label>
                {this.renderLayerList()}
              </div>
              <div>
                <label>Inforuta</label>
                <textarea
                  ref="input_infobox"
                  onChange={(e) => this.validate("infobox", e)}
                  value={this.state.infobox}
                  className={this.getValidationClass("infobox")}
                />
              </div>
              <div>
                <label>Sökfält</label>
                <input
                  type="text"
                  ref="input_searchFields"
                  onChange={(e) => this.validate("searchFields", e)}
                  value={this.state.searchFields}
                />
              </div>
              <div>
                <label>Synligt vid start</label>
                <input
                  type="checkbox"
                  ref="input_visibleAtStart"
                  onChange={(e) => this.validate("visibleAtStart", e)}
                  checked={this.state.visibleAtStart}
                />
              </div>
            </fieldset>
            <button className="btn btn-primary">{this.state.mode == "edit" ? "Spara" : "Lägg till"}</button>&nbsp;
            {abort}
          </form>
        </article>
        <div className="details">
          {this.renderLayerProperties()}
        </div>
      </section>
    );
  }
}

module.exports = Manager;