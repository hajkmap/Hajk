import React from "react";
import Icon from "@material-ui/core/Icon";

const menuItem = MenuItem => {
  return class WithMenuFunctionality extends React.PureComponent {
    state = {
      highlighted: false
    };

    static propTypes = {};

    static defaultProps = {};

    getIcon = icon => {
      return (
        <Icon style={{ fontSize: icon.fontSize }}>
          {icon.materialUiIconName}
        </Icon>
      );
    };

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
            getIcon={this.getIcon}
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
