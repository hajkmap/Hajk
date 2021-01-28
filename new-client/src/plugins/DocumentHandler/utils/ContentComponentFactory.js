import React from "react";
import MapIcon from "@material-ui/icons/Map";
import DescriptionIcon from "@material-ui/icons/Description";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import clsx from "clsx";
import Box from "@material-ui/core/Box";
import TextArea from "../documentWindow/TextArea";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Typography,
  CardMedia,
  List,
  ListItem,
  Grid,
} from "@material-ui/core";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

//Had to make some magic to be able to handle list in all different sizes.
//Common problem to get second row indented in a good way and even more difficult
//when you can change the font-size in theme.
const getIndentationValue = (fontSize, multiplier, negative) => {
  let value = multiplier * fontSize.substring(0, fontSize.length - 3);
  return negative ? `${value * -1}rem` : `${value}rem`;
};

const useStyles = makeStyles((theme) => ({
  documentImage: {
    objectFit: "contain",
    objectPosition: "left",
  },

  pictureRightFloatingText: {},
  pictureLeftFloatingText: {},

  floatRight: {
    float: "right",
    marginLeft: theme.spacing(1),
  },
  floatLeft: {
    float: "left",
    marginRight: theme.spacing(1),
  },

  pictureRight: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
  },
  pictureLeft: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
  },
  pictureCenter: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
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
    maxWidth: "100%",
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
  listItemOneDigit: {
    marginRight: getIndentationValue(theme.typography.body1.fontSize, 1), //MAGIC
    padding: theme.spacing(0),
  },
  listItemTwoDigit: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(0),
    marginRight: getIndentationValue(theme.typography.body1.fontSize, 0.5), //MAGIC
  },
  olListItem: {
    padding: theme.spacing(0),
  },
  ulList: {
    listStyle: "initial",
    listStylePosition: "inside",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    marginBottom: theme.spacing(1),
    paddingLeft: getIndentationValue(theme.typography.body1.fontSize, 1.375), //MAGIC
    textIndent: getIndentationValue(
      theme.typography.body1.fontSize,
      1.375,
      true
    ), //MAGIC
    padding: theme.spacing(0),
  },
  olList: {
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
  return (
    <Typography variant="body1">
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
          <ListItem className={classes.olListItem} disableGutters key={index}>
            <Grid wrap="nowrap" container>
              <Grid
                className={clsx(
                  index < 9
                    ? classes.listItemOneDigit
                    : classes.listItemTwoDigit
                )}
                item
              >
                <Typography variant="body1">{`${index + 1}.`}</Typography>
              </Grid>
              <Grid item>
                <Typography className={classes.olListItem} variant="body1">
                  {getFormattedComponentFromTag(listItem)}
                </Typography>
              </Grid>
            </Grid>
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
export const Img = ({ imgTag, localObserver, getUniqueIntegerNumber }) => {
  const classes = useStyles();
  const tagIsPresent = (imgTag, attribute) => {
    return imgTag.attributes.getNamedItem(attribute) == null ? false : true;
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

  const getImagePositionClass = (position) => {
    if (position === "right") {
      return classes.pictureRight;
    }

    if (position === "left") {
      return classes.pictureLeft;
    }

    if (position === "center") {
      return classes.pictureCenter;
    }

    if (position === "floatLeft") {
      return classes.floatLeft;
    }

    if (position === "floatRight") {
      return classes.floatRight;
    }

    return;
  };

  const getImageDescription = (image) => {
    return (
      <Box
        style={{ width: image.width }}
        className={classes.imageInformationWrapper}
        id={image.id}
      >
        {image.caption && (
          <Typography id={`image_${image.captionId}`} variant="subtitle2">
            {image.caption}
          </Typography>
        )}
        {image.source && (
          <Typography
            id={`image_${image.sourceId}`}
            variant="subtitle2"
            className={classes.imageText}
          >
            {image.source}
          </Typography>
        )}
      </Box>
    );
  };

  const image = {
    caption: imgTag.attributes.getNamedItem("data-caption")?.value,
    popup: tagIsPresent(imgTag, "data-image-popup"),
    source: imgTag.attributes.getNamedItem("data-source")?.value,
    url: imgTag.attributes.getNamedItem("src")?.value,
    altValue: imgTag.attributes.getNamedItem("alt")?.value,
    height: imgTag.attributes.getNamedItem("data-image-height")?.value,
    width: imgTag.attributes.getNamedItem("data-image-width")?.value,
    position: imgTag.attributes.getNamedItem("data-image-position")?.value,
    captionId: getUniqueIntegerNumber(),
    sourceId: getUniqueIntegerNumber(),
  };

  let onClickCallback = image.popup
    ? () => {
        localObserver.publish("image-popup", image);
      }
    : null;

  const positioningClass = getImagePositionClass(image.position);

  const getDescribedByAttribute = () => {
    let describedBy = [];
    if (image.caption) {
      describedBy.push(`image_${image.captionId}`);
    }
    if (image.source) {
      describedBy.push(`image_${image.sourceId}`);
    }
    return describedBy.length > 0 ? describedBy.join(" ") : null;
  };

  return (
    <Box data-position={image.position} className={positioningClass}>
      <CardMedia
        onClick={onClickCallback}
        alt={image.altValue}
        classes={{ media: classes.media }}
        aria-describedby={getDescribedByAttribute()}
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
    </Box>
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
