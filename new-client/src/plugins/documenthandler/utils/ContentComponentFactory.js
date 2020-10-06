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

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

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

export default class ContentComponentFactory {
  constructor(settings) {
    this.settings = settings;
  }

  getULComponent = (ulComponent) => {
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
                primary={this.getFormattedComponentFromTag(listItem)}
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  getOLComponent = (olComponent) => {
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
                primary={this.getFormattedComponentFromTag(listItem)}
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  getTextArea = (tag) => {
    const children = [...tag.childNodes];
    let textAreaContentArray = children.map((element, index) => {
      return (
        <React.Fragment key={index}>{this.renderChild(element)}</React.Fragment>
      );
    });

    const backgroundColor = tag.attributes.getNamedItem("data-background-color")
      ?.value;
    const dividerColor = tag.attributes.getNamedItem("data-divider-color")
      ?.value;

    return (
      <TextArea
        backgroundColor={backgroundColor}
        dividerColor={dividerColor}
        textAreaContentArray={textAreaContentArray}
      ></TextArea>
    );
  };

  getBlockQuoteComponents = (tag) => {
    if (tag.attributes.getNamedItem("data-text-section")) {
      return this.getTextArea(tag);
    } else {
      return null;
    }
  };

  getFigureComponents = (figureTag) => {
    const children = [...figureTag.children];

    return children.map((element, index) => {
      return (
        <React.Fragment key={index}>{element.callback(element)}</React.Fragment>
      );
    });
  };

  isPopupAllowedForImage = (imgTag) => {
    return imgTag.attributes.getNamedItem("data-popup") == null ? false : true;
  };

  getImageStyle = (image) => {
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
  getImgCardComponent = (imgTag) => {
    const image = {
      caption: imgTag.attributes.getNamedItem("data-caption")?.value,
      popup: this.isPopupAllowedForImage(imgTag),
      source: imgTag.attributes.getNamedItem("data-source")?.value,
      url: imgTag.attributes.getNamedItem("src")?.value,
      altValue: imgTag.attributes.getNamedItem("alt")?.value,
      height: imgTag.attributes.getNamedItem("data-image-height")?.value,
      width: imgTag.attributes.getNamedItem("data-image-width")?.value,
    };

    let onClickCallback = image.popup
      ? () => {
          console.log("sdasdas");
          this.settings.localObserver.publish("image-popup", image);
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
          className={this.getImageStyle(image)}
          image={image.url}
        />
        {this.getImageDescription(image)}
      </>
    );
  };

  getImageDescription = (image) => {
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

  getFormattedComponentFromTag = (tag) => {
    const childNodes = [...tag.childNodes];
    return childNodes.map((child, index) => {
      return (
        <React.Fragment key={index}>{this.renderChild(child)}</React.Fragment>
      );
    });
  };

  /**
   * The render function for the p-tag.
   * @param {string} pTag The p-tag.
   *
   * @memberof Contents
   */
  getPtagTypographyComponents = (pTag) => {
    return (
      <Typography className={clsx(styles.typography)} variant="body1">
        {this.getFormattedComponentFromTag(pTag)}
      </Typography>
    );
  };

  getStrongTagTypographyComponents = (strongTag) => {
    const children = [...strongTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <strong>{this.renderChild(child)}</strong>
          </React.Fragment>
        );
      });
      return array;
    }
    return [<strong>{strongTag.textContent}</strong>];
  };
  getUnderlineTagTypographyComponents = (uTag) => {
    const children = [...uTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <u>{this.renderChild(child)}</u>
          </React.Fragment>
        );
      });
      return array;
    }
    return [<u>{uTag.textContent}</u>];
  };
  getItalicTagTypographyComponents = (emTag) => {
    const children = [...emTag.childNodes];
    let array = [];
    if (children.length > 0) {
      children.forEach((child, index) => {
        array.push(
          <React.Fragment key={index}>
            <em>{this.renderChild(child)}</em>
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
  getBrtagTypographyComponent = () => {
    return <br />;
  };

  getHeadingTypographyComponents = (tag) => {
    return (
      <>
        <Typography
          className={clsx(styles.typography)}
          variant={tag.tagName.toLowerCase()}
        >
          {this.getFormattedComponentFromTag(tag)}
        </Typography>
      </>
    );
  };

  getExternalLink = (aTag, externalLink) => {
    return (
      <Link
        href={externalLink}
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
            fontSize: getIconSizeFromFontSize(this.settings.theme),
            marginRight: this.settings.theme.spacing(0.5),
            verticalAlign: "middle",
          }}
        ></OpenInNewIcon>
        {this.getFormattedComponentFromTag(aTag)}
      </Link>
    );
  };

  getLinkDataPerType = (attributes) => {
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

  getDocumentLink = (headerIdentifier, documentLink, aTag) => {
    const { localObserver } = this.settings;
    return (
      <>
        <Link
          href="#"
          component="button"
          underline="hover"
          variant="body1"
          onClick={() => {
            localObserver.publish("show-header-in-document", {
              documentName: documentLink,
              headerIdentifier: headerIdentifier,
            });
          }}
        >
          <DescriptionIcon
            style={{
              fontSize: getIconSizeFromFontSize(this.settings.theme),
              marginRight: this.settings.theme.spacing(0.5),
              verticalAlign: "middle",
            }}
          ></DescriptionIcon>
          {this.getFormattedComponentFromTag(aTag)}
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
  getLinkComponent = (aTag) => {
    const {
      mapLink,
      headerIdentifier,
      documentLink,
      externalLink,
    } = this.getLinkDataPerType(aTag.attributes);

    if (documentLink) {
      return this.getDocumentLink(headerIdentifier, documentLink, aTag);
    }

    if (mapLink) {
      return this.getMapLink(aTag, mapLink);
    }

    if (externalLink) {
      return this.getExternalLink(aTag, externalLink);
    }
  };

  getFormattedComponentFromTag = (tag) => {
    const childNodes = [...tag.childNodes];
    return childNodes.map((child, index) => {
      return (
        <React.Fragment key={index}>{this.renderChild(child)}</React.Fragment>
      );
    });
  };

  renderChild = (child) => {
    if (child.nodeType === TEXT_NODE) {
      return child.data;
    }

    if (child.nodeType === ELEMENT_NODE) {
      return child.callback(child);
    }
  };

  getMapLink = (aTag, mapLink) => {
    const { localObserver } = this.settings;
    return (
      <Link
        href="#"
        variant="body2"
        component="button"
        onClick={() => {
          console.log("CLICKING");
          localObserver.publish("fly-to", mapLink);
        }}
      >
        <MapIcon
          style={{
            fontSize: getIconSizeFromFontSize(this.settings.theme),
            marginRight: this.settings.theme.spacing(0.5),
            verticalAlign: "middle",
          }}
        ></MapIcon>
        {this.getFormattedComponentFromTag(aTag)}
      </Link>
    );
  };
}
