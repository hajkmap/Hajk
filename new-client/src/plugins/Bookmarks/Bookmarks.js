import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import BookmarksModel from "./BookmarksModel";
import BookmarksView from "./BookmarksView";
import BookmarksIcon from "@mui/icons-material/Bookmarks";

// Constants
import { STORAGE_KEY } from "./constants";

/**
 * @summary Main class for the Bookmarks plugin.
 * @description The Bookmarks plugin allows the user to store bookmarks
 * in localStorage. A bookmark contains the map, x,y, zoom level, visible layers etc.
 *
 * @class Bookmarks
 * @extends {React.Component}
 */

const Bookmarks = (props) => {
  const [bookmarksModel] = React.useState(
    () =>
      new BookmarksModel({
        app: props.app,
        map: props.map,
        storageKey: STORAGE_KEY,
      })
  );
  const [bookmarks, setBookmarks] = React.useState(bookmarksModel.bookmarks);

  // Read bookmarks from local storage on component mount
  React.useEffect(() => {
    bookmarksModel.readFromStorage();
    setBookmarks(bookmarksModel.bookmarks);
  }, [bookmarksModel]);

  return (
    <BaseWindowPlugin
      {...props}
      type="Bookmarks"
      custom={{
        icon: <BookmarksIcon />,
        title: "Bokmärken",
        description: "Användarens bokmärken",
        height: 450,
        width: 400,
      }}
    >
      <BookmarksView
        model={bookmarksModel}
        bookmarks={bookmarks}
        globalObserver={props.app.globalObserver}
      />
    </BaseWindowPlugin>
  );
};

Bookmarks.propTypes = {
  app: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  options: PropTypes.object,
};

Bookmarks.defaultProps = {
  options: {},
};

export default Bookmarks;
