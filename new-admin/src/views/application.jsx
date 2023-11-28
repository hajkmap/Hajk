import React from "react";
import { Component } from "react";
import Alert from "../views/alert.jsx";

import Edit from "../views/edit.jsx";
import LayerManager from "../views/layermanager.jsx";
import InformativeEditor from "../views/informativeeditor.jsx";
import MapSettings from "../views/mapsettings.jsx";
import Info from "../views/info.jsx";
import Release from "../views/release.jsx";
import Search from "../views/search.jsx";
import DocumentEditor from "../views/documenteditor.jsx";
import SurveyHandler from "../views/surveyhandler2.jsx";

import editModel from "../models/edit.js";
import layerManagerModel from "../models/layermanager.js";
import informativeEditorModel from "../models/informativeEditor.js";
import mapSettingsModel from "../models/mapsettings.js";
import infoModel from "../models/info.js";
import releaseModel from "../models/release.js";
import searchModel from "../models/search.js";
import documentEditorModel from "../models/documenteditor.js";

var defaultState = {
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  confirmAction: () => {},
  denyAction: () => {},
};
/**
 *
 */
class Application extends Component {
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
    this.setState({
      content: this.props.model.get("content"),
    });

    this.props.model.on("change:content", () => {
      this.setState({
        content: this.props.model.get("content"),
      });
    });
  }
  /**
   *
   */
  resetAlert() {
    this.setState({
      alert: false,
      alertMessage: "",
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
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }
  /**
   *
   */
  renderTabs() {
    if (!this.state) return null;

    var tabs = this.props.tabs;

    return tabs.map((item, i) => {
      var anchor = "#!/" + item.name,
        active =
          this.state.content === item.name ? "nav-link active" : "nav-link";
      return (
        <li className="nav-item" key={i}>
          <a className={active} href={anchor}>
            {item.title}
          </a>
        </li>
      );
    });
  }

  getView(name) {
    switch (name) {
      case "edit":
        return Edit;
      case "layermanager":
        return LayerManager;
      case "informative":
        return InformativeEditor;
      case "mapsettings":
        return MapSettings;
      case "info":
        return Info;
      case "release":
        return Release;
      case "search":
        return Search;
      case "documenthandler":
        return DocumentEditor;
      case "surveyhandler":
        return SurveyHandler;
      default:
        return null;
    }
  }

  getModel(name) {
    switch (name) {
      case "edit":
        return new editModel();
      case "layermanager":
        return new layerManagerModel();
      case "informative":
        return new informativeEditorModel();
      case "mapsettings":
        return new mapSettingsModel();
      case "info":
        return new infoModel();
      case "release":
        return new releaseModel();
      case "search":
        return new searchModel();
      case "documenthandler":
        return new documentEditorModel();
      default:
        return undefined;
    }
  }

  /**
   *
   */
  renderContent() {
    if (!this.state || !this.state.content) return null;

    var content = null;
    var model = null;
    try {
      content = this.getView(this.state.content);
      model = this.getModel(this.state.content);
    } catch (e) {
      console.error(e);
      return <div>{e.message}</div>;
    }
    return React.createElement(content, {
      model: model,
      config: this.props.config[this.state.content],
      application: this,
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
        <Alert options={this.getAlertOptions()} />
        <nav>
          <ul className="nav nav-tabs">{tabs}</ul>
        </nav>
        <section className="tab-content">{content}</section>
      </main>
    );
  }
}

export default Application;
