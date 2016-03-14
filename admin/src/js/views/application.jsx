
class Application extends React.Component {

  constructor() {
    super();
  }

  componentDidMount () {
    this.setState({
      content: this.props.model.get('content')
    });

    this.props.model.on('change:content', () => {
      this.setState({
        content: this.props.model.get('content')
      });
    });
  }

  renderTabs() {
    if (!this.state) return null;
    var tabs = this.props.tabs;

    return tabs.map((item, i) =>  {
      var anchor = "#!/" + item.name
      ,   active = this.state.content === item.name ? "active" : "";
      return (
        <li className={active} key={i}>
          <a href={anchor}>{item.title}</a>
        </li>
      );
    });
  }

  renderContent() {
    if (!this.state) return null;

    var content = null;
    var model = null;

    try {
      content = require("views/" + this.state.content);
      model = require("models/" + this.state.content);
    }
    catch (e) {
      return (<div>404</div>)
    }
    return React.createElement(content, {
      model: model,
      config: this.props.config[this.state.content]
    });
  }

  render() {
    var content = this.renderContent();
    var tabs = this.renderTabs();
    return (
      <main>
        <nav>
          <ul className="nav nav-tabs">
            {tabs}
          </ul>
        </nav>
        <section className="tab-content">
          {content}
        </section>
      </main>
    );
  }

}

module.exports = Application;