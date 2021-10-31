import React from "react";
import { KeyBindingUtil } from "draft-js";
import DescriptionIcon from "@material-ui/icons/Description";
import MapIcon from "@material-ui/icons/Map";
import LaunchIcon from "@material-ui/icons/Launch";
import Tooltip from "@material-ui/core/Tooltip";

const LinkStrategy = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType().toUpperCase() === "LINK"
    );
  }, callback);
};

const Link = (props) => {
  const data = props.contentState.getEntity(props.entityKey).getData();
  const title = props.children;

  if (data["data-document"]) {
    return (
      <a
        href={data["data-document"]}
        data-document={data["data-document"]}
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
      >
        <DescriptionIcon /> {title}
      </a>
    );
  } else if (data["data-link"]) {
    return (
      <a
        href={data["data-link"]}
        data-link={data["data-link"]}
        data-header-identifier={data["data-header-identifier"]}
      >
        <LaunchIcon /> {title}
      </a>
    );
  } else if (data["data-maplink"]) {
    return (
      <a
        href={data["data-maplink"]}
        data-maplink={data["data-maplink"]}
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MapIcon /> {title}
      </a>
    );
  } else if (data["data-hover"]) {
    return (
      <Tooltip title={data["data-hover"]} placement={"bottom"}>
        <abbr data-hover={data["data-hover"]}>{props.decoratedText}</abbr>
      </Tooltip>
    );
  } else {
    return (
      <a
        href={data.url}
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
      >
        {title}
      </a>
    );
  }
};

export const addLinkPlugin = {
  keyBindingFn(event, { getEditorState }) {
    const editorState = getEditorState();
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) {
      return;
    }

    if (KeyBindingUtil.hasCommandModifier(event) && event.which === 75) {
      return "add-link";
    }
  },

  decorators: [
    {
      strategy: LinkStrategy,
      component: Link,
    },
  ],
};

export default addLinkPlugin;
