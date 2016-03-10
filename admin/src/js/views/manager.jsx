
class Manager extends React.Component {

  constructor() {
    super();
    this.state = {
      load: false,
      capabilities: false
    }
  }

  loadWMSCapabilities(e) {
    e.preventDefault();
    this.setState({ load: true })
    this.props.model.getWMSCapabilities(this.refs.url.value, (capabilities) => {
      this.setState({
        capabilites: capabilities,
        load: false
      })
    });
  }

  renderLayers() {
    if (!this.state) return null;
    if (this.state.capabilites) {
      return this.state.capabilites.Capability.Layer.Layer.map((layer, i) =>
        (
          <div key={i}>{layer.Name}</div>
        )
      );
    }
  }

  renderLayerList() {

    var layers = this.renderLayers();

    return (
      <div className="layer-list">
        <ul>
          {layers}
        </ul>
      </div>
    )
  }

  render() {

    var layer_list = this.renderLayerList();
    var loader = this.state.load ? <i className="fa fa-refresh fa-spin"></i> : null;

    return (
      <section className="tab-pane active">
      <aside>
        <input placeholder="fitrera" />
        <ul>
          <li>Lager 1</li>
          <li>Lager 2</li>
          <li>Lager 3</li>
          <li>Lager 4</li>
          <li>Lager 5</li>
        </ul>
      </aside>
      <article>
        <form>
          <fieldset>
            <legend>Lägg till WMS-lager</legend>
            <div>
              <label>Visningsnamn</label><input type="text" />
            </div>
            <div>
              <label>Url</label>
              <input type="text" ref="url" defaultValue="194.71.132.27/geoserver/wms" />
              <span onClick={(e) => {this.loadWMSCapabilities(e)}} className="btn btn-default">Ladda lager {loader}</span>
            </div>
            <div>
              <label>Dataägare</label><input type="text" />
            </div>
            <div>
              <label>Senast ändrad</label><input type="text" />
            </div>
            <div>
              <label>Innehåll</label><input type="text" />
            </div>
            <div>
              <label>Teckenförklaring</label><input type="text" />
            </div>
            <div>
              <label>Lagerlista</label>{layer_list}
            </div>
            <div>
              <label>Inforuta</label><input type="text" />
            </div>
            <div>
              <label>Sökfält</label><input type="text" />
            </div>
            <div>
              <label>Synlig vid start</label><input type="text" />
            </div>
          </fieldset>
          <button className="btn btn-primary">Skicka</button>
        </form>
      </article>
      </section>
    );
  }

}

module.exports = Manager;