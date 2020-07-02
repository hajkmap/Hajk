import React from "react";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
import MapIcon from "@material-ui/icons/Map";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import MenuIcon from "@material-ui/icons/Menu";
import PrintIcon from "@material-ui/icons/Print";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import TocIcon from "@material-ui/icons/Toc";
import ArrowDownward from "@material-ui/icons/ArrowDownward";
import Typography from "@material-ui/core/Typography";
import BreadCrumbs from "./components/BreadCrumbs.js";
import Alert from "../../components/Alert.js";
import { withSnackbar } from "notistack";

const styles = theme => ({
  rightIcon: {
    marginLeft: theme.spacing(1),
    cursor: "pointer"
  },
  icon: {
    marginRight: theme.spacing(1)
  },
  chapter: {},
  toc: {
    marginBottom: "10px"
  },
  tocHeader: {
    display: "flex",
    alignItems: "center"
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
    userSelect: "all",
    cursor: "auto",
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
    },
    "& blockquote": {
      borderLeft: "5px solid #eee",
      color: "#666",
      fontFamily: "Hoefler Text, Georgia, serif",
      fontStyle: "italic",
      margin: "16px 0",
      padding: "10px 20px"
    }
  },
  loader: {
    opacity: 1,
    transition: "opacity 2s ease-in"
  },
  button: {
    margin: theme.spacing(1)
  },
  legend: {
    border: "1px solid #999",
    padding: theme.spacing(1),
    flexFlow: "row wrap",
    display: "flex",
    borderRadius: "5px"
  },
  legendItem: {
    margin: theme.spacing(1),
    fontWeight: 600,
    textAlign: "center"
  }
});

const homeHeader = "";
var homeHtml = "";

class Informative extends React.PureComponent {
  constructor(props) {
    super();
    homeHtml = props.abstract;
    this.state = {
      url: "",
      loading: false,
      alert: false,
      displayLegend: false,
      tocExpanded: props.options.tocExpanded, // Should be called "legendGraphicsVisible", since it controls the legend graphic
      tocVisible: true, // This controls the TOC's state, whether it show sub-chapters or not. TODO: Add option to admin/backend.
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
      if (this.props.options.tocExpanded) {
        this.expandToc(this.toc);
      }
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
          displayLegend: false,
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
          tocVisible: false,
          displayLegend: false
        });
      }
    });

    this.props.observer.subscribe("showSnackbar", params => {
      const { message, options } = params;
      this.props.enqueueSnackbar(message, options);
    });
  }

  expandToc(chapters) {
    if (Array.isArray(chapters)) {
      chapters.forEach(chapter => {
        chapter.tocExpanded = true;
        if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
          this.expandToc(chapter.chapters);
        }
      });
    }
  }

  displayMap = (layers, mapSettings) => e => {
    this.props.parent.informativeModel.displayMap(layers, mapSettings);
    if (window.innerWidth < 600) {
      this.props.app.globalObserver.publish("core.minimizeWindow");
    }
    this.setState({
      displayLegend: true
    });
  };

  renderLayerItems(chapter) {
    const { classes } = this.props;
    if (Array.isArray(chapter.layers) && chapter.layers.length > 0) {
      return (
        <div>
          <Button
            variant="contained"
            onClick={this.displayMap(chapter.layers, chapter.mapSettings)}
          >
            Karta
            <MapIcon color="primary" className={classes.rightIcon} />
          </Button>
          <IconButton
            className={classes.button}
            aria-label="Teckenförklaring"
            onClick={this.toggleLegend}
          >
            {this.state.displayLegend ? (
              <ExpandLessIcon color="primary" title="Teckenförklaring" />
            ) : (
              <TocIcon color="primary" title="Teckenförklaring" />
            )}
          </IconButton>
        </div>
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
                <ArrowDropDownIcon />
              ) : (
                <ArrowRightIcon />
              )}
            </div>
            <div
              className={classes.tocChapterHeader}
              onClick={() => {
                var state = {
                  chapters: chapter.chapters,
                  chapter: chapter,
                  tocVisible: false,
                  displayLegend: false
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

  print = () => {
    this.setState({
      loading: true,
      url: false
    });
    this.props.parent.informativeModel.print(this.state.chapter, url => {
      if (undefined !== this.props.options.exportRoot) {
        url = this.props.options.exportRoot + url;
      }
      if (url === "error") {
        this.setState({
          loading: false,
          url: false,
          alert: true
        });
      } else {
        this.setState({
          url: url,
          loading: false
        });
      }
    });
  };

  toggleLegend = () => {
    this.setState({
      displayLegend: !this.state.displayLegend
    });
  };

  renderChapters() {
    const { classes } = this.props;
    const { tocVisible } = this.state;
    return (
      <div className={classes.toc}>
        {this.state.loading && <LinearProgress className={classes.loader} />}
        <Alert
          open={this.state.alert}
          dialogTitle="Felmeddelande"
          message="Det gick inte att skriva ut för tillfället, försök igen senare"
          parent={this}
        />
        <div className={classes.tocHeader}>
          <Button variant="contained" onClick={this.toggleToc}>
            Innehållsförteckning
            <MenuIcon color="primary" className={classes.rightIcon} />
          </Button>
          <IconButton
            className={classes.button}
            aria-label="Skriv ut"
            onClick={this.print}
          >
            <PrintIcon color="primary" title="Skriv ut" />
          </IconButton>
        </div>
        <div>
          {this.state.url && (
            <Button
              ref="anchor"
              href={this.state.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                this.setState({
                  url: ""
                });
              }}
            >
              <ArrowDownward className={classes.icon} /> Ladda ner
            </Button>
          )}
        </div>
        {tocVisible ? (
          <div className={classes.tocContainer} component="nav">
            {this.renderTocItem(this.toc || [])}
          </div>
        ) : null}
      </div>
    );
  }

  renderLegend() {
    const { classes } = this.props;
    return (
      this.state.displayLegend && (
        <div>
          <Typography variant="overline">Teckenförklaring</Typography>
          <div className={classes.legend}>
            {this.props.parent.informativeModel
              .getLegends(this.state.chapter)
              .map((legend, i) => {
                return (
                  <div className={classes.legendItem} key={i}>
                    <div>{legend.caption}</div>
                    <img key={i} alt="toc" src={legend.url} />
                  </div>
                );
              })}
          </div>
        </div>
      )
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
        {this.renderLegend()}
        <div className={classes.content}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default withStyles(styles)(withSnackbar(Informative));
