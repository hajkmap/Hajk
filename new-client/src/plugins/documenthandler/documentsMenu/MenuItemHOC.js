import React from "react";

const menuItem = MenuItem =>
  class WithMenuFunctionality extends React.PureComponent {
    state = {
      highlighted: false
    };

    static propTypes = {};

    static defaultProps = {};

    toggleHighlight = () => {
      this.setState({ highlighted: !this.state.highlighted });
    };

    render() {
      const { app, localObserver, color, title, menuItems } = this.props;

      return (
        <MenuItem
          handleMenuButtonClick={this.handleMenuButtonClick}
          menuItems={menuItems}
          color={color}
          title={title}
          highlighted={this.state.highlighted}
          app={app}
          localObserver={localObserver}
          toggleHighlight={this.toggleHighlight}
        ></MenuItem>
      );
    }
  };

export default menuItem;
