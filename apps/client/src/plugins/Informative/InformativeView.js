import React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MapIcon from "@mui/icons-material/Map";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import PrintIcon from "@mui/icons-material/Print";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TocIcon from "@mui/icons-material/Toc";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import Typography from "@mui/material/Typography";
import BreadCrumbs from "./components/BreadCrumbs.js";
import Alert from "../../components/Alert.js";
import { withSnackbar } from "notistack";
import { styled } from "@mui/material/styles";

const homeHeader = "";
var homeHtml = "";

const MapIconRightIcon = styled(MapIcon)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  cursor: "pointer",
}));

const IconButtonButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(1),
}));

const DivChapter = styled("div")(({ theme }) => ({}));

const DivTocChapter = styled("div")(({ theme }) => ({
  display: "flex",
  cursor: "pointer",
}));

const DivTocChapters = styled("div")(({ theme }) => ({
  marginLeft: "10px",
}));

const DivTocChapterExpander = styled("div")(({ theme }) => ({
  width: "30px",
  height: "30px",
}));

const DivTocChapterHeader = styled("div")(({ theme }) => ({
  textDecoration: "underline",
}));

const DivMarkup = styled("div")(({ theme }) => ({
  "& h1": {
    lineHeight: "normal",
  },

  "& h2": {
    lineHeight: "normal",
  },

  "& h3": {
    lineHeight: "normal",
  },

  "& h4": {
    lineHeight: "normal",
  },

  "& h5": {
    lineHeight: "normal",
  },

  "& h6": {
    lineHeight: "normal",
  },

  "& blockquote": {
    borderLeft: "5px solid #eee",
    color: "#666",
    fontFamily: "Hoefler Text, Georgia, serif",
    fontStyle: "italic",
    margin: "16px 0",
    padding: "10px 20px",
  },
}));

const MenuIconRightIcon = styled(MenuIcon)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  cursor: "pointer",
}));

const ArrowDownwardIcon = styled(ArrowDownward)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

const DivToc = styled("div")(({ theme }) => ({
  marginBottom: "10px",
}));

const DivTocHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

const DivTocContainer = styled("div")(({ theme }) => ({
  borderBottom: "1px solid #ccc",
  padding: "10px 0",
}));

const LinearProgressLoader = styled(LinearProgress)(({ theme }) => ({
  opacity: 1,
  transition: "opacity 2s ease-in",
}));

const DivLegend = styled("div")(({ theme }) => ({
  border: "1px solid #999",
  padding: theme.spacing(1),
  flexFlow: "row wrap",
  display: "flex",
  borderRadius: "5px",
}));

const DivLegendItem = styled("div")(({ theme }) => ({
  margin: theme.spacing(1),
  fontWeight: 600,
  textAlign: "center",
}));

const DivContent = styled("div")(({ theme }) => ({
  userSelect: "text",
  cursor: "auto",

  "& img": {
    maxWidth: "100%",
  },

  "& figure": {
    margin: 0,
  },
}));

