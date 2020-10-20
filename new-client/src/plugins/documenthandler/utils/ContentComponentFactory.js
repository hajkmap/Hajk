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
import Typography from "@material-ui/core/Typography";
import TextArea from "../documentWindow/TextArea";
import CardMedia from "@material-ui/core/CardMedia";
import { styled } from "@material-ui/core/styles";
import { withStyles, makeStyles } from "@material-ui/core/styles";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const useStyles = makeStyles({
  root: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    border: 0,
    borderRadius: 3,
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
    color: "white",
    height: 48,
    padding: "0 30px",
  },
});

const getFormattedComponentFromTag = (tag) => {
  const childNodes = [...tag.childNodes];
  return childNodes.map((child, index) => {
    return <React.Fragment key={index}>{renderChild(child)}</React.Fragment>;
  });
};

const getIconSizeFromFontSize = (theme) => {
  let fontSizeBody = theme.typography.body1.fontSize;
  let format = "rem";
  if (fontSizeBody.search("px") > -1) {
    format = "px";
  }
  let index = fontSizeBody.search(format);
  let size = fontSizeBody.substring(0, index);
  return `${size * 1.7}${format}`;
};

const styles = {
  documentImage: {
    objectFit: "contain",
    objectPosition: "left",
  },
  popupActivatedImage: {
    cursor: "pointer",
  },
  naturalDocumentImageProportions: {
    width: "100%",
  },

  typography: {
    overflowWrap: "break-word",
    marginTop: 8,
    marginBot: 20,
  },

  listRoot: {
    // maxWidth: theme.spacing(3),
    // minWidth: theme.spacing(3),
    color: "black",
  },
  chapter: {
    cursor: "text",
    // marginTop: theme.spacing(4),
  },
};

export const Paragraph = ({ pTag }) => {
  const classes = useStyles();
  console.log(classes, "classes");
  return (
    <Typography className={clsx(styles.typography)} variant="body1">
      {getFormattedComponentFromTag(pTag)}
    </Typography>
  );
};

export const ULComponent = ({ ulComponent }) => {
  let children = [...ulComponent.children];
  return (
    <List component="nav">
      {children.map((listItem, index) => {
        return (
          <ListItem key={index}>
            <ListItemIcon styles={{ root: clsx(styles.listRoot) }}>
              <FiberManualRecordIcon
                style={{ fontSize: "1em" }}
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

export const OLComponent = (olComponent) => {
  let children = [...olComponent.children];
  return (
    <List component="nav">
      {children.map((listItem, index) => {
        return (
          <ListItem key={index}>
            <ListItemText
              styles={{ root: clsx(styles.listRoot) }}
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

export const Heading = (tag) => {
  return (
    <>
      <Typography
        className={clsx(styles.typography)}
        variant={tag.tagName.toLowerCase()}
      >
        {getFormattedComponentFromTag(tag)}
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

export const BlockQuote = (tag) => {
  if (tag.attributes.getNamedItem("data-text-section")) {
    return getTextArea(tag);
  } else {
    return null;
  }
};

export const Figure = (figureTag) => {
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

const getImageStyle = (image) => {
  let className = image.popup
    ? clsx(
        styles.documentImage,
        styles.naturalDocumentImageProportions,
        styles.popupActivatedImage
      )
    : clsx(styles.documentImage, styles.naturalDocumentImageProportions);

  if (image.height && image.width) {
    if (image.popup) {
      className = clsx(styles.documentImage, styles.popupActivatedImage);
    } else {
      className = clsx(styles.documentImage, styles.popupActivatedImage);
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
export const Img = (imgTag) => {
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
        console.log("sdasdas");
        settings.localObserver.publish("image-popup", image);
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
        className={getImageStyle(image)}
        image={image.url}
      />
      {getImageDescription(image)}
    </>
  );
};

const getImageDescription = (image) => {
  return (
    <>
      <Typography className={clsx(styles.typography)} variant="subtitle2">
        {image.caption}
      </Typography>
      <Typography className={clsx(styles.typography)} variant="subtitle2">
        {image.source}
      </Typography>
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
const getBrtagTypographyComponent = () => {
  return <br />;
};

const getExternalLink = (aTag, externalLink) => {
  return (
    <Link
      href={externalLink}
      key="external-link"
      target="_blank"
      style={{
        display: "flex",
        textAlign: "left",
        alignItems: "center",
      }}
      rel="noopener"
      variant="body2"
    >
      <OpenInNewIcon
        style={{
          fontSize: getIconSizeFromFontSize(settings.theme),
          marginRight: settings.theme.spacing(0.5),
          verticalAlign: "middle",
        }}
      ></OpenInNewIcon>
      {getFormattedComponentFromTag(aTag)}
    </Link>
  );
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

const getDocumentLink = (headerIdentifier, documentLink, aTag) => {
  const { localObserver } = settings;
  return (
    <>
      <Link
        href="#"
        key="document-link"
        component="button"
        underline="hover"
        variant="body1"
        onClick={() => {
          localObserver.publish("set-active-document", {
            documentName: documentLink,
            headerIdentifier: headerIdentifier,
          });
        }}
      >
        <DescriptionIcon
          style={{
            fontSize: getIconSizeFromFontSize(settings.theme),
            marginRight: settings.theme.spacing(0.5),
            verticalAlign: "middle",
          }}
        ></DescriptionIcon>
        {getFormattedComponentFromTag(aTag)}
      </Link>
    </>
  );
};

/**
 * Callback used to render different link-components from a-elements
 * @param {Element} aTag a-element.
 * @returns {<Link>} Returns materialUI component <Link>
 *
 * @memberof Contents
 */
const Link = (aTag) => {
  const {
    mapLink,
    headerIdentifier,
    documentLink,
    externalLink,
  } = getLinkDataPerType(aTag.attributes);

  if (documentLink) {
    return getDocumentLink(headerIdentifier, documentLink, aTag);
  }

  if (mapLink) {
    return getMapLink(aTag, mapLink);
  }

  if (externalLink) {
    return getExternalLink(aTag, externalLink);
  }
};

const renderChild = (child) => {
  if (child.nodeType === TEXT_NODE) {
    return child.data;
  }

  if (child.nodeType === ELEMENT_NODE) {
    return child.callback(child);
  }
};

const getMapLink = (aTag, mapLink) => {
  const { localObserver } = settings;
  return (
    <Link
      key="map-link"
      href="#"
      variant="body2"
      component="button"
      onClick={() => {
        localObserver.publish("fly-to", mapLink);
      }}
    >
      <MapIcon
        style={{
          fontSize: getIconSizeFromFontSize(settings.theme),
          marginRight: settings.theme.spacing(0.5),
          verticalAlign: "middle",
        }}
      ></MapIcon>
      {getFormattedComponentFromTag(aTag)}
    </Link>
  );
};

class ContentComponentFactory {
  constructor(settings) {
    settings = settings;
  }
}

export default ContentComponentFactory;
