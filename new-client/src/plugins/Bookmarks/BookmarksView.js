import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";
import BookmarkIcon from "@material-ui/icons/Bookmark";
import BookmarkOutlinedIcon from "@material-ui/icons/BookmarkBorderOutlined";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";

class BookmarksView extends React.PureComponent {
  state = {
    name: "",
    error: false,
    helperText: " ",
    bookmarks: [],
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.state.bookmarks = [...this.model.bookmarks];
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  btnAddBookmark = (e) => {
    if (this.state.name.trim() === "") {
      return;
    }

    this.model.addBookmark(this.state.name, true);
    this.setState({
      name: "",
      bookmarks: [...this.model.bookmarks],
    });
    this.checkBookmarkName("");
  };

  btnOpenBookmark(bookmark) {
    this.model.setMapState(bookmark);
  }

  btnDeleteBookmark(bookmark) {
    this.model.removeBookmark(bookmark);
    this.setState({ bookmarks: [...this.model.bookmarks] });
  }

  checkBookmarkName(name) {
    if (name.trim() === "") {
      this.setState({
        error: false,
        helperText: " ",
      });
      return false;
    }

    let exists = this.model.bookmarkWithNameExists(name);

    this.setState({
      error: exists ? true : false,
      helperText: exists
        ? `Namnet upptaget. Ersätt bokmärke "${this.state.name}"?`
        : " ",
    });

    return exists ? false : true;
  }

  handleChange = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleKeyUp(e) {
    this.checkBookmarkName(e.target.value);

    if (e.nativeEvent.keyCode === 13 /* Enter, yes we all know... */) {
      this.btnAddBookmark();
    }
  }

  refreshBookmarks() {
    this.setState({ bookmarks: [...this.model.bookmarks] });
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        <Typography className={classes.intro}>
          Skapa ett bokmärke med kartans synliga lager, aktuella zoomnivå och
          utbredning.
        </Typography>
        <div className={classes.top}>
          <TextField
            placeholder="Skriv bokmärkets namn"
            label="Namn"
            value={this.state.name}
            onChange={this.handleChange("name")}
            onKeyUp={this.handleKeyUp}
            error={this.state.error}
            helperText={this.state.helperText}
            className={classes.input}
          ></TextField>
          <Button
            variant="contained"
            color="primary"
            size="small"
            className={classes.btnAdd}
            startIcon={this.state.error ? null : <AddCircleOutlineIcon />}
            onClick={this.btnAddBookmark}
          >
            {this.state.error ? "Ersätt" : "Lägg till"}
          </Button>
        </div>

        <div className={classes.list}>
          {this.state.bookmarks.map((item, index) => (
            <div className={classes.listItem} key={index + "_" + item.name}>
              <Button
                className={classes.btnBookmark}
                onClick={() => {
                  this.btnOpenBookmark(item);
                }}
              >
                <span className={classes.bookmarkIcon}>
                  <BookmarkOutlinedIcon />
                  <BookmarkIcon className="on" />
                </span>
                <span className={classes.itemName}>{item.name}</span>
              </Button>
              <IconButton
                aria-label="Ta bort"
                className={classes.btnDelete}
                onClick={() => {
                  this.btnDeleteBookmark(item);
                }}
              >
                <DeleteIcon fontSize="small" className={classes.deleteIcon} />
              </IconButton>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

const styles = (theme) => {
  // Tested and verified with dark-theme.
  let iconColor = theme.palette.text.secondary;

  return {
    intro: {
      marginBottom: theme.spacing(1),
    },
    top: {
      display: "flex",
      flexFlow: "row nowrap",
      alignItems: "flex-end",
    },
    input: {
      flex: "0 1 100%",
      height: "0%",
    },
    btnAdd: {
      flex: "1 0 auto",
      whiteSpace: "nowrap",
      height: "0%",
      top: "-22px",
      marginLeft: "10px",
    },
    list: {
      display: "flex",
      flex: "1 0 100%",
      flexFlow: "column nowrap",
      marginTop: "10px",
    },
    listItem: {
      display: "flex",
      position: "relative",
      flex: "1 0 100%",
      justifyContent: "flex-start",
      border: `1px solid ${theme.palette.grey[400]}`,
      transform: "translateZ(1px)",
      borderBottom: "none",
      "&:first-child": {
        borderRadius: "3px 3px 0 0",
      },
      "&:last-child": {
        borderBottom: `1px solid ${theme.palette.grey[400]}`,
        borderRadius: "0 0 3px 3px",
      },
    },
    itemName: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "calc(100% - 71px)",
      textTransform: "none",
    },
    btnBookmark: {
      display: "flex",
      flex: "1 0 100%",
      justifyContent: "flex-start",
      transform: "translateZ(1px)",
      "& svg": {
        color: iconColor,
      },
      "&:hover svg.on": {
        opacity: 0.7,
      },
    },
    bookmarkIcon: {
      display: "inline-block",
      position: "relative",
      width: "24px",
      height: "24px",
      marginRight: "8px",
      "& .on": {
        position: "absolute",
        top: "0",
        left: "0",
        width: "24px",
        height: "24px",
        color: iconColor,
        stoke: iconColor,
        fill: iconColor,
        opacity: 0.001,
        transition: "all 300ms",
      },
    },
    btnDelete: {
      display: "block",
      position: "absolute",
      top: 0,
      right: 0,
      padding: "5px",
      width: "36px",
      height: "36px",
      borderRadius: "100% 0 0 100%",
      "&:hover svg": {
        color: theme.palette.error.dark,
        stoke: theme.palette.error.dark,
        fill: theme.palette.error.dark,
      },
    },
    deleteIcon: {
      display: "block",
      width: "24px",
      height: "24px",
      transition: "all 300ms",
    },
  };
};

export default withStyles(styles)(BookmarksView);
