import React, { useState } from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import BookmarksModel from "./BookmarksModel";
import BookmarksView from "./BookmarksView";
import BookmarksIcon from "@mui/icons-material/Bookmarks";

/**
 * @summary Main class for the Bookmarks plugin.
 * @description The Bookmarks plugin allows the user to store bookmarks
 * in localStorage. A bookmark contains the map, x,y, zoom level, visible layers etc.
 *
 * @class Bookmarks
 * @extends {React.Component}
 */

const Bookmarks = ({ app, map, options }) => {
  const [title, setTitle] = useState("Bokmärken");
  const [color, setColor] = useState(null);
  const globalObserver = app.globalObserver;
  const bookmarksModel = BookmarksModel({ app, map });

  const updateCustomProp = (prop, value) => {
    if (prop === "title") setTitle(value);
    else if (prop === "color") setColor(value);
    else console.error("Unknown prop: " + prop);
  };

  return (
    <BaseWindowPlugin
      {...{ app, map, options }}
      type="Bookmarks"
      custom={{
        icon: <BookmarksIcon />,
        title: title,
        color: color,
        description: "Användarens bokmärken",
        height: 450,
        width: 400,
      }}
    >
      <BookmarksView
        globalObserver={globalObserver}
        model={bookmarksModel}
        app={app}
        updateCustomProp={updateCustomProp}
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
