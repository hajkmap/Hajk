const Alert = require('views/alert');

var defaultState = {
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  confirmAction: () => {},
  denyAction: () => {}
};
/**
 *
 */
class Application extends React.Component {
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
  /**
   *
   */
  resetAlert() {
    this.setState({
      alert: false,
      alertMessage: ""
    });
  }
  /**
   *
   */
  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        })
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        })
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ""
        })
      }
    };
  }
  /**
   *
   */
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
  /**
   *
   */
  renderContent() {
    if (!this.state) return null;

    var content = null;
    var model = null;

    try {
      content = require("views/" + this.state.content);
      model = require("models/" + this.state.content);
    }
    catch (e) {
      return (<div></div>)
    }
    return React.createElement(content, {
      model: model,
      config: this.props.config[this.state.content],
      application: this
    });
  }
  /**
   *
   */
  render() {
    var content = this.renderContent();
    var tabs = this.renderTabs();
    return (
      <main>
        <Alert options={this.getAlertOptions()}/>
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