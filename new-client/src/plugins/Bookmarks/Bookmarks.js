import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import BookmarksModel from "./BookmarksModel";
import BookmarksView from "./BookmarksView";
import Observer from "react-event-observer";
import BookmarksIcon from "@mui/icons-material/Bookmarks";

/**
 * @summary Main class for the Bookmarks plugin.
 * @description The Bookmarks plugin allows the user to store bookmarks
 * in localStorage. A bookmark contains the map, x,y, zoom level, visible layers etc.
 *
 * @class Bookmarks
 * @extends {React.Component}
 */

const Bookmarks = (props) => {
  const [state, setState] = React.useState({ title: "Bokmärken", color: null });
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  const [localObserver] = React.useState(Observer());
  const [bookmarksModel] = React.useState(
    () =>
      new BookmarksModel({
        app: props.app,
        map: props.map,
      })
  );
  const [bookmarks, setBookmarks] = React.useState(bookmarksModel.bookmarks);

  // Read bookmarks from local storage on component mount
  React.useEffect(() => {
    bookmarksModel.readFromStorage();
    setBookmarks(bookmarksModel.bookmarks);
  }, [bookmarksModel]);

  // Listen for updates to bookmarks in local storage
  React.useEffect(() => {
    const updateBookmarks = () => {
      bookmarksModel.readFromStorage();
      setBookmarks(bookmarksModel.bookmarks);
    };
    window.addEventListener("storage", updateBookmarks);
    return () => window.removeEventListener("storage", updateBookmarks);
  }, [bookmarksModel]);

  // Called when the plugin is hidden
  const onWindowHide = () => {
    setPluginShown(false);
  };

  // Called when the plugin is shown
  const onWindowShow = () => {
    setPluginShown(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="Bookmarks"
      custom={{
        icon: <BookmarksIcon />,
        title: state.title,
        color: state.color,
        description: "Användarens bokmärken",
        height: 450,
        width: 400,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <BookmarksView
        model={bookmarksModel}
        bookmarks={bookmarks}
        app={props.app}
        localObserver={localObserver}
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
