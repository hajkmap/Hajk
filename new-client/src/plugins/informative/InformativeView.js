import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import MapIcon from "@material-ui/icons/Map";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import BreadCrumbs from "./components/BreadCrumbs.js";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";

const styles = theme => ({
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  chapter: {},
  toc: {
    marginBottom: "10px"
  },
  tocContainer: {
    borderBottom: "1px solid #ccc",
    padding: "10px 0"
  },
  tocChapter: {
    display: "flex",
    cursor: "pointer"
  },
  tocChapters: {
    marginLeft: "10px"
  },
  tocChapterExpander: {
    width: "30px",
    height: "30px"
  },
  tocChapterHeader: {
    textDecoration: "underline"
  },
  content: {
    "& img": {
      maxWidth: "100%"
    },
    "& figure": {
      margin: 0
    }
  },
  layers: {
    marginTop: "10px"
  },
  markup: {
    "& h1": {
      lineHeight: "normal"
    },
    "& h2": {
      lineHeight: "normal"
    },
    "& h3": {
      lineHeight: "normal"
    },
    "& h4": {
      lineHeight: "normal"
    },
    "& h5": {
      lineHeight: "normal"
    },
    "& h6": {
      lineHeight: "normal"
    }
  }
});

const homeHeader = "";
var homeHtml = "";

class Informative extends React.PureComponent {
  constructor(props) {
    super();
    homeHtml = props.abstract;
    this.state = {
      chapters: [],
      chapter: {
        header: "",
        html: "<span></span>"
      }
    };
  }

  componentDidMount() {
    this.props.parent.informativeModel.load(chapters => {
      this.toc = chapters;
      var state = {
        chapters: chapters,
        chapter: {
          header: homeHeader,
          html: homeHtml
        }
      };
      this.setState(state);
      this.props.app.globalObserver.publish("informativeLoaded", chapters);
    });
    this.props.observer.subscribe("changeChapter", chapter => {
      if (chapter && chapter !== "home") {
        this.setState({
          chapters: chapter.chapters,
          chapter: chapter,
          tocVisible: false
        });
      }
      if (chapter === "home") {
        this.setState({
          chapters: this.toc,
          chapter: {
            header: homeHeader,
            html: homeHtml
          },
          tocVisible: false
        });
      }
    });
  }

  displayMap = (layers, mapSettings) => e => {
    this.props.parent.informativeModel.displayMap(layers, mapSettings);
    if (window.innerWidth < 600) {
      this.props.observer.publish("minimizeWindow", true);
    }
  };

  renderLayerItems(chapter) {
    const { classes } = this.props;
    if (Array.isArray(chapter.layers) && chapter.layers.length > 0) {
      return (
        <Button
          variant="contained"
          onClick={this.displayMap(chapter.layers, chapter.mapSettings)}
        >
          Visa karta
          <MapIcon color="primary" className={classes.rightIcon} />
        </Button>
      );
    }
  }

  renderTocItem(chapters) {
    var { classes } = this.props;
    return chapters.map((chapter, i) => {
      return (
        <div key={i} className={classes.chapter}>
          <div className={classes.tocChapter}>
            <div
              className={classes.tocChapterExpander}
              onClick={() => {
                chapter.tocExpanded = !chapter.tocExpanded;
                this.forceUpdate();
              }}
            >
              {chapter.chapters.length === 0 ? (
                ""
              ) : chapter.tocExpanded ? (
                <RemoveCircleIcon />
              ) : (
                <AddCircleIcon />
              )}
            </div>
            <div
              className={classes.tocChapterHeader}
              onClick={() => {
                var state = {
                  chapters: chapter.chapters,
                  chapter: chapter,
                  tocVisible: false
                };
                this.setState(state);
              }}
            >
              {chapter.header}
            </div>
          </div>
          <div
            className={classes.tocChapters}
            style={{ display: chapter.tocExpanded ? "block" : "none" }}
          >
            {this.renderTocItem(chapter.chapters)}
          </div>
        </div>
      );
    });
  }

  createMarkup() {
    return { __html: this.state.chapter.html };
  }

  renderContent() {
    const { classes } = this.props;
    return (
      <div
        className={classes.markup}
        dangerouslySetInnerHTML={this.createMarkup()}
      />
    );
  }

  findParentInToc(lookupChapter, chapters, parent) {
    var foundParent = false;
    chapters.forEach(chapter => {
      if (chapter.chapters.length > 0 && !foundParent) {
        foundParent = this.findParentInToc(
          lookupChapter,
          chapter.chapters,
          chapter
        );
      }
      if (lookupChapter === chapter && !foundParent) {
        foundParent = {
          chapter: parent,
          chapters: chapters
        };
      }
    });
    return foundParent;
  }

  onBackButtonClick = () => {
    var parent = this.findParentInToc(this.state.chapter, this.toc, null);
    if (parent) {
      this.setState({
        chapter: parent.chapter || {
          header: homeHeader,
          html: homeHtml
        },
        chapters: parent.chapters
      });
    }
  };

  renderBackButton() {
    const { classes } = this.props;
    if (!this.state.chapter.header) {
      return null;
    }
    return (
      <div className={classes.backButtonContainer}>
        <div onClick={this.onBackButtonClick} className={classes.backButton}>
          <ArrowBackIcon />
          &nbsp;
          <Typography className={classes.backButtonText}>Tillbaka</Typography>
        </div>
      </div>
    );
  }

  toggleToc = () => {
    this.setState({
      tocVisible: !this.state.tocVisible
    });
  };

  renderChapters() {
    const { classes } = this.props;
    const { tocVisible } = this.state;
    return (
      <div className={classes.toc}>
        <Button variant="contained" onClick={this.toggleToc}>
          Innehållsförteckning
          <MenuIcon color="primary" className={classes.rightIcon} />
        </Button>
        {tocVisible ? (
          <div className={classes.tocContainer} component="nav">
            {this.renderTocItem(this.toc || [])}
          </div>
        ) : null}
      </div>
    );
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <BreadCrumbs
          chapter={this.state.chapter}
          chapters={this.state.chapters}
          toc={this.toc}
          observer={this.props.observer}
          caption={this.props.caption}
        />
        {this.renderChapters()}
        {this.state.chapter.header ? (
          <Typography variant="h4">{this.state.chapter.header}</Typography>
        ) : null}
        <div className={classes.layers}>
          {this.renderLayerItems(this.state.chapter)}
        </div>
        <div className={classes.content}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default withStyles(styles)(Informative);
