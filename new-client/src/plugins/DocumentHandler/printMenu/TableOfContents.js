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
  };

  constructor(props) {
    super(props);
    this.titlesAndLevels = [];
  }

  componentDidMount = () => {
    const { documents, mode } = this.props;
    Object.keys(documents).forEach((key) => {
      this.setTitlesAndLevels(documents[key]);
    });

    if (mode === "partial") {
      this.filterTitlesAndLevels();
    }

    this.setState({ titlesAndLevels: this.titlesAndLevels });
  };

  filterTitlesAndLevels() {
    //TODO - Add logic to keep the parent if children are chosen.
    const filteredTable = this.titlesAndLevels.filter(
      (document) => document.chosenForPrint
    );
    this.titlesAndLevels = filteredTable;
  }

  setTitlesAndLevels = (document) => {
    this.titlesAndLevels.push({
      title: document.title,
      level: document.level,
      chosenForPrint: document.chosenForPrint,
    });
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
                disabled
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
