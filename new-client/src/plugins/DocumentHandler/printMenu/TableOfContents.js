import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";

const styles = (theme) => ({
  listItem: { overflowWrap: "break-word" },
});

class TableOfContents extends React.PureComponent {
  state = {
    titlesAndLevels: [],
    maxLevelsToShow: 10,
  };

  constructor(props) {
    super(props);
    this.titlesAndLevels = [];
    this.previousGroupHeader = false;
  }

  componentDidMount = () => {
    const { documentMenuState, allDocuments, mode } = this.props;

    const tocStructure = this.createTocStructure(
      documentMenuState,
      allDocuments,
      mode
    );
    Object.keys(tocStructure).forEach((key) => {
      this.setTitlesAndLevels(tocStructure[key], mode);
    });

    this.setState({ titlesAndLevels: this.titlesAndLevels });
  };

  createTocStructure(documentMenuState, allDocuments) {
    let menu = { ...documentMenuState };
    //add the chapters from all documents onto the documentMenuState
    Object.keys(menu).forEach((key) => {
      let ourDoc = menu[key];
      if (ourDoc.document) {
        //get the corresponding chapters from allDocuments.
        let docInAllDocs = allDocuments.find(
          (doc) => doc.documentFileName === ourDoc.document
        );
        //add the chapters to our doc in the menuState.
        menu[key].chapters = docInAllDocs.chapters;
      }
    });
    return menu;
  }

  setTitlesAndLevels = (document, mode) => {
    //If the chosen config for table of contents is to only include printed documents in the toc. skip the document if it's not chosen for print.
    if (mode === "partial") {
      if (document.chosenForPrint !== true) {
        return;
      }
    }

    //add the document to the table of contents.
    let level = 0;
    if (document.allParents.length) {
      level++;
    }

    this.titlesAndLevels.push({
      title: document.title,
      level: level,
      chosenForPrint: document.chosenForPrint,
    });

    //add the documents chapters to the table of contents.
    if (document.chapters) {
      level++;
      if (level <= this.state.maxLevelsToShow) {
        document.chapters.forEach((chapter) => {
          this.titlesAndLevels.push({
            title: chapter.header,
            level: level,
          });
          this.setChapterTitlesAndLevels(chapter, level);
        });
      }
    }
  };

  setChapterTitlesAndLevels = (chapter, level) => {
    level++;
    if (chapter.chapters) {
      chapter.chapters.forEach((subChapter) => {
        this.titlesAndLevels.push({
          title: subChapter.header,
          level: level,
        });
        this.setChapterTitlesAndLevels(subChapter, level);
      });
    }
  };

  render() {
    const { titlesAndLevels } = this.state;
    const { theme } = this.props;
    return (
      <Grid container>
        <Typography variant="h4" gutterBottom={true}>
          Innehållsförteckning
        </Typography>
        <List style={{ width: "100%" }} disablePadding>
          {titlesAndLevels.map((document, index) => {
            return document.chosenForPrint ? (
              <ListItem
                key={index}
                dense={true}
                style={{
                  paddingLeft:
                    theme.spacing(1) + theme.spacing(document.level * 3),
                }}
              >
                <ListItemText>{document.title}</ListItemText>
              </ListItem>
            ) : (
              <ListItem
                dense={true}
                key={index}
                style={{
                  paddingLeft:
                    theme.spacing(1) + theme.spacing(document.level * 3),
                }}
              >
                <ListItemText>{document.title}</ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Grid>
    );
  }
}

export default withStyles(styles)(withTheme(TableOfContents));