const DivLayers = styled("div")(({ theme }) => ({
  marginTop: "10px",
}));

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
        html: "<span></span>",
      },
    };
  }

  componentDidMount() {
    this.props.parent.informativeModel.load((chapters) => {
      this.toc = chapters;
      if (this.props.options.tocExpanded) {
        this.expandToc(this.toc);
      }
      var state = {
        chapters: chapters,
        chapter: {
          header: homeHeader,
          html: homeHtml,
        },
      };
      this.setState(state);
      this.props.app.globalObserver.publish("informativeLoaded", chapters);
    });
    this.props.observer.subscribe("changeChapter", (chapter) => {
      if (chapter && chapter !== "home") {
        this.setState({
          chapters: chapter.chapters,
          chapter: chapter,
          displayLegend: false,
          tocVisible: false,
        });
      }
      if (chapter === "home") {
        this.setState({
          chapters: this.toc,
          chapter: {
            header: homeHeader,
            html: homeHtml,
          },
          tocVisible: false,
          displayLegend: false,
        });
      }
    });

    this.props.observer.subscribe("showSnackbar", (params) => {
      const { message, options } = params;
      this.props.enqueueSnackbar(message, options);
    });
  }

  expandToc(chapters) {
    if (Array.isArray(chapters)) {
      chapters.forEach((chapter) => {
        chapter.tocExpanded = true;
        if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
          this.expandToc(chapter.chapters);
        }
      });
    }
  }

  displayMap = (layers, mapSettings) => (e) => {
    this.props.parent.informativeModel.displayMap(layers, mapSettings);
    if (window.innerWidth < 600) {
      this.props.app.globalObserver.publish("core.minimizeWindow");
    }
    this.setState({
      displayLegend: true,
    });
  };

  renderLayerItems(chapter) {
    if (Array.isArray(chapter.layers) && chapter.layers.length > 0) {
      return (
        <div>
          <Button
            variant="contained"
            onClick={this.displayMap(chapter.layers, chapter.mapSettings)}
          >
            Karta
            <MapIconRightIcon color="primary" />
          </Button>
          <IconButtonButton
            aria-label="Teckenförklaring"
            onClick={this.toggleLegend}
            size="large"
          >
            {this.state.displayLegend ? (
              <ExpandLessIcon color="primary" title="Teckenförklaring" />
            ) : (
              <TocIcon color="primary" title="Teckenförklaring" />
            )}
          </IconButtonButton>
        </div>
      );
    }
  }

  renderTocItem(chapters) {
    return chapters.map((chapter, i) => {
      return (
        <DivChapter key={i}>
          <DivTocChapter>
            <DivTocChapterExpander
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
            </DivTocChapterExpander>
            <DivTocChapterHeader
              onClick={() => {
                var state = {
                  chapters: chapter.chapters,
                  chapter: chapter,
                  tocVisible: false,
                  displayLegend: false,
                };
                this.setState(state);
              }}
            >
              {chapter.header}
            </DivTocChapterHeader>
          </DivTocChapter>
          <DivTocChapters
            style={{ display: chapter.tocExpanded ? "block" : "none" }}
          >
            {this.renderTocItem(chapter.chapters)}
          </DivTocChapters>
        </DivChapter>
      );
    });
  }

  createMarkup() {
    return { __html: this.state.chapter.html };
  }

  renderContent() {
    return <DivMarkup dangerouslySetInnerHTML={this.createMarkup()} />;
  }

  findParentInToc(lookupChapter, chapters, parent) {
    var foundParent = false;
    chapters.forEach((chapter) => {
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
          chapters: chapters,
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
          html: homeHtml,
        },
        chapters: parent.chapters,
      });
    }
  };

  renderBackButton() {
    if (!this.state.chapter.header) {
      return null;
    }
    return (
      <div>
        <div onClick={this.onBackButtonClick}>
          <ArrowBackIcon />
          &nbsp;
          <Typography>Tillbaka</Typography>
        </div>
      </div>
    );
  }

  toggleToc = () => {
    this.setState({
      tocVisible: !this.state.tocVisible,
    });
  };

  print = () => {
    // There are situations (See #705) where dynamic PDF generation is problematic.
    // In those cases, we want admins to have the options to set exportUrl
    // to a specific PDF file, and then let user download that file.
    if (
      typeof this.props.options.exportUrl === "string" &&
      this.props.options.exportUrl.endsWith(".pdf")
    ) {
      document.location = this.props.options.exportUrl;
    } else {
      this.setState({
        loading: true,
        url: false,
      });
      this.props.parent.informativeModel.print(this.state.chapter, (url) => {
        if (undefined !== this.props.options.exportRoot) {
          url = this.props.options.exportRoot + url;
        }
        if (url === "error") {
          this.setState({
            loading: false,
            url: false,
            alert: true,
          });
        } else {
          this.setState({
            url: url,
            loading: false,
          });
        }
      });
    }
  };

  toggleLegend = () => {
    this.setState({
      displayLegend: !this.state.displayLegend,
    });
  };

  renderChapters() {
    const { tocVisible } = this.state;
    return (
      <DivToc>
        {this.state.loading && <LinearProgressLoader />}
        <Alert
          open={this.state.alert}
          dialogTitle="Felmeddelande"
          message="Det gick inte att skriva ut för tillfället, försök igen senare"
          parent={this}
        />
        <DivTocHeader>
          <Button variant="contained" onClick={this.toggleToc}>
            Innehållsförteckning
            <MenuIconRightIcon color="primary" />
          </Button>
          <IconButtonButton
            aria-label="Skriv ut"
            onClick={this.print}
            size="large"
          >
            <PrintIcon color="primary" title="Skriv ut" />
          </IconButtonButton>
        </DivTocHeader>
        <div>
          {this.state.url && (
            <Button
              ref="anchor"
              href={this.state.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                this.setState({
                  url: "",
                });
              }}
            >
              <ArrowDownwardIcon /> Ladda ner
            </Button>
          )}
        </div>
        {tocVisible ? (
          <DivTocContainer component="nav">
            {this.renderTocItem(this.toc || [])}
          </DivTocContainer>
        ) : null}
      </DivToc>
    );
  }

  renderLegend() {
    return (
      this.state.displayLegend && (
        <div>
          <Typography variant="overline">Teckenförklaring</Typography>
          <DivLegend>
            {this.props.parent.informativeModel
              .getLegends(this.state.chapter)
              .map((legend, i) => {
                return (
                  <DivLegendItem key={i}>
                    <div>{legend.caption}</div>
                    <img key={i} alt="toc" src={legend.url} />
                  </DivLegendItem>
                );
              })}
          </DivLegend>
        </div>
      )
    );
  }

  render() {
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
        <DivLayers>{this.renderLayerItems(this.state.chapter)}</DivLayers>
        {this.renderLegend()}
        <DivContent>{this.renderContent()}</DivContent>
      </div>
    );
  }
}

export default withSnackbar(Informative);
