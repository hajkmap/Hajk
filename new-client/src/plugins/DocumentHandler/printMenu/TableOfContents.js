import React from "react";
import withStyles from "@mui/styles/withStyles";
import { withTheme } from "@emotion/react";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import List from "@mui/material/List";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";

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
    this.titlesAndLevels.push({
      title: chapter.header,
      level: chapter.level,
      chosenForPrint: chapter.chosenForPrint,
    });
    if (chapter.chapters) {
      chapter.chapters.forEach((subChapter) => {
        this.setTitlesAndLevels(subChapter);
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
          {titlesAndLevels.map((chapter, index) => {
            return chapter.chosenForPrint ? (
              <ListItem
                key={index}
                dense={true}
                style={{
                  paddingLeft: theme.spacing(1 + chapter.level * 3),
                }}
              >
                <ListItemText>{chapter.title}</ListItemText>
              </ListItem>
            ) : (
              <ListItem
                disabled
                dense={true}
                key={index}
                style={{
                  paddingLeft: theme.spacing(1 + chapter.level * 3),
                }}
              >
                <ListItemText>{chapter.title}</ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Grid>
    );
  }
}

export default withStyles(styles)(withTheme(TableOfContents));
