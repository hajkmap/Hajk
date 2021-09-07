import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Badge from "@material-ui/core/Badge";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Typography } from "@material-ui/core";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import FirSearchResultItemView from "./FirSearchResultItemView";

class FirView extends React.PureComponent {
  state = {
    resultsExpanded: true,
    open: false,
    results: { list: [] },
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  componentDidMount() {
    let list = [
      { name: "DRUVÄPPLET 1", open: false, data: { test: "hejsan1" } },
      { name: "DRUVÄPPLET 2", open: false, data: { test: "hejsan2" } },
      { name: "DRUVÄPPLET 3", open: false, data: { test: "hejsan3" } },
      { name: "DRUVÄPPLET 4", open: false, data: { test: "hejsan4" } },
    ];
    this.setState({ results: { list: list } });
  }

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  handleItemClick(e, data) {
    data.open = !data.open;
    this.forceUpdate();
  }

  render() {
    const { classes } = this.props;

    return (
      <>
        <Accordion
          expanded={this.state.resultsExpanded}
          className={classes.bottom}
          onChange={() => {
            this.setState({
              resultsExpanded: !this.state.resultsExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Badge
              badgeContent={this.state.results.list.length}
              color="secondary"
              max={999}
              classes={{ badge: classes.badge }}
            >
              <Typography className={classes.heading}>Sökresultat</Typography>
            </Badge>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block", padding: 0 }}>
            <div>
              <List dense={true} component="nav" className={classes.listRoot}>
                {this.state.results.list.map((data, index) => (
                  <div key={"firSearchResult" + index}>
                    {index > 0 ? <Divider /> : ""}
                    <ListItem
                      button
                      onClick={(e) => {
                        this.handleItemClick(e, data);
                      }}
                    >
                      <ListItemText primary={data.name} />
                    </ListItem>
                    <Collapse in={data.open} timeout="auto" unmountOnExit>
                      <Divider />
                      <div className={classes.resultItemData}>
                        <FirSearchResultItemView
                          model={data}
                          app={this.props.app}
                          localObserver={this.localObserver}
                        />
                      </div>
                    </Collapse>
                  </div>
                ))}
              </List>
            </div>
          </AccordionDetails>
        </Accordion>
        <div className={classes.spacer}></div>
      </>
    );
  }
}

const styles = (theme) => ({
  heading: {
    fontWeight: 500,
  },
  badge: {
    top: "11px",
    right: "-26px",
  },
  spacer: {
    height: theme.spacing(2),
  },
  resultItemData: {
    padding: theme.spacing(2),
  },
});

export default withStyles(styles)(withSnackbar(FirView));
