import React from "react";
import PrintListItem from "./PrintListItem";
import PrintList from "./PrintList";
import Collapse from "@material-ui/core/Collapse";

class PrintSubList extends React.PureComponent {
  state = {
    open: false
  };

  toggleCollapseSubMenu = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { chapter, handleCheckboxChange, checked } = this.props;
    return (
      <>
        <PrintListItem
          hasSubChapters
          chapter={chapter}
          expandedSubChapter={this.state.open}
          onClick={this.toggleCollapseSubMenu}
          handleCheckboxChange={handleCheckboxChange}
          checked={checked}
          {...this.props}
        ></PrintListItem>
        <Collapse
          aria-expanded={this.state.open}
          id="subchapter"
          in={this.state.open}
          timeout="auto"
        >
          <PrintList chapters={chapter.chapters}></PrintList>
        </Collapse>
      </>
    );
  }
}

export default PrintSubList;
