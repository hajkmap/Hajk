import React from "react";
import PropTypes from "prop-types";
import DocumentWindowBase from "./documentWindow/DocumentWindowBase";
import OverlayMenuViewPartialFunctionality from "./documentsMenu/overlaymenu/OverlayMenuView";
import menuComponent from "./documentsMenu/MenuViewHOC";
import BarMenuViewPartialFunctionality from "./documentsMenu/menubar/BarMenuView";
import Observer from "react-event-observer";
import Hidden from "@material-ui/core/Hidden";

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

  constructor(props) {
    super(props);
    this.localObserver = Observer();
  }

  render() {
    return (
      <>
        <Hidden xlUp>
          <OverlayMenuView
            app={this.props.app}
            initialMenu={this.props.options.menuConfig}
            localObserver={this.localObserver}
          ></OverlayMenuView>
        </Hidden>
        <Hidden lgDown>
          <BarMenuView
            app={this.props.app}
            initialMenu={this.props.options.menuConfig}
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
