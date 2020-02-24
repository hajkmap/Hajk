import React from "react";

const menuItem = MenuItem => {
  return class WithMenuFunctionality extends React.PureComponent {
    state = {
      highlighted: false
    };

    static propTypes = {};

    static defaultProps = {};

    handleMenuButtonClick = () => {
      const { localObserver, type, item } = this.props;
      localObserver.publish(`${type}-clicked`, item);
    };

    toggleHighlight = () => {
      this.setState({ highlighted: !this.state.highlighted });
    };

    render() {
      const { app, localObserver, color, item, menuItems, type } = this.props;

      return (
        <>
          <MenuItem
            handleMenuButtonClick={this.handleMenuButtonClick}
            type={type}
            menuItems={menuItems}
            color={color}
            item={item}
            highlighted={this.state.highlighted}
            app={app}
            localObserver={localObserver}
            toggleHighlight={this.toggleHighlight}
          ></MenuItem>
        </>
      );
    }
  };
};

export default menuItem;
