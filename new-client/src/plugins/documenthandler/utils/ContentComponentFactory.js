import React from "react";
import Link from "@material-ui/core/Link";
import MapIcon from "@material-ui/icons/Map";
import DescriptionIcon from "@material-ui/icons/Description";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import clsx from "clsx";
import Button from "@material-ui/core/Button";

import Typography from "@material-ui/core/Typography";
import TextArea from "../documentWindow/TextArea";
import CardMedia from "@material-ui/core/CardMedia";
import { makeStyles } from "@material-ui/core/styles";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const useStyles = makeStyles((theme) => ({
  documentImage: {
    marginBottom: theme.spacing(0.5),
    objectFit: "contain",
    objectPosition: "left",
  },
  popupActivatedImage: {
    marginBottom: theme.spacing(1),
    cursor: "pointer",
  },
  naturalDocumentImageProportions: {
    marginTop: theme.spacing(1),
    width: "100%",
  },
  imageText: {
    marginBottom: theme.spacing(1),
  },

  linkIcon: {
    fontSize: getIconSizeFromFontSize(theme.typography.body1.fontSize),
    marginRight: theme.spacing(1),
    verticalAlign: "middle",
  },
  typography: {
    overflowWrap: "break-word",
    marginBottom: theme.spacing(1),
  },
  ulIcon: {
    fontSize: "1rem",
  },
  listRoot: {
    color: "black",
  },
  startIcon: {
    marginRight: 0,
  },
  linkButton: {
    padding: 0,
    color: theme.palette.info.main,
  },
}));

const getFormattedComponentFromTag = (tag) => {
  const childNodes = [...tag.childNodes];
  return childNodes.map((child, index) => {
    return <React.Fragment key={index}>{renderChild(child)}</React.Fragment>;
  });
};

const getIconSizeFromFontSize = (fontSizeBody) => {
  let format = "rem";
  if (fontSizeBody.search("px") > -1) {
    format = "px";
  }
  let index = fontSizeBody.search(format);
  let size = fontSizeBody.substring(0, index);
  return `${size * 1.7}${format}`;
};

export const Paragraph = ({ pTag }) => {
  const classes = useStyles();
  return (
    <Typography className={classes.typography} variant="body1">
      {getFormattedComponentFromTag(pTag)}
    </Typography>
  );
};

export const ULComponent = ({ ulComponent }) => {
  let children = [...ulComponent.children];
  const classes = useStyles();
  return (
    <List component="nav">
      {children.map((listItem, index) => {
        return (
          <ListItem key={index}>
            <ListItemIcon styles={{ root: classes.listRoot }}>
              <FiberManualRecordIcon
                className={classes.ulIcon}
              ></FiberManualRecordIcon>
            </ListItemIcon>
            <ListItemText
              primary={getFormattedComponentFromTag(listItem)}
            ></ListItemText>
          </ListItem>
        );
      })}
    </List>
  );
};

export const OLComponent = ({ olComponent }) => {
  let children = [...olComponent.children];
  const classes = useStyles();
  return (
    <List component="nav">
      {children.map((listItem, index) => {
        return (
          <ListItem key={index}>
            <ListItemText
              styles={{ root: classes.listRoot }}
              primary={`${index + 1}.`}
            ></ListItemText>
            <ListItemText
              primary={getFormattedComponentFromTag(listItem)}
            ></ListItemText>
          </ListItem>
        );
      })}
    </List>
  );
};

export const Heading = ({ headingTag }) => {
  const classes = useStyles();

  return (
    <>
      <Typography
        className={classes.typography}
        variant={headingTag.tagName.toLowerCase()}
      >
        {getFormattedComponentFromTag(headingTag)}
      </Typography>
    </>
  );
};

const getTextArea = (tag) => {
  const children = [...tag.childNodes];
  let textAreaContentArray = children.map((element, index) => {
    return <React.Fragment key={index}>{renderChild(element)}</React.Fragment>;
  });

  const backgroundColor = tag.attributes.getNamedItem("data-background-color")
    ?.value;
  const dividerColor = tag.attributes.getNamedItem("data-divider-color")?.value;

  return (
    <TextArea
      backgroundColor={backgroundColor}
      dividerColor={dividerColor}
      textAreaContentArray={textAreaContentArray}
    ></TextArea>
  );
};

export const BlockQuote = ({ blockQuoteTag }) => {
  if (blockQuoteTag.attributes.getNamedItem("data-text-section")) {
    return getTextArea(blockQuoteTag);
  } else {
    return null;
  }
};

export const Figure = ({ figureTag }) => {
  const children = [...figureTag.children];
  return children.map((element, index) => {
    return (
      <React.Fragment key={index}>{element.callback(element)}</React.Fragment>
    );
  });
};

const isPopupAllowedForImage = (imgTag) => {
  return imgTag.attributes.getNamedItem("data-popup") == null ? false : true;
};

const getImageStyle = (image, classes) => {
  let className = image.popup
    ? clsx(
        classes.documentImage,
        classes.naturalDocumentImageProportions,
        classes.popupActivatedImage
      )
    : clsx(classes.documentImage, classes.naturalDocumentImageProportions);

  if (image.height && image.width) {
    if (image.popup) {
      className = clsx(classes.documentImage, classes.popupActivatedImage);
    } else {
      className = clsx(classes.documentImage, classes.popupActivatedImage);
    }
  }
  return className;
};

