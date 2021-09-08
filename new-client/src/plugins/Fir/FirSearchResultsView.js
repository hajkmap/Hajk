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
import Pagination from "@material-ui/lab/Pagination";

class FirView extends React.PureComponent {
  state = {
    resultsExpanded: true,
    open: false,
    results: { list: [] },
    paginatedResults: { list: [] },
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  componentDidMount() {
    let list = [];

    for (let i = 1; i < 101; i++) {
      list.push({
        name: "TESTÄPPLET " + i,
        open: false,
        data: { test: "hejsan" + i },
      });
    }

    list.forEach((item, index) => {
      item.key = "firResult" + index;
    });

    this.setState({ results: { list: list } });

    setTimeout(() => {
      // push to next draw
      this.setPage(1);
    }, 25);
  }

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.itemsPerPage = 10;
  }

  handleItemClick(e, data) {
    data.open = !data.open;
    this.forceUpdate();
  }

  paginationPageCount() {
    return this.state.results.list.length / this.itemsPerPage;
  }

  setPage(p) {
    let start = (p - 1) * this.itemsPerPage;
    let end = p * this.itemsPerPage;
    let list = this.state.results.list.slice(start, end);
    this.setState({ paginatedResults: { list: list } });
  }

  handlePageChange = (e, p) => {
    this.setPage(p);
  };

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
                {this.state.paginatedResults.list.map((data, index) => (
                  <div key={data.key}>
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
              {this.paginationPageCount() > 1 ? (
                <div className={classes.paginationContainer}>
                  <Pagination
                    // showFirstButton
                    // showLastButton
                    // variant="outlined"
                    color="primary"
                    defaultPage={1}
                    count={this.state.results.list.length / this.itemsPerPage}
                    onChange={this.handlePageChange}
                    size="small"
                  />
                </div>
              ) : (
                ""
              )}
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
  paginationContainer: {
    display: "flex",
    justifyContent: "right",
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
});

export default withStyles(styles)(withSnackbar(FirView));
