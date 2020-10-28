import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import MenuBook from "@material-ui/icons/MenuBook";
import DocumentHandlerModel from "./DocumentHandlerModel";
import PanelMenuContainerView from "./panelMenu/PanelMenuContainerView";
import Observer from "react-event-observer";
import MapViewModel from "./MapViewModel";
import { withTheme } from "@material-ui/core/styles";

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
    documentTitle: "",
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
          this.setState({ model: loadedDocumentModel });
        });

      this.addDrawerToggleButton();
    });
  }

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
    const { app } = this.props;
    app.globalObserver.publish("core.addDrawerToggleButton", {
      value: "menu",
      ButtonIcon: MenuBook,
      caption: "Översiktsplan",
      order: 100,
      renderDrawerContent: this.renderDrawerContent,
    });
  };

  showDocument = (documentFileName) => {
    const { app } = this.props;
    app.globalObserver.publish("documentviewer.showWindow", {
      hideOtherPlugins: false,
    });
    app.globalObserver.publish("core.maximizeWindow");
    return this.setActiveDocument(documentFileName);
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

      this.setState(
        {
          documentTitle: document?.documentTitle
            ? document.documentTitle
            : null,
          document: document,
          documentColor: document?.documentColor
            ? document.documentColor
            : null,
          showPrintWindow: false,
        },
        resolve
      );
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
          onWindowHide={this.onWindowHide}
          togglePrintWindow={this.togglePrintWindow}
          document={this.state.document}
          documentColor={this.state.documentColor}
          documentWindowMaximized={this.state.documentWindowMaximized}
          showPrintWindow={this.state.showPrintWindow}
          chapters={this.state.chapters}
          documentTitle={this.state.documentTitle}
          model={this.state.model}
          localObserver={this.localObserver}
        ></DocumentWindowBase>
      </>
    );
  }
}
export default withTheme(DocumentHandler);
