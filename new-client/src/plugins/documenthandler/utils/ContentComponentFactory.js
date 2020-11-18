import React from "react";
import MapIcon from "@material-ui/icons/Map";
import DescriptionIcon from "@material-ui/icons/Description";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import clsx from "clsx";
import Box from "@material-ui/core/Box";
import TextArea from "../documentWindow/TextArea";
import { makeStyles } from "@material-ui/core/styles";
import { Button, Typography, CardMedia, List } from "@material-ui/core";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const useStyles = makeStyles((theme) => ({
  documentImage: {
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
  imageInformationWrapper: {
    marginBottom: theme.spacing(1),
  },

  startIcon: {
    marginLeft: theme.spacing(0),
  },
  linkIcon: {
    verticalAlign: "middle",
  },
  heading: {
    marginBottom: theme.spacing(1),
  },
  media: {
    width: "auto",
    maxWidth: "100%",
  },
  typography: {
    overflowWrap: "break-word",
    marginBottom: theme.spacing(1),
  },
  ulList: {
    listStyle: "initial",
    listStylePosition: "inside",
    padding: theme.spacing(0),
    marginBottom: theme.spacing(1),
  },
  listItemMargin: {
    marginLeft: theme.spacing(1),
  },
  olList: {
    listStyle: "decimal",
    listStylePosition: "inside",
    padding: theme.spacing(0),
    marginBottom: theme.spacing(1),
  },
  bottomMargin: {
    marginBottom: theme.spacing(1),
  },
  linkButton: {
    padding: theme.spacing(0),
    color: theme.palette.info.main,
  },
}));

const renderChild = (child) => {
  if (child.nodeType === TEXT_NODE) {
    return child.data;
  }

  if (child.nodeType === ELEMENT_NODE) {
    return child.callback(child);
  }
};

const getFormattedComponentFromTag = (tag) => {
  const childNodes = [...tag.childNodes];
  return childNodes.map((child, index) => {
    return <React.Fragment key={index}>{renderChild(child)}</React.Fragment>;
  });
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
    <List className={classes.ulList} component="ul">
      {children.map((listItem, index) => {
        return (
          <Typography
            key={index}
            component="li"
            className={classes.typography}
            variant="body1"
          >
            {getFormattedComponentFromTag(listItem)}{" "}
          </Typography>
        );
      })}
    </List>
  );
};

export const OLComponent = ({ olComponent }) => {
  let children = [...olComponent.children];
  const classes = useStyles();
  return (
    <List className={classes.olList} component="ol">
      {children.map((listItem, index) => {
        return (
          <Typography
            variant="body1"
            component="li"
            className={classes.typography}
            key={index}
          >
            <span className={classes.listItemMargin}>
              {getFormattedComponentFromTag(listItem)}
            </span>
          </Typography>
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
        className={classes.heading}
        variant={headingTag.tagName.toLowerCase()}
      >
        {getFormattedComponentFromTag(headingTag)}
      </Typography>
    </>
  );
};

const getTextArea = (tag, defaultColors) => {
  const children = [...tag.childNodes];
  let textAreaContentArray = children.map((element, index) => {
    return <React.Fragment key={index}>{renderChild(element)}</React.Fragment>;
  });

  const backgroundColor =
    tag.attributes.getNamedItem("data-background-color")?.value ||
    defaultColors?.textAreaBackgroundColor;

  const dividerColor =
    tag.attributes.getNamedItem("data-divider-color")?.value ||
    defaultColors?.textAreaDividerColor;

  return (
    <TextArea
      backgroundColor={backgroundColor}
      dividerColor={dividerColor}
      textAreaContentArray={textAreaContentArray}
    ></TextArea>
  );
};

export const BlockQuote = ({ blockQuoteTag, defaultColors }) => {
  if (blockQuoteTag.attributes.getNamedItem("data-text-section")) {
    return getTextArea(blockQuoteTag, defaultColors);
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

/**
 * The render function for the img-tag.
 * @param {string} imgTag The img-tag.
 *
 * @memberof Contents
 */
export const Img = ({ imgTag, localObserver }) => {
  const classes = useStyles();

  const isPopupAllowedForImage = (imgTag) => {
    return imgTag.attributes.getNamedItem("data-popup") == null ? false : true;
  };

  const getImageStyle = (image) => {
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
        className = clsx(classes.documentImage);
      }
    }
    return className;
  };

  const getImageDescription = (image) => {
    return (
      <Box className={classes.imageInformationWrapper}>
        {image.caption && (
          <Typography variant="subtitle2">{image.caption}</Typography>
        )}
        {image.source && (
          <Typography variant="subtitle2" className={classes.imageText}>
            {image.source}
          </Typography>
        )}
      </Box>
    );
  };
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
        classes={{ media: classes.media }}
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

export const Strong = ({ strongTag }) => {
  const children = [...strongTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <strong key={index}>{renderChild(child)}</strong>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <strong>{strongTag.textContent}</strong>
    </React.Fragment>,
  ];
};
export const Underline = ({ uTag }) => {
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
  return [
    <React.Fragment key={0}>
      <u>{uTag.textContent}</u>
    </React.Fragment>,
  ];
};
export const Italic = ({ emTag }) => {
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
  return [
    <React.Fragment key={0}>
      <em>{emTag.textContent}</em>
    </React.Fragment>,
  ];
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

/**
 * Callback used to render different link-components from a-elements
 * @param {Element} aTag a-element.
 * @returns {<Link>} Returns materialUI component <Link>
 *
 * @memberof Contents
 */
export const CustomLink = ({ aTag, localObserver, bottomMargin }) => {
  const classes = useStyles();

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

  const getExternalLink = (externalLink) => {
    return (
      <Button
        color="default"
        startIcon={<OpenInNewIcon className={classes.linkIcon}></OpenInNewIcon>}
        classes={{ startIcon: classes.startIcon }}
        target="_blank"
        component="a"
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
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
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
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
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
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
