import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import MenuIcon from "@material-ui/icons/Menu";

import DocumentHandlerModel from "./DocumentHandlerModel";
import PanelMenuContainerView from "./panelMenu/PanelMenuContainerView";
import Observer from "react-event-observer";
import MapViewModel from "./MapViewModel";
import { withTheme, createMuiTheme } from "@material-ui/core/styles";
import { deepMerge } from "../../utils/DeepMerge";

const fetchOpts = {
  credentials: "same-origin",
};

class DocumentHandler extends React.PureComponent {
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  state = {
    document: null,
    documentWindowMaximized: true,
    showPrintWindow: false,
    chapters: [],
    documentColor: null,
    model: null,
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();

    this.mapViewModel = new MapViewModel({
      localObserver: this.localObserver,
      globalObserver: props.app.globalObserver,
      map: props.map,
    });

    this.props.searchInterface.getSearchMethods = new Promise((resolve) => {
      new DocumentHandlerModel({
        localObserver: this.localObserver,
        app: props.app,
        map: props.map,
        menu: props.options.menuConfig.menu,
        resolveSearchInterface: resolve,
      })
        .init()
        .then((loadedDocumentModel) => {
          this.fetchCustomThemeJson().then((customTheme) => {
            this.setState({
              model: loadedDocumentModel,
              customTheme: customTheme,
            });
          });
        });

      this.addDrawerToggleButton();
    });
  }

  /**
   * @summary Loops customTheme and checks if certain typography-variants have marginBottom set
   * in the theme file. If not set, then we inject default value.
   * @param {customTheme} documentHandlerTheme
   * @memberof documenthandler.js
   */
  setBottomMarginsForTypographyVariants = (documentHandlerTheme) => {
    ["body1", "h1", "h2", "h3", "h4", "h5", "h6"].forEach((key) => {
      const keyHasValue = documentHandlerTheme.typography[key];
      if (keyHasValue) {
        const marginBottom = documentHandlerTheme.typography[key]?.marginBottom;
        if (!marginBottom) {
          documentHandlerTheme.typography[key].marginBottom =
            this.props.theme.spacing(1) || "8px";
        }
      }
    });
  };

  fetchCustomThemeJson = () => {
    const { options } = this.props;
    return fetch(options.customThemeUrl, fetchOpts)
      .then((res) => {
        return res.json().then((documentHandlerTheme) => {
          if (documentHandlerTheme.typography) {
            this.setBottomMarginsForTypographyVariants(documentHandlerTheme);
          }
          return createMuiTheme(
            deepMerge(this.props.theme, documentHandlerTheme)
          );
        });
      })
      .catch(() => {
        console.warn(
          "Could not find custom theme for documenthandler, check customThemeUrl"
        );
        return null;
      });
  };

  dynamicallyImportOpenSans = () => {
    const { dynamicImportUrls } = this.props.options;
    return (
      <link
        rel="stylesheet"
        type="text/css"
        href={dynamicImportUrls.openSans}
      />
    );
  };

  dynamicallyImportIconFonts = () => {
    const { dynamicImportUrls } = this.props.options;
    return <link rel="stylesheet" href={dynamicImportUrls.iconFonts} />;
  };

  renderDrawerContent = () => {
    const { app, model, options } = this.props;

    return (
      <PanelMenuContainerView
        app={app}
        document={this.state.document}
        model={model}
        options={options}
        localObserver={this.localObserver}
      ></PanelMenuContainerView>
    );
  };

  addDrawerToggleButton = () => {
    const { app, options } = this.props;
    app.globalObserver.publish("core.addDrawerToggleButton", {
      value: "menu",
      ButtonIcon: MenuIcon,
      caption: options.drawerButtonTitle || "Meny",
      drawerTitle: options.drawerTitle || "Översiktsplan",
      order: 100,
      renderDrawerContent: this.renderDrawerContent,
    });
  };

  showDocument = (documentFileName) => {
    const { app } = this.props;

    return this.setActiveDocument(documentFileName).then(() => {
      app.globalObserver.publish("documentviewer.showWindow", {
        hideOtherPlugins: false,
      });
      app.globalObserver.publish("core.maximizeWindow");
    });
  };

  onWindowHide = () => {
    this.localObserver.publish("set-active-document", {
      documentName: null,
      headerIdentifier: null,
    });
    return;
  };

  onMinimize = () => {
    this.setState({ documentWindowMaximized: false });
  };

  onMaximize = () => {
    this.setState({ documentWindowMaximized: true });
  };

  setActiveDocument = (documentFileName) => {
    return new Promise((resolve, reject) => {
      let document = null;
      if (documentFileName) {
        document = this.state.model.getDocuments([documentFileName])[0];
      }
      if (document) {
        this.setState(
          {
            document: document,
            showPrintWindow: false,
          },
          resolve
        );
      } else {
        reject();
      }
    });
  };

  togglePrintWindow = () => {
    this.setState({
      showPrintWindow: !this.state.showPrintWindow,
    });
  };

  render() {
    return (
      <>
        {this.dynamicallyImportOpenSans()}
        {this.dynamicallyImportIconFonts()}
        <DocumentWindowBase
          {...this.props}
          onMinimize={this.onMinimize}
          showDocument={this.showDocument}
          onMaximize={this.onMaximize}
          customTheme={this.state.customTheme}
          onWindowHide={this.onWindowHide}
          togglePrintWindow={this.togglePrintWindow}
          document={this.state.document}
          documentColor={this.state.documentColor}
          documentWindowMaximized={this.state.documentWindowMaximized}
          showPrintWindow={this.state.showPrintWindow}
          chapters={this.state.chapters}
          model={this.state.model}
          localObserver={this.localObserver}
        ></DocumentWindowBase>
      </>
    );
  }
}
export default withTheme(DocumentHandler);
