import React from "react";
import { withStyles } from "@material-ui/core/styles";
import BaseWindowPlugin from "../../BaseWindowPlugin";
import DocumentViewer from "./DocumentViewer";
import PrintWindow from "./PrintWindow";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({});

class DocumentWindowBase extends React.PureComponent {
  state = {
    counter: 0,
    document: null,
    documentWindowMaximized: true,
    showPrintWindow: false,
    chapters: []
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.bindSubscriptions();
    this.getAllChapters();
    props.model.getAllDocuments(props.options.menuConfig.menu);
  }

  // setActiveDocument = title => {
  //   console.log("model.allDocuments: ", this.props.model.allDocuments);
  //   const { model } = this.props;
  //   let dx = model.getDocuments(["Utgångspunkter"]);
  //   console.log("dx", dx);
  //   return new Promise((resolve, reject) => {
  //     model.fetchJsonDocument(title).then(document => {
  //       var referringMenuItem = this.findReferringMenuItem(title);
  //       return this.setState(
  //         () => {
  //           return {
  //             documentTitle: title,
  //             document: document,
  //             documentColor: referringMenuItem ? referringMenuItem.color : null,
  //             showPrintWindow: false
  //           };
  //         },
  //         () => {
  //           console.log(this.state, "state");
  //           resolve(); //Ensure setState is run
  //         }
  //       );
  //     });
  //   });
  // };

  setActiveDocument = title => {
    const { model } = this.props;
    let document = model.getDocuments([title])[0];
    const referringMenuItem = this.findReferringMenuItem(title);
    this.setState({
      documentTitle: title,
      document: document,
      documentColor: referringMenuItem ? referringMenuItem.color : null,
      showPrintWindow: false
    });
  };

  onMinimize = () => {
    this.setState({ documentWindowMaximized: false });
  };

  onMaximize = () => {
    this.setState({ documentWindowMaximized: true });
  };

  findMenuItem(menuItem, documentNameToFind) {
    if (menuItem.document === documentNameToFind) {
      return menuItem;
    } else if (menuItem.menu && menuItem.menu.length > 0) {
      var i,
        result = null;
      for (i = 0; result == null && i < menuItem.menu.length; i++) {
        result = this.findMenuItem(menuItem.menu[i], documentNameToFind);
      }
      return result;
    }
    return null;
  }

  findReferringMenuItem = documentNameToFind => {
    const { options } = this.props;
    return options.menuConfig.menu.find(rootItemToSearch => {
      return this.findMenuItem(rootItemToSearch, documentNameToFind) != null;
    });
  };

  showDocument = documentName => {
    const { app } = this.props;
    app.globalObserver.publish("documentviewer.showWindow", {
      hideOtherPlugins: false
    });
    return this.setActiveDocument(documentName);
  };

  scrollInDocument = headerIdentifier => {
    const { localObserver, model } = this.props;
    if (headerIdentifier) {
      localObserver.publish(
        "scroll-to-chapter",
        model.getHeaderRef(this.state.document, headerIdentifier)
      );
    } else {
      localObserver.publish(
        "scroll-to-top",
        model.getHeaderRef(this.state.document, headerIdentifier)
      );
    }
  };

  showHeaderInDocument = ({ documentName, headerIdentifier }) => {
    if (documentName !== this.state.documentTitle) {
      this.showDocument(documentName).then(() => {
        this.scrollInDocument(headerIdentifier);
      });
    } else {
      this.scrollInDocument(headerIdentifier);
    }
  };

  togglePrintWindow = () => {
    this.setState({
      showPrintWindow: !this.state.showPrintWindow
    });
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe(
      "show-header-in-document",
      this.showHeaderInDocument
    );
    localObserver.subscribe("show-document", this.showDocument);
  };

  getAllChapters = () => {
    const { model, options } = this.props;
    const filteredMenu = options.menuConfig.menu.filter(
      item => item.document !== ""
    );

    return filteredMenu.map((item, id) => {
      return new Promise((resolve, reject) => {
        model.fetchJsonDocument(item.document).then(item => {
          if (item && item.chapters) {
            let chapter = this.setChapterLevels(item.chapters[0], 0);
            return this.setState(
              () => {
                return {
                  chapters: [...this.state.chapters, chapter]
                };
              },
              () => {
                resolve(); //Ensure setState is run
              }
            );
          }
        });
      });
    });
  };

  setChapterLevels(chapter, level) {
    chapter.level = level;
    if (chapter.chapters && chapter.chapters.length > 0) {
      level = level + 1;
      chapter.chapters.forEach(subChapter => {
        subChapter = this.setChapterLevels(subChapter, level);
      });
    }
    return chapter;
  }

  render() {
    const {
      documentWindowMaximized,
      document,
      documentTitle,
      documentColor,
      showPrintWindow,
      chapters
    } = this.state;
    const { options, classes } = this.props;

    return (
      <BaseWindowPlugin
        {...this.props}
        type="DocumentViewer"
        custom={{
          icon: <MenuBookIcon />,
          title: documentTitle || options.windowTitle || "Documents",
          color: documentColor || "#ffffff",
          description: "En kort beskrivning som visas i widgeten",
          height: options.height || "90vh",
          width: options.width || 600,
          scrollable: false,
          onMinimize: this.onMinimize,
          onMaximize: this.onMaximize,
          onResize: this.onResize,
          draggingEnabled: false,
          resizingEnabled: false,
          allowMaximizedWindow: false
        }}
      >
        {document != null ? (
          !showPrintWindow ? (
            <DocumentViewer
              documentColor={documentColor || "#ffffff"}
              documentWindowMaximized={documentWindowMaximized}
              activeDocument={document}
              togglePrintWindow={this.togglePrintWindow}
              {...this.props}
            />
          ) : (
            <PrintWindow
              chapters={chapters}
              activeDocument={document}
              togglePrintWindow={this.togglePrintWindow}
              {...this.props}
            />
          )
        ) : (
          <Grid
            style={{ height: "100%" }}
            className={classes.loader}
            alignItems="center"
            justify="center"
            container
          >
            <CircularProgress style={{ height: "100%" }} justify="center" />
          </Grid>
        )}
      </BaseWindowPlugin>
    );
  }
}

export default withStyles(styles)(DocumentWindowBase);
