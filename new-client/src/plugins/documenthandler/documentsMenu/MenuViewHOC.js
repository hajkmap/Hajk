import React from "react";
import DocumentHandlerModel from "../DocumentHandlerModel";

const menuJson = {
  menu: [
    {
      title: "Markanvändningskarta",
      document: "x",
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
      console.log(containingMenu, "containingMenu");
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

      localObserver.subscribe("show-submenu", title => {
        var activeMenuSection = this.getSubMenu(title);
        this.setState({ activeMenuSection: activeMenuSection });
      });

      localObserver.subscribe("open-link", title => {
        console.log("OPENLINK");
      });

      localObserver.subscribe("menu-item-clicked", header => {
        this.setMenuView(header);
      });
    };
    /*
    getMainChapters = header => {
      var document = this.documents.filter(document => {
        return document.header === header;
      })[0];

      return document.chapters;
    };

    //MAKE RECURSIVE
    getSubChapters = header => {
      var activeDocument = this.documents.find(document => {
        return document.header === this.state.activeDocument;
      });

      return activeDocument.chapters.filter(chapter => {
        return chapter.header === header;
      })[0].chapters;
    };*/

    /*
    loadOPDOCUMENTS = () => {
      var promises = [];
      this.documentHandlerModel.list(documentTitles => {
        documentTitles.map(header => {
          promises.push(
            new Promise((resolve, reject) => {
              this.documentHandlerModel.load(header, document => {
                resolve(document);
              });
            })
          );
        });
        Promise.all(promises).then(documents => {
          this.documents = documents;
          this.setState({
            menuItems: documents
          });
        });
      });
    };*/
    /*
    setMainChaptersMenu = header => {
      this.setState({
        menuItems: this.getMainChapters(header),
        activeDocument: header,
        subMenu: true
      });
    };

    setSubChaptersMenu = header => {
      this.setState({
        menuItems: this.getSubChapters(header),
        subMenu: true
      });
    };

    setMenuView = header => {
      if (this.isMainDocument(header)) {
        this.setMainChaptersMenu(header);
      } else {
        this.setSubChaptersMenu(header);
      }
    };

    isMainDocument = header => {
      return this.documents
        .map(document => {
          return document.header;
        })
        .includes(header);
    };
*/

    fetchMenuStructure = () => {
      this.setState({ activeMenuSection: null }, () => {
        console.log(this.state, "state");
      });
    };

    render() {
      const { localObserver } = this.props;

      return (
        <MenuComponent
          activeMenuSection={this.state.activeMenuSection}
          localObserver={localObserver}
        ></MenuComponent>
      );
    }
  };

export default menuViewHoc;
