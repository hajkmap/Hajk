import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import OverlayMenuViewPartialFunctionality from "./documentsMenu/overlaymenu/OverlayMenuView";
import DocumentHandlerModel from "./DocumentHandlerModel";
import menuComponent from "./documentsMenu/MenuViewHOC";
import BarMenuViewPartialFunctionality from "./documentsMenu/menubar/BarMenuView";
import Observer from "react-event-observer";
import Hidden from "@material-ui/core/Hidden";
import MapViewModel from "./MapViewModel";

const iconFontElement = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
  />
);

const OverlayMenuView = menuComponent(OverlayMenuViewPartialFunctionality);
const BarMenuView = menuComponent(BarMenuViewPartialFunctionality);

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

  dynamicallyImportIconFonts = () => {
    return iconFontElement;
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
    this.getListOfDocuments();
  }

  getListOfDocuments = () => {
    this.model.listAllAvailableDocuments(list => {});
  };

  render() {
    return (
      <>
        {this.dynamicallyImportIconFonts()}
        <Hidden xlUp>
          <OverlayMenuView
            app={this.props.app}
            model={this.model}
            options={this.props.options}
            localObserver={this.localObserver}
          ></OverlayMenuView>
        </Hidden>
        <Hidden lgDown>
          <BarMenuView
            app={this.props.app}
            model={this.model}
            options={this.props.options}
            localObserver={this.localObserver}
          ></BarMenuView>
        </Hidden>
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
