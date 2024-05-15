import React from "react";
import { withTheme } from "@emotion/react";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

class TableOfContents extends React.PureComponent {
  state = {
    titlesAndLevels: [],
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
      let menuDoc = menu[key];
      if (menuDoc.document) {
        //get the corresponding chapters from allDocuments.
        let jsonDoc = allDocuments.find(
          (doc) => doc.documentFileName === menuDoc.document
        );
        //add the chapters to our doc in the menuState.
        menu[key].chapters = jsonDoc.chapters;
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

    let levelsToShow = document?.tocChapterLevels || 100;
    let indentationLevel = 0;
    let level = 0;

    /*If a document is under a menu parent, push the level up, as the levelsToShow property
    in the document configuration is specific to that document, and does not take into account. that having
    a parent document may change it's level*/
    if (document.allParents.length) {
      level++;
      levelsToShow++;
      indentationLevel += document.allParents.length;
    }

    //Add the menu document title if it is a menu parent that just holds other documents;
    if (!document.document) {
      this.titlesAndLevels.push({
        title: document.title,
        level: indentationLevel,
        chosenForPrint: document.chosenForPrint,
      });
    }

    //add the documents chapters to the table of contents.
    if (document.chapters) {
      level++;
      if (level <= levelsToShow) {
        document.chapters.forEach((chapter) => {
          this.titlesAndLevels.push({
            title: chapter.header,
            level: indentationLevel,
          });
          this.setChapterTitlesAndLevels(
            chapter,
            levelsToShow,
            level + 1,
            indentationLevel + 1
          );
        });
      }
    }
  };

  setChapterTitlesAndLevels = (
    chapter,
    levelsToShow,
    level,
    indentationLevel
  ) => {
    if (chapter.chapters && level <= levelsToShow) {
      chapter.chapters.forEach((subChapter) => {
        this.titlesAndLevels.push({
          title: subChapter.header,
          level: indentationLevel,
        });
        this.setChapterTitlesAndLevels(
          subChapter,
          levelsToShow,
          level + 1,
          indentationLevel + 1
        );
      });
    }
  };

  render() {
    const { titlesAndLevels } = this.state;
    return (
      <Grid container sx={{ pageBreakAfter: "always" }}>
        <Typography variant="h4" gutterBottom={true}>
          Innehållsförteckning
        </Typography>
        <List style={{ width: "100%" }} disablePadding>
          {titlesAndLevels.map((document, index) => {
            return document.chosenForPrint ? (
              <ListItem
                key={index}
                dense={true}
                sx={{
                  paddingLeft: 1 + document.level * 3,
                }}
              >
                <ListItemText>{document.title}</ListItemText>
              </ListItem>
            ) : (
              <ListItem
                dense={true}
                key={index}
                sx={{
                  paddingLeft: 1 + document.level * 3,
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

export default withTheme(TableOfContents);
