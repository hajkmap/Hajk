import React from "react";
import List from "@material-ui/core/List";
import PrintSubList from "./PrintSubList";
import PrintListItem from "./PrintListItem";
import PrintListItemNew from "./PrintListItemNew";

class PrintList extends React.Component {
  // renderPrintListItem = (chapter, type) => {
  //   const { handleCheckboxChange, localObserver } = this.props;
  //   return (
  //     <PrintListItemNew
  //       type={type}
  //       chapter={chapter} //we are not using this at the moment.
  //       checked={chapter.chosenForPrint} //we are not using this at the moment.
  //       localObserver={localObserver}
  //       handleCheckboxChange={handleCheckboxChange} //we are not using this at the moment.
  //     ></PrintListItemNew>
  //   );
  // };

  // renderSubMenu = (chapter) => {
  //   const { handleCheckboxChange, localObserver, documentMenu } = this.props;
  //   return (
  //     <PrintSubList
  //       documentMenu={documentMenu}
  //       chapter={chapter}
  //       subChapters={chapter.chapters}
  //       checked={chapter.chosenForPrint}
  //       handleCheckboxChange={handleCheckboxChange}
  //       localObserver={localObserver}
  //     ></PrintSubList>
  //   );
  // };

  // getSubChapters = (chapters, headerIdentifier) => {
  //   return chapters.filter((chapter) => chapter.parent === headerIdentifier);
  // };

  // hasSubChapters = (chapter) => {
  //   if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // };

  getMenuItemType = (item, type) => {
    return (
      <PrintListItemNew
        {...this.props}
        type={type}
        menu={item.menu}
        icon={item.icon}
        id={item.id}
        level={item.level}
        color={item.color}
        title={item.title}
        itemRef={item.itemRef}
        subMenuItems={this.getSubMenuItems(item)}
        expanded={item.expandedSubMenu}
        colored={item.colored}
        selected={item.selected}
        chosenForPrint={item.chosenForPrint}
        handleTogglePrint={this.props.handleTogglePrint}
      ></PrintListItemNew>
    );
  };

  getSubMenuItems = (item) => {
    return item.menuItemIds.reduce((subMenuItems, subItemId) => {
      const subItem = Object.values(this.props.documentMenu).find((i) => {
        return i.id === subItemId;
      });
      if (subItem.menuItemIds.length > 0) {
        subMenuItems = [...subMenuItems, ...this.getSubMenuItems(subItem)];
      }
      return [...subMenuItems, subItem];
    }, []);
  };

  renderMenuItem = (item, id) => {
    if (item.menuItemIds && item.menuItemIds.length > 0) {
      return this.getMenuItemType(item, "submenu");
    } else if (item.document) {
      return this.getMenuItemType(item, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, "maplink");
    }
  };

  //map chapters into their respective menu object.

  render() {
    const { chapters, documentMenu, level } = this.props;
    return (
      <List style={{ width: "100%" }} disablePadding>
        {Object.values(documentMenu)
          .filter((item) => {
            return item.level === this.props.level;
          })
          .map((item) => {
            return (
              <React.Fragment key={item.id}>
                {this.renderMenuItem(item, item.id)}
              </React.Fragment>
            );
          })}
      </List>
    );
  }
}

export default PrintList;
