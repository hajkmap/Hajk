import React, { useEffect, useState } from "react";
import { List, ListItem, Link } from "@material-ui/core";

/*
 * @summary Small component to render a shortcut-menu high up in the DOM for screen readers
 * @description The purpose of the component is to make the site more accessible by giving screen readers
 * the option to skip "forward" to any interesting sections instead of reading the DOM from the top
 *
 * Using globalobserver anyone can add shortcuts for screen readers high up in the DOM
 * publish array of objects [{title : {title of shortcut}, link : {link to nodeId}}] to core.addSrShortcuts
 * to add shortcuts.
 *
 * @class SrShortcuts
 */
const SrShortcuts = ({ globalObserver }) => {
  const [shortcuts, setShortcuts] = useState([]);
  useEffect(() => {
    globalObserver.subscribe("core.addSrShortcuts", addShortCuts);
  });

  const addShortCuts = (shortcutsArray) => {
    setShortcuts([...shortcuts, ...shortcutsArray]);
  };

  return (
    <List className="sr-only">
      {shortcuts.map((shortcut) => {
        return (
          <ListItem key={shortcut.link}>
            <Link href={shortcut.link}>{shortcut.title}</Link>
          </ListItem>
        );
      })}
    </List>
  );
};

export default SrShortcuts;
