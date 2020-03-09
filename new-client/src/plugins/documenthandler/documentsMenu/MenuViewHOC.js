import React from "react";

const mapDiv = document.getElementById("map");
const blurCss = "filter : blur(7px)";
const menuViewHoc = MenuComponent =>
  class WithMenuFunctionality extends React.Component {
    state = {
      activeMenuSection: this.props.options.menuConfig.menu
    };

    constructor(props) {
      super(props);

      this.props.options.menuConfig.menu.forEach(menuItem => {
        this.setParentAndContainingMenu(
          menuItem,
          this.props.options.menuConfig.menu,
          undefined
        );
      });
      this.bindSubscriptions();
    }

    setParentAndContainingMenu(menuItem, containingMenu, parent) {
      menuItem.parent = parent;
      menuItem.containingMenu = containingMenu;

      if (menuItem.menu && menuItem.menu.length > 0) {
        menuItem.menu.forEach(subMenuItem => {
          this.setParentAndContainingMenu(subMenuItem, menuItem.menu, menuItem);
        });
      }
    }

    getSubMenu = title => {
      var menuItem = this.state.activeMenuSection.find(menuItem => {
        return menuItem.title === title;
      });
      return menuItem.menu;
    };

    removeMapBlur = () => {
      mapDiv.removeAttribute("style", blurCss);
    };

    addMapBlur = () => {
      mapDiv.setAttribute("style", blurCss);
    };

    bindSubscriptions = () => {
      const { localObserver } = this.props;
      localObserver.subscribe("show-containing-menu", containingMenu => {
        this.setState({ activeMenuSection: containingMenu });
      });

      localObserver.subscribe("cascade-clicked", item => {
        var activeMenuSection = this.getSubMenu(item.title);
        this.setState({ activeMenuSection: activeMenuSection });
      });

      localObserver.subscribe("document-clicked", item => {
        localObserver.publish("show-document-window", item);
      });

      localObserver.subscribe("link-clicked", item => {
        window.open(item.link, "_blank");
      });

      localObserver.subscribe("maplink-clicked", item => {
        localObserver.publish("fly-to", item.maplink);
      });
    };

    render() {
      const { localObserver, options } = this.props;

      return (
        <MenuComponent
          removeMapBlur={this.removeMapBlur}
          addMapBlur={this.addMapBlur}
          getMenuItem={this.getMenuItem}
          options={options}
          activeMenuSection={this.state.activeMenuSection}
          localObserver={localObserver}
        ></MenuComponent>
      );
    }
  };

export default menuViewHoc;
