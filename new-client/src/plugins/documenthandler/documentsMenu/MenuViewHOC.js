import React from "react";
import DocumentHandlerModel from "../DocumentHandlerModel";

const menuComponent = MenuComponent =>
  class WithMenuFunctionality extends React.Component {
    state = {
      subMenu: false,
      activeDocument: null,
      menuItems: []
    };

    constructor(props) {
      super(props);
      this.documentHandlerModel = new DocumentHandlerModel();
      this.initializeDocumentMenu();
      this.bindSubscriptions();
    }

    bindSubscriptions = () => {
      const { localObserver } = this.props;

      localObserver.subscribe("menu-item-clicked", header => {
        console.log("menuItemClicked");
        this.setMenuView(header);
      });
      localObserver.subscribe("goToParentChapters", parent => {
        console.log(parent, "parent");
      });
    };

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
    };

    initializeDocumentMenu = () => {
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
    };

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

    render() {
      return (
        <MenuComponent
          subMenu={this.state.subMenu}
          menuItems={this.state.menuItems}
          activeDocument={this.state.activeDocument}
          localObserver={this.props.localObserver}
          app={this.props.app}
          setMenuView={this.setMenuView}
          isMainDocument={this.isMainDocument}
          setSubChaptersMenu={this.setSubChaptersMenu}
          setMainChaptersMenu={this.setMainChaptersMenu}
          initializeDocumentMenu={this.initializeDocumentMenu}
          getSubChapters={this.getSubChapters}
        ></MenuComponent>
      );
    }
  };

export default menuComponent;
