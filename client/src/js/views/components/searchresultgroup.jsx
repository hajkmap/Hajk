// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

var shiftIsDown = false;
var ctrlIsDown = false;

var isMobile = () => document.body.clientWidth <= 600;

window.onkeydown = (e) => {
  shiftIsDown = e.shiftKey;
  ctrlIsDown = e.ctrlKey;
}

window.onkeyup  = (e) => {
  shiftIsDown = e.shiftKey;
  ctrlIsDown = e.ctrlKey;
}

/**
 * @class
 */
SearchResultGroup = {

  componentDidMount: function () {

    var groups = $(ReactDOM.findDOMNode(this)).find('.group');

    groups.click(function() {
      $(this).next().toggleClass('hidden');
    });

    if (Array.isArray(this.props.model.get('selectedIndices'))) {
      _.each(groups, group => {
        var items = this.props.model.get('selectedIndices').filter(item => group.id === item.group);
        if (items.length > 0) {
          items.forEach(item => {

            var nth = item.index + 1
            ,   elem = $(group).next().find('div:nth-child(' + nth + ')');

            elem.addClass('selected');
          });
        }
      });
    }
  },

  handleClick: function (hit, index, event) {

    var element = $(event.target)
    ,   parent = $(ReactDOM.findDOMNode(this))
    ,   group = parent.find('.group');

    var item = {
      index: index,
      hits: this.props.result.hits,
      hit: hit,
      id: group[0].id
    };

    if (!ctrlIsDown) {
      $('.search-results').find('.selected').each(function (e) {
        $(this).removeClass('selected');
      });
      this.props.model.focus(item);
    } else {
      if (element.hasClass('selected')) {
        this.props.model.detach(item);
      } else {
        this.props.model.append(item);
      }
    }

    if (element.hasClass('selected'))
      element.removeClass('selected');
    else
      element.addClass('selected');

    if (isMobile()) {
      if (this.props.parentView.props.navigationPanel) {
        this.props.parentView.props.navigationPanel.minimize();
      } else {
        this.props.parentView.minimize();
      }
    }

  },

  render: function () {

    var id = this.props.id
    ,   groupStyleClass = this.props.numGroups === 1 ? "" : "hidden"
    ;

    return (
      <div>
        <div className="group" id={this.props.id}>{this.props.result.layer}
          <span className="label">{this.props.result.hits.length}</span>
        </div>
        <div className={groupStyleClass}>
          {
            this.props.result.hits.map((hit, i) => {
              function getTitle(property) {
                if (Array.isArray(property)) {
                  return property.map(item => hit.getProperties()[item]).join(', ');
                } else {
                  return hit.getProperties()[property] || property
                }
              }
              var hitId = "hit-" + i + "-" + id
              ,   title = getTitle(this.props.result.displayName)
              ,   index = i
              ;
              return (<div key={hitId} index={i} onClick={this.handleClick.bind(this, hit, i)}>{title}</div>);
            })
          }
        </div>
      </div>
    );
  }
};

module.exports = React.createClass(SearchResultGroup);
