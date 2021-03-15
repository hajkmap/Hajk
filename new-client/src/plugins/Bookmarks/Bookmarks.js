import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import BookmarksModel from "./BookmarksModel";
import BookmarksView from "./BookmarksView";
import BookmarksIcon from "@material-ui/icons/Bookmarks";

/**
 * @summary Main class for the Bookmarks plugin.
 * @description The Bookmarks plugin allows the user to store bookmarks
 * in localStorage. A bookmark contains the map, x,y, zoom level, visible layers etc.
 *
 * @class Bookmarks
 * @extends {React.PureComponent}
 */
class Bookmarks extends React.PureComponent {
  state = {
    title: "Bokmärken",
    color: null,
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
  };

  constructor(props) {
    super(props);
    this.bookmarksModel = new BookmarksModel({
      app: props.app,
      map: props.map,
    });
  }

  updateCustomProp = (prop, value) => {
    this.setState({ [prop]: value });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Bookmarks"
        custom={{
          icon: <BookmarksIcon />,
          title: this.state.title,
          color: this.state.color,
          description: "Användarens bokmärken",
          height: 450,
          width: 400,
        }}
      >
        <BookmarksView
          model={this.bookmarksModel}
          app={this.props.app}
          updateCustomProp={this.updateCustomProp}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Bookmarks;
