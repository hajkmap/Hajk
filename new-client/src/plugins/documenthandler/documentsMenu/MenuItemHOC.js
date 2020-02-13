import React from "react";

const menuItem = MenuItem =>
  class WithMenuFunctionality extends React.PureComponent {
    state = {
      highlighted: false
    };

    static propTypes = {};

    static defaultProps = {};

    constructor(props) {
      super(props);
      this.globalObserver = this.props.app.globalObserver;
    }

    toggleHighlight = () => {
      this.setState({ highlighted: !this.state.highlighted });
    };

    handleMenuButtonClick = header => {
      const { localObserver } = this.props;
      localObserver.publish("menu-item-clicked", header);
    };

    render() {
      const { app, localObserver, color, header } = this.props;
      return (
        <MenuItem
          handleMenuButtonClick={this.handleMenuButtonClick}
          color={color}
          header={header}
          highlighted={this.state.highlighted}
          app={app}
          localObserver={localObserver}
          toggleHighlight={this.toggleHighlight}
        ></MenuItem>
      );
    }
  };

export default menuItem;
