import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import OverlayView from "./documentsMenu/overlaymenu/OverlayView";
import menuComponent from "./documentsMenu/MenuViewHOC";
import MenuBarView from "./documentsMenu/menubar/MenuBarView";
import Observer from "react-event-observer";
import Hidden from "@material-ui/core/Hidden";

const OverlayViewMenu = menuComponent(OverlayView);
const MenuBar = menuComponent(MenuBarView);

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

  constructor(props) {
    super(props);
    this.localObserver = Observer();

    this.localObserver.subscribe("documentHandlerEvent", message => {
      console.log(message);
    });
  }

  render() {
    return (
      <>
        <Hidden xlUp>
          <OverlayViewMenu
            app={this.props.app}
            localObserver={this.localObserver}
          ></OverlayViewMenu>
        </Hidden>
        <Hidden lgDown></Hidden>
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
