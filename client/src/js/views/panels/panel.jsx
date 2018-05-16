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

var panelIs = undefined;

var PanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      instruction: ''
    };
  },

  clickSwipeBtn: function () {
    if ($('#sidebar-toggle-swipe')[0].classList.contains('sidebar-open-after')) {
      $('.container-swipe-menu').removeClass('open-sidebar');
      $('#sidebar-toggle-swipe').removeClass('sidebar-open-after');
      $('#sidebar-toggle-swipe').addClass('sidebar-close-after');
    } else {
      $('.container-swipe-menu').addClass('open-sidebar');
      $('#sidebar-toggle-swipe').removeClass('sidebar-close-after');
      $('#sidebar-toggle-swipe').addClass('sidebar-open-after');
    }
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    if (isMobile && mobilAnpassningEnabled) {
      $('.swipe-area').swipe({
        swipeStatus: function (event, phase, direction, distance, duration, fingers) {
          if (phase == 'move' && direction == 'right') {
            panelIs = true;
            $('.container-swipe-menu').addClass('open-sidebar');
            $('#sidebar-toggle-swipe').removeClass('sidebar-close-after');
            $('#sidebar-toggle-swipe').addClass('sidebar-open-after');
          }
          if (phase == 'move' && direction == 'left') {
            panelIs = false;
            $('.container-swipe-menu').removeClass('open-sidebar');
            $('#sidebar-toggle-swipe').removeClass('sidebar-open-after');
            $('#sidebar-toggle-swipe').addClass('sidebar-close-after');
          }
        }
      });
    }
    $('#instructionsText').hide();
  },

  openInstruction: function () {
    var element = $('#instructionsText');
    element.toggle();
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    if (!isMobile || !mobilAnpassningEnabled) {
      var instructionBtn;
      var instructionTxt;
      if (typeof this.props.instruction !== 'undefined' && this.props.instruction !== null && this.props.instruction.length > 0) {
        instructionBtn = (
          <button onClick={() => this.openInstruction()} className='btn-info' id='instructionBox1' ><img src={infologo} /></button>
        );
        instructionTxt = (
          <div className='panel-body-instruction' id='instructionsText' dangerouslySetInnerHTML={{__html: this.props.instruction}} />
        );
      }

      var navPanel = document.getElementById('navigation-panel');
      navPanel.style.width = '417px';

      var toggleIcon = this.props.minimized ? 'fa fa-plus' : 'fa fa-minus';
      var closeIcon = this.props.minimized ? 'fa fa-plus' : 'fa fa-times';
      toggleIcon += ' pull-right clickable panel-close';
      closeIcon += ' pull-right clickable panel-close';
      return (
        <div className='panel navigation-panel-inner'>
          <div className='panel-heading'>
            <span>{this.props.title}</span>
            {instructionBtn}
            <i className={closeIcon} onClick={() => {
              if (this.props.onUnmountClicked) {
                this.props.onUnmountClicked();
              }
            }} />
            <i className={toggleIcon} onClick={this.props.onCloseClicked} />
            {instructionTxt}
          </div>
          <div className='panel-body'>
            {this.props.children}
          </div>
        </div>
      );
    } else {
      // mobile

      var navPanel = document.getElementById('navigation-panel');
      navPanel.style.width = '50px';

      var toggleIcon = this.props.minimized ? 'fa fa-plus' : 'fa fa-minus';
      var closeIcon = this.props.minimized ? 'fa fa-plus' : 'fa fa-times';
      toggleIcon += ' pull-right clickable panel-close';
      closeIcon += ' pull-right clickable panel-close';

      var containerClass = 'container-swipe-menu open-sidebar';
      var sidebarClass = 'sidebar-open-after';
      if (typeof firstTimeOpenedPanelMobile === 'undefined' || firstTimeOpenedPanelMobile < 2) {
        if (typeof firstTimeOpenedPanelMobile === 'undefined') {
          firstTimeOpenedPanelMobile = 0;
        } else {
          firstTimeOpenedPanelMobile += 1;
        }
        containerClass = 'container-swipe-menu';
        sidebarClass = 'sidebar-close-after';
      }

      var instructionBtn;
      var instructionTxt;
      if (typeof this.props.instruction !== 'undefined' && this.props.instruction !== null && this.props.instruction.length > 0) {
        instructionBtn = (
          <i onClick={() => this.openInstruction()} className='btn-info' id='instructionBox1' ><img src={infologo} /></i>
        );
        instructionTxt = (
          <div className='panel-body-instruction' id='instructionsText' dangerouslySetInnerHTML={{__html: this.props.instruction}} />
        );
      }

      return (
        <div className={containerClass}>
          <div id='sidebar-swipe'>
            <div className='panel navigation-panel-inner'>
              <div className='panel-heading'>
                <span>{this.props.title}</span>
                {instructionBtn}
                <i className={closeIcon} onClick={() => {
                  if (this.props.onUnmountClicked) {
                    this.props.onUnmountClicked();
                  }
                }} />
                {instructionTxt}
              </div>
              <div className='panel-body'>
                {this.props.children}
              </div>
            </div>
          </div>
          <div className='main-content-swipe'>
            <div className='swipe-area' />
            <a data-toggle='.container-swipe-menu' id='sidebar-toggle-swipe' className={sidebarClass} onClick={() => { this.clickSwipeBtn(); }}>
              <span className='bar-swipe' />
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
