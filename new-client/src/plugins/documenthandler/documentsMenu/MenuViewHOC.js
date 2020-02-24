import React from "react";
import DocumentHandlerModel from "../DocumentHandlerModel";

const menuJson = {
  menu: [
    {
      title: "Markanvändningskarta",
      document: "x",
      color: "#",
      description: "",
      icon: "",
      maplink: "",
      link: "",
      menu: [
        {
          title: "Utvecklingsalternativ",
          document: "",
          maplink: "",
          link: "",
          menu: [
            {
              title: "Centrala Göteborg",
              document: "x",
              maplink: "x",
              link: ""
            },
            {
              title: "Frölunda Högsbo",
              document: "x",
              maplink: "x",
              link: ""
            },
            {
              title: "Torsviken",
              document: "x",
              maplink: "",
              link: ""
            },
            {
              title: "Södra skärgården",
              document: "x",
              maplink: "",
              link: ""
            }
          ]
        },
        {
          title: "Test",
          document: "x",
          maplink: "",
          link: "",
          menu: []
        }
      ]
    },
    {
      title: "Utgångspunkter",
      document: "x",
      maplink: "",
      link: "",
      menu: []
    },
    {
      title: "Geografiska inriktningar",
      document: "x",
      maplink: "",
      link: "",
      menu: []
    },
    {
      title: "Tematiska anspråk",
      document: "x",
      maplink: "",
      link: "",
      menu: []
    },
    {
      title: "Genomförande",
      document: "x",
      maplink: "",
      link: "",
      menu: []
    }
  ]
};

const menuViewHoc = MenuComponent =>
  class WithMenuFunctionality extends React.Component {
    state = {
      activeDocument: null,
      activeMenuSection: menuJson.menu,
      activeChapterLevel: null
    };

    setParentAndContainingMenu(menuItem, containingMenu, parent) {
      menuItem.parent = parent;
      menuItem.containingMenu = containingMenu;

      if (menuItem.menu && menuItem.menu.length > 0) {
        menuItem.menu.forEach(subMenuItem => {
          this.setParentAndContainingMenu(subMenuItem, menuItem.menu, menuItem);
        });
      }
    }

    constructor(props) {
      super(props);
      this.documentHandlerModel = new DocumentHandlerModel();
      //this.fetchMenuStructure();

      menuJson.menu.forEach(menuItem => {
        this.setParentAndContainingMenu(menuItem, menuJson.menu, undefined);
      });

      this.bindSubscriptions();
    }

    getSubMenu = title => {
      var menuItem = this.state.activeMenuSection.find(menuItem => {
        return menuItem.title === title;
      });
      return menuItem.menu;
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

      localObserver.subscribe("open-link", item => {
        console.log(item, "OPENLINK");
      });
    };

    fetchMenuStructure = () => {
      this.setState({ activeMenuSection: null }, () => {});
    };

    render() {
      const { localObserver } = this.props;

      return (
        <MenuComponent
          getMenuItem={this.getMenuItem}
          activeMenuSection={this.state.activeMenuSection}
          localObserver={localObserver}
        ></MenuComponent>
      );
    }
  };

export default menuViewHoc;
