import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import MenuBook from "@material-ui/icons/MenuBook";
import DocumentHandlerModel from "./DocumentHandlerModel";
import PanelMenuContainerView from "./panelMenu/PanelMenuContainerView";
import Observer from "react-event-observer";
import MapViewModel from "./MapViewModel";

class DocumentHandler extends React.PureComponent {
  state = {};

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
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

  renderDrawerContent = () => {
    return (
      <PanelMenuContainerView
        app={this.props.app}
        model={this.model}
        options={this.props.options}
        localObserver={this.localObserver}
      ></PanelMenuContainerView>
    );
  };

  dynamicallyImportIconFonts = () => {
    const { dynamicImportUrls } = this.props.options;
    return <link rel="stylesheet" href={dynamicImportUrls.iconFonts} />;
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
    this.mapViewModel = new MapViewModel({
      localObserver: this.localObserver,
      globalObserver: props.app.globalObserver,
      map: props.map
    });

    this.model = new DocumentHandlerModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map
    });
    props.app.globalObserver.publish("core.addDrawerToggleButton", {
      value: "menu",
      ButtonIcon: MenuBook,
      caption: "Meny",
      order: 100,
      renderDrawerContent: this.renderDrawerContent
    });
  }

  render() {
    return (
      <>
        {this.dynamicallyImportOpenSans()}
        {this.dynamicallyImportIconFonts()}

        <DocumentWindowBase
          {...this.props}
          model={this.model}
          localObserver={this.localObserver}
        ></DocumentWindowBase>
      </>
    );
  }
}
export default DocumentHandler;
