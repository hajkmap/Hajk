const defaultState = {
  load: false,
  capabilities: false,
  validationErrors: [],
  mode: "add",
  layers: [],
  addedLayers: [],
  id: "",
  caption: "",
  content: "",
  date: "Fylls i per automatik",
  infobox: "",
  legend: "",
  owner: "",
  searchFields: "",
  displayFields: "",
  url: "",
  visibleAtStart: false,
  queryable: true,
  tiled: false,
  drawOrder: 1
};
/**
 *
 */
class Manager extends React.Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }
  /**
   *
   */
  componentDidMount() {
    this.props.model.set('config', this.props.config);
    this.props.model.getConfig(this.props.config.url_layers);
    this.props.model.on('change:layers', () => {
      this.setState({
        layers: this.props.model.get('layers')
      })
    });

    defaultState.url = this.props.config.url_default_server;

    this.setState(defaultState);
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
  removeLayer(e, layer) {
    this.props.application.setState({
      alert: true,
      confirm: true,
      alertMessage: "Lagret kommer att tas bort. Är detta ok?",
      confirmAction: () => {
        this.props.model.removeLayer(layer, success => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.props.application.setState({
              alert: true,
              alertMessage: `Lagret ${layer.caption} togs bort!`
            });
            if (this.state.id === layer.id) {
              this.abort();
            }
          } else {
            this.props.application.setState({
              alert: true,
              alertMessage: "Lagret kunde inte tas bort. Försök igen senare."
            });
          }
        });
      }
    });
    e.stopPropagation();
  }
  /**
   *
   */
  loadLayer(e, layer) {

    this.setState({
      mode: "edit",
      id: layer.id,
      caption: layer.caption,
      content: layer.content,
      date: layer.date,
      infobox: layer.infobox,
      legend: layer.legend,
      owner: layer.owner,
      searchFields: layer.searchFields,
      displayFields: layer.displayFields,
      url: layer.url,
      visibleAtStart: layer.visibleAtStart,
      queryable: layer.queryable,
      tiled: layer.tiled,
      drawOrder: layer.drawOrder,
      addedLayers: []
    });

    setTimeout(() => {
      this.validate("url");
      this.validate("caption");
      this.validate("content");
      this.validate("searchFields");
      this.validate("displayFields");
      this.loadWMSCapabilities(undefined, () => {

        this.setState({
          addedLayers: layer.layers
        });

        this.validate("layers");

        _.each(this.refs, element => {
          if (element.dataset.type == "wms-layer") {
            element.checked = false;
          }
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
        this.props.application.setState({
          alert: true,
          alertMessage: "Servern svarar inte. Försök med en annan URL."
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
            <input ref={layer.Name} id={"layer" + i} type="checkbox" data-type="wms-layer" onChange={(e) => { this.appendLayer(e, layer.Name) }}/>&nbsp;
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
    return this.props.model.get('layers').filter(layer => {
      return (new RegExp(this.state.filter)).test(layer.caption.toLowerCase())
    });
  }
  /**
   *
   */
  renderLayersFromConfig(layers) {
    layers = this.state.filter ? this.getLayersWithFilter() : this.props.model.get('layers');
    return layers.map((layer, i) =>
      <li onClick={(e) => this.loadLayer(e, layer)} key={Math.random()}>
        <span>{layer.caption}</span>
        <i title="Radera lager" onClick={(e) => this.removeLayer(e, layer)} className="fa fa-trash"></i>
      </li>
    );
  }
  /**
   *
   */
  abort (e) {
    this.setState(defaultState);
  }
  /**
   *
   */
  validate (fieldName, e) {

    var value = this.getValue(fieldName)
    ,   valid = true;

    switch (fieldName) {
      case "displayFields":
      case "searchFields":
        valid = value.every(val => /^\w+$/.test(val));
        if (value.length === 1 && value[0] === "") {
          valid = true;
        }

        break;
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

    function format_url() {

    }

    function create_date() {
      return (new Date()).getTime();
    }

    function format_layers(layers) {
      return layers.map(layer => layer);
    }

    var input = this.refs["input_" + fieldName]
    ,   value = input ? input.value : "";

    if (fieldName === 'date') value = create_date();
    if (fieldName === 'layers') value = format_layers(this.state.addedLayers);
    if (fieldName === 'visibleAtStart') value = input.checked;
    if (fieldName === 'queryable') value = input.checked;
    if (fieldName === 'tiled') value = input.checked;
    if (fieldName === 'searchFields') value = value.split(',');
    if (fieldName === 'displayFields') value = value.split(',');

    return value;
  }
  /**
   *
   */
  createGuid(layers) {
    return layers.length === 0 ? "0" : (
      parseInt(
        layers.sort((a, b) =>
          a.id === b.id ? 0 : parseInt(a.id) > parseInt(b.id) ? -1 : 1
        )[0].id
      ) + 1
    ).toString();
  }
  /**
   *
   */
  submit(e) {

    var validations = [
      this.validate("url"),
      this.validate("caption"),
      this.validate("content"),
      this.validate("layers"),
      this.validate("searchFields"),
      this.validate("displayFields")
    ];

    if (validations.every(v => v === true)) {

      let layer = {
        id: this.state.id,
        caption: this.getValue("caption"),
        url: this.getValue("url"),
        owner: this.getValue("owner"),
        date: this.getValue("date"),
        content: this.getValue("content"),
        legend: this.getValue("legend"),
        layers: this.getValue("layers"),
        infobox: this.getValue("infobox"),
        searchFields: this.getValue("searchFields"),
        displayFields: this.getValue("displayFields"),
        visibleAtStart: this.getValue("visibleAtStart"),
        queryable: this.getValue("queryable"),
        tiled: this.getValue("tiled"),
        drawOrder: this.getValue("drawOrder")
      };

      if (this.state.mode === "add") {

        layer.id = this.createGuid(this.props.model.get('layers'));

        this.props.model.addLayer(layer, success => {
          if (success) {
            this.props.config.url_layers
            this.props.model.getConfig(this.props.config.url_layers);
            this.abort();
            this.props.application.setState({
              alert: true,
              alertMessage: "Lagret har lagt till i listan av tillgängliga lager."
            });
          } else {
            this.props.application.setState({
              alert: true,
              alertMessage: "Lagret kunde inte läggas till. Försök igen senare."
            });
          }
        });
      }

      if (this.state.mode === "edit") {
        this.props.model.updateLayer(layer, success => {
          if (success) {
            this.props.model.getConfig(this.props.config.url_layers);
            this.props.application.setState({
              alert: true,
              alertMessage: "Uppdateringen lyckades!"
            });
            this.setState({
              date: layer.date,
            });
          } else {
            this.props.application.setState({
              alert: true,
              alertMessage: "Uppdateringen misslyckades."
            });
          }
        });
      }
    }
    e.preventDefault();
  }
  /**
   *
   */
  parseDate() {
    var parsed = parseInt(this.state.date);
    return isNaN(parsed) ?
      this.state.date :
      (new Date(parsed)).toLocaleString();
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
        <aside>
          <input placeholder="fitrera" type="text" onChange={(e) => this.filterLayers(e)} />
          <ul className="config-layer-list">
            {this.renderLayersFromConfig()}
          </ul>
        </aside>
        <article>
          <form method="post" action="" onSubmit={(e) => { this.submit(e) }}>
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
                <span ref="input_date"><i>{this.parseDate()}</i></span>
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
                  className={this.getValidationClass("searchFields")}
                />
              </div>
              <div>
                <label>Visningsfält</label>
                <input
                  type="text"
                  ref="input_displayFields"
                  onChange={(e) => this.validate("displayFields", e)}
                  value={this.state.displayFields}
                  className={this.getValidationClass("displayFields")}
                />
              </div>
              <div>
                <label>Synligt vid start</label>
                <input
                  type="checkbox"
                  ref="input_visibleAtStart"
                  onChange={
                    (e) => {
                      this.setState({visibleAtStart: e.target.checked})
                    }
                  }
                  checked={this.state.visibleAtStart}
                />
              </div>
              <div>
                <label>Infoklickbar</label>
                <input
                  type="checkbox"
                  ref="input_queryable"
                  onChange={
                    (e) => {
                      this.setState({queryable: e.target.checked})
                    }
                  }
                  checked={this.state.queryable}
                />
              </div>
              <div>
                <label>Ritordning</label>
                <input
                  type="text"
                  ref="input_drawOrder"
                  onChange={(e) => this.validate("drawOrder", e)}
                  value={this.state.drawOrder}
                  className={this.getValidationClass("drawOrder")}
                />
              </div>
              <div>
                <label>Geowebcache</label>
                <input
                  type="checkbox"
                  ref="input_tiled"
                  onChange={
                    (e) => {
                      this.setState({tiled: e.target.checked})
                    }
                  }
                  checked={this.state.tiled}
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