import React from "react";
import { withStyles, withTheme } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";

const styles = (theme) => ({
  listItem: { overflowWrap: "break-word" },
});

class TableOfContents extends React.PureComponent {
  state = {
    titlesAndLevels: [],
  };

  constructor(props) {
    super(props);
    this.titlesAndLevels = [];
  }

  componentDidMount = () => {
    const { chapters } = this.props;
    chapters.forEach((chapter) => {
      this.setTitlesAndLevels(chapter);
    });
    this.setState({ titlesAndLevels: this.titlesAndLevels });
  };

  setTitlesAndLevels = (chapter) => {
    if (chapter.chosenForPrint) {
      this.titlesAndLevels.push({
        title: chapter.header,
        level: chapter.level,
      });
      if (chapter.chapters) {
        chapter.chapters.forEach((subChapter) => {
          this.setTitlesAndLevels(subChapter);
        });
      }
    }
  };

  render() {
    const { titlesAndLevels } = this.state;
    const { theme } = this.props;
    return (
      <List style={{ width: "100%" }} disablePadding>
        {titlesAndLevels.map((chapter, index) => {
          return (
            <ListItem
              key={index}
              style={{
                paddingLeft:
                  theme.spacing(1) + theme.spacing(chapter.level * 3),
              }}
            >
              <ListItemText>{chapter.title}</ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  }
}

export default withStyles(styles)(withTheme(TableOfContents));
