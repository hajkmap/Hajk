import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import MapIcon from "@material-ui/icons/Map";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import BreadCrumbs from "./components/BreadCrumbs.js";

const styles = theme => ({
  backButtonContainer: {
    display: "inline-block",
    cursor: "pointer"
  },
  backButton: {
    display: "flex",
    alignItems: "center"
  },
  backButtonText: {
    display: "inline-block",
    textTransform: "uppercase",
    fontWeight: 500,
    position: "relative",
    top: "2px"
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  chapter: {
    border: "1px solid #ccc",
    margin: "5px 0"
  },
  toc: {
    margin: "10px 0"
  },
  content: {
    "& img": {
      maxWidth: "100%"
    },
    "& figure": {
      margin: 0
    }
  }
});

const homeHeader = "";
const homeHtml =
  "<div>Genom översiktsplanen talar staden om hur bebyggelse och mark- och vattenanvändning kan utvecklas på lång sikt. Uddevalla ska vara en klimatsmart, växande stad med sammanhållande stadsmiljöer där det byggda och det gröna samspelar. En stad för alla.</div><h2>Vad vill vi uppnå?</h2>Uddevalla ska vara en stad med täta och sammanhållande stadsmiljöer där det byggda och det gröna samspelar.  Översiktsplanen utgår från stadens fyra mål för stadsbyggande.</div><img src='https://images.vastsverige.com/publishedmedia/jue8wzf2g5vrgjoy19xg/Uddevalla_170728-0082-Edit.jpg'/>";

class Informative extends React.PureComponent {
  constructor() {
    super();
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
            html: homeHtml,
            tocVisible: false
          }
        });
      }
    });
  }

  displayMap = (layers, mapSettings) => e => {
    this.props.parent.informativeModel.displayMap(layers, mapSettings);
    if (document.body.scrollWidth < 600) {
      this.props.parent.closePanel();
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
        <ListItem
          button
          key={i}
          className={classes.chapter}
          onClick={() => {
            var state = {
              chapters: chapter.chapters,
              chapter: chapter,
              tocVisible: false
            };
            this.setState(state);
          }}
        >
          {" "}
          <ListItemText primary={chapter.header} />
        </ListItem>
      );
    });
  }

  createMarkup() {
    return { __html: this.state.chapter.html };
  }

  renderContent() {
    return <div dangerouslySetInnerHTML={this.createMarkup()} />;
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
    if (!this.state.chapters || this.state.chapters.length === 0) {
      return null;
    }
    return (
      <div className={classes.toc}>
        <Button variant="contained" onClick={this.toggleToc}>
          Innehållsförteckning
          <MenuIcon color="primary" className={classes.rightIcon} />
        </Button>
        {tocVisible ? (
          <List component="nav">{this.renderTocItem(this.state.chapters)}</List>
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
        />
        {this.renderChapters()}
        {this.state.chapter.header ? (
          <h1>{this.state.chapter.header}</h1>
        ) : null}
        <div className="layers">
          {this.renderLayerItems(this.state.chapter)}
        </div>
        <div className={classes.content}>{this.renderContent()}</div>
      </div>
    );
  }
}

export default withStyles(styles)(Informative);
