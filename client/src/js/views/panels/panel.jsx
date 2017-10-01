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
// https://github.com/hajkmap/Hajk

/**
 * @class
 */
var PanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {};
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    if (document.body.clientWidth > 600) {


      var navPanel = document.getElementById("navigation-panel");
      navPanel.style.width = "417px";


      var toggleIcon = this.props.minimized ? "fa fa-plus" : "fa fa-minus";
      var closeIcon = this.props.minimized ? "fa fa-plus" : "fa fa-times";
      toggleIcon += " pull-right clickable panel-close";
      closeIcon += " pull-right clickable panel-close";
      return (
        <div className="panel navigation-panel-inner">
          <div className="panel-heading">
            <span>{this.props.title}</span>
            <i className={closeIcon} onClick={() => {
              if (this.props.onUnmountClicked) {
                this.props.onUnmountClicked();
              }
            }}></i>
            <i className={toggleIcon} onClick={this.props.onCloseClicked}></i>
          </div>
          <div className="panel-body">
            {this.props.children}
          </div>
        </div>
      );
    } else {
      // mobile

    var navPanel = document.getElementById("navigation-panel");
    navPanel.style.width = "50px";

      $(document).ready(function () {
        $("[data-toggle]").click(function () {
          var toggle_el = $(this).data("toggle");
          $(toggle_el).toggleClass("open-sidebar-swipe");
        });

      });

      $(".swipe-area").swipe({
        swipeStatus: function (event, phase, direction, distance, duration, fingers) {
          console.log('swiping');
          if (phase == "move" && direction == "right") {
            $(".container-swipe-menu").addClass("open-sidebar");
            return false;
          }
          if (phase == "move" && direction == "left") {
            $(".container-swipe-menu").removeClass("open-sidebar");
            return false;
          }
        }
      });


    var toggleIcon = this.props.minimized ? "fa fa-plus" : "fa fa-minus";
    var closeIcon = this.props.minimized ? "fa fa-plus" : "fa fa-times";
    toggleIcon += " pull-right clickable panel-close";
    closeIcon += " pull-right clickable panel-close";

      return (
        <div className="container-swipe-menu">
          <div id="sidebar-swipe">
            <div className="panel navigation-panel-inner">
              <div className="panel-heading">
                <span>{this.props.title}</span>
                <i className={closeIcon} onClick={() => {
                  if (this.props.onUnmountClicked) {
                    this.props.onUnmountClicked();
                  }
                }}></i>
                <i className={toggleIcon} onClick={this.props.onCloseClicked}></i>
              </div>
              <div className="panel-body">
                {this.props.children}
              </div>
            </div>
          </div>
          <div className="main-content-swipe">
            <div className="swipe-area"></div>
            <a href="#" data-toggle=".container-swipe-menu" id="sidebar-toggle-swipe">
              <span className="bar-swipe"></span>
              <span className="bar-swipe"></span>
              <span className="bar-swipe"></span>
            </a>
          </div>
        </div>);
      }


    }
  };

/**
 * PanelView module.<br>
 * Use <code>require('views/panel')</code> for instantiation.
 * @module PanelView-module
 * @returns {PanelView}
 */
module.exports = React.createClass(PanelView);
