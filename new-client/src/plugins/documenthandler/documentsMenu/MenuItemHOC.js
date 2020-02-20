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
      const { app, localObserver, color, title } = this.props;

      console.log(title, "title");
      return (
        <MenuItem
          handleMenuButtonClick={this.handleMenuButtonClick}
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