/**
 * The render function for the img-tag.
 * @param {string} imgTag The img-tag.
 *
 * @memberof Contents
 */
export const Img = ({ imgTag, localObserver }) => {
  const classes = useStyles();
  const image = {
    caption: imgTag.attributes.getNamedItem("data-caption")?.value,
    popup: isPopupAllowedForImage(imgTag),
    source: imgTag.attributes.getNamedItem("data-source")?.value,
    url: imgTag.attributes.getNamedItem("src")?.value,
    altValue: imgTag.attributes.getNamedItem("alt")?.value,
    height: imgTag.attributes.getNamedItem("data-image-height")?.value,
    width: imgTag.attributes.getNamedItem("data-image-width")?.value,
  };

  let onClickCallback = image.popup
    ? () => {
        localObserver.publish("image-popup", image);
      }
    : null;

  return (
    <>
      <CardMedia
        onClick={onClickCallback}
        alt={image.altValue}
        component="img"
        style={
          image.height && image.width
            ? { height: image.height, width: image.width }
            : null
        }
        className={getImageStyle(image, classes)}
        image={image.url}
      />
      {getImageDescription(image, classes)}
    </>
  );
};

const getImageDescription = (image, classes) => {
  return (
    <>
      <Typography className={classes.imageText} variant="subtitle2">
        {image.caption}
      </Typography>
      <Typography variant="subtitle2">{image.source}</Typography>
    </>
  );
};

export const Strong = (strongTag) => {
  const children = [...strongTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <strong>{renderChild(child)}</strong>
        </React.Fragment>
      );
    });
    return array;
  }
  return [<strong>{strongTag.textContent}</strong>];
};
export const Underline = (uTag) => {
  const children = [...uTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <u>{renderChild(child)}</u>
        </React.Fragment>
      );
    });
    return array;
  }
  return [<u>{uTag.textContent}</u>];
};
export const Italic = (emTag) => {
  const children = [...emTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <em>{renderChild(child)}</em>
        </React.Fragment>
      );
    });
    return array;
  }
  return [<em>{emTag.textContent}</em>];
};

/**
 * The render function for the br-tag.
 * @param {string} brTag The br-tag.
 *
 * @memberof htmlToMaterialUiParser
 */
export const LineBreak = () => {
  return <br />;
};

const getLinkDataPerType = (attributes) => {
  const {
    0: mapLink,
    1: headerIdentifier,
    2: documentLink,
    3: externalLink,
  } = [
    "data-maplink",
    "data-header-identifier",
    "data-document",
    "data-link",
  ].map((attributeKey) => {
    return attributes.getNamedItem(attributeKey)?.value;
  });

  return { mapLink, headerIdentifier, documentLink, externalLink };
};

/**
 * Callback used to render different link-components from a-elements
 * @param {Element} aTag a-element.
 * @returns {<Link>} Returns materialUI component <Link>
 *
 * @memberof Contents
 */
export const CustomLink = ({ aTag, localObserver }) => {
  const classes = useStyles();

  const getExternalLink = (externalLink) => {
    return (
      <Button
        color="default"
        startIcon={<OpenInNewIcon className={classes.linkIcon}></OpenInNewIcon>}
        classes={{ startIcon: classes.startIcon }}
        target="_blank"
        component="a"
        className={classes.linkButton}
        key="external-link"
        href={externalLink}
      >
        {getFormattedComponentFromTag(aTag)}
      </Button>
    );
  };
  const getMapLink = (aTag, mapLink) => {
    return (
      <Button
        color="default"
        className={classes.linkButton}
        startIcon={<MapIcon className={classes.linkIcon}></MapIcon>}
        classes={{ startIcon: classes.startIcon }}
        target="_blank"
        href={externalLink}
        key="map-link"
        component="button"
        onClick={() => {
          localObserver.publish("fly-to", mapLink);
        }}
      >
        {getFormattedComponentFromTag(aTag)}
      </Button>
    );
  };
  const getDocumentLink = (headerIdentifier, documentLink) => {
    return (
      <Button
        color="default"
        className={classes.linkButton}
        startIcon={
          <DescriptionIcon className={classes.linkIcon}></DescriptionIcon>
        }
        style={{ padding: 0 }}
        classes={{ startIcon: classes.startIcon }}
        href="#"
        key="document-link"
        component="button"
        underline="hover"
        onClick={() => {
          console.log("ONCLICK");
          localObserver.publish("set-active-document", {
            documentName: documentLink,
            headerIdentifier: headerIdentifier,
          });
        }}
      >
        {getFormattedComponentFromTag(aTag)}
      </Button>
    );
  };

  const {
    mapLink,
    headerIdentifier,
    documentLink,
    externalLink,
  } = getLinkDataPerType(aTag.attributes);

  if (documentLink) {
    return getDocumentLink(headerIdentifier, documentLink);
  }

  if (mapLink) {
    return getMapLink(aTag, mapLink, localObserver);
  }

  if (externalLink) {
    return getExternalLink(externalLink);
  }

  return null;
};

const renderChild = (child) => {
  if (child.nodeType === TEXT_NODE) {
    return child.data;
  }

  if (child.nodeType === ELEMENT_NODE) {
    return child.callback(child);
  }
};
