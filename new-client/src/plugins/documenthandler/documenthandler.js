import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import OverlayMenuViewPartialFunctionality from "./documentsMenu/overlaymenu/OverlayMenuView";
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
  }

  render() {
    return (
      <>
        {this.dynamicallyImportIconFonts()}
        <Hidden xlUp>
          <OverlayMenuView
            app={this.props.app}
            options={this.props.options}
            localObserver={this.localObserver}
          ></OverlayMenuView>
        </Hidden>
        <Hidden lgDown>
          <BarMenuView
            app={this.props.app}
            options={this.props.options}
            localObserver={this.localObserver}
          ></BarMenuView>
        </Hidden>
        <DocumentWindowBase
          {...this.props}
          app={this.props.app}
          localObserver={this.localObserver}
        ></DocumentWindowBase>
      </>
    );
  }
}
export default DocumentHandler;
