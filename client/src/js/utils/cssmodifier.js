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

function getCSSRule (ruleName) {
  ruleName = ruleName.toLowerCase();
  var rule = undefined;
  if (!document || !document.styleSheets) return;
  Array.prototype.forEach.call(document.styleSheets, styleSheet => {
    try {
      if (!styleSheet.cssRules) return;
      var mathces = Array.prototype.filter.call(styleSheet.cssRules, cssRule =>
        cssRule instanceof CSSStyleRule &&
          cssRule.selectorText.toLowerCase() === ruleName
      );
      if (mathces[mathces.length - 1]) {
        rule = mathces[mathces.length - 1];
      }
    } catch (e) {
      // Firefox throws if the css is loaded from external source.
    }
  });
  return rule;
}

module.exports = {
  configure: function (config) {
    if (!config.secondaryColor || !config.primaryColor) {
      return;
    }
    var panelHeader = getCSSRule('.navigation-panel-inner > .panel-heading');

    var panelHeaderItalic = getCSSRule('.navigation-panel-inner > .panel-heading i');

    var navigationPanelInner = getCSSRule('.navigation-panel-inner');

    var dl = getCSSRule('dl');
    var dt = getCSSRule('dt');

    var btnPrimary = getCSSRule('.btn-primary');
    var btnPrimaryFocus = getCSSRule('.btn-primary:focus');
    var btnPrimaryHover = getCSSRule('.btn-primary:hover');
    var btnPrimaryActive = getCSSRule('.btn-primary:active');
    var btnPrimaryActiveHover = getCSSRule('.btn-primary:active:hover');
    var btnPrimaryActiveHoverIE = getCSSRule('.btn-primary:hover:active');

    var btnMain = getCSSRule('.btn-main');
    var btnMainFocus = getCSSRule('.btn-main:focus');
    var btnMainHover = getCSSRule('.btn-main:hover');
    var btnMainActive = getCSSRule('.btn-main:active');
    var btnMainActiveHover = getCSSRule('.btn-main:active:hover');
    var btnMainActiveHoverIE = getCSSRule('.btn-main:hover:active');

    var drawToolsSelected = getCSSRule('.draw-tools li.selected');
    var informationBlanketHeader = getCSSRule('.information #blanket #container #header');
    var informationBlanketContainer = getCSSRule('.information #blanket #container');

    var olControlButton = getCSSRule('.ol-control button');
    var olControlButtonHover = getCSSRule('.ol-control button:hover');
    var olControlButtonFocus = getCSSRule('.ol-control button:focus');
    var olControlButtonActive = getCSSRule('.ol-control button:active');

    var mapScaleBar = getCSSRule('#map-scale-bar .ol-scale-line');
    var mapScaleBarInner = getCSSRule('#map-scale-bar .ol-scale-line-inner');
    var mapScaleText = getCSSRule('.map-scale .map-scale-text');

    var searchbarInputField = getCSSRule('#searchbar-input-field');
    var searchbarSearchButton = getCSSRule('#searchbar-search-button');

    if (panelHeader) {
      panelHeader.style.backgroundColor = config.primaryColor;
      panelHeader.style.borderColor = config.primaryColor;
      panelHeader.style.color = config.secondaryColor;
    } else {
      console.error('Wat');
    }

    if (panelHeaderItalic) {
      panelHeaderItalic.style.color = config.secondaryColor;
    }
    if (navigationPanelInner) {
      navigationPanelInner.style.borderRight = '1px solid ' + config.primaryColor;
    }
    if (dl) {
      dl.style.border = '1px solid ' + config.primaryColor;
    }
    if (dt) {
      dt.style.backgroundColor = config.primaryColor;
      dt.style.color = config.secondaryColor;
    }
    if (btnPrimary) {
      btnPrimary.style.backgroundColor = config.primaryColor;
      btnPrimary.style.zIndex = 2;
      btnPrimary.style.color = config.secondaryColor;
    }
    if (btnPrimaryFocus) {
      btnPrimaryFocus.style.backgroundColor = config.primaryColor;
      btnPrimaryFocus.style.color = config.secondaryColor;
    }
    if (btnPrimaryHover) {
      btnPrimaryHover.style.backgroundColor = config.primaryColor;
      btnPrimaryHover.style.color = config.secondaryColor;
    }
    if (btnPrimaryActive) {
      btnPrimaryActive.style.backgroundColor = config.primaryColor;
      btnPrimaryActive.style.color = config.secondaryColor;
    }
    if (btnPrimaryActiveHover) {
      btnPrimaryActiveHover.style.backgroundColor = config.primaryColor;
      btnPrimaryActiveHover.style.color = config.secondaryColor;
    }

    if (btnPrimaryActiveHoverIE) {
      btnPrimaryActiveHoverIE.style.backgroundColor = config.primaryColor;
      btnPrimaryActiveHoverIE.style.color = config.secondaryColor;
    }

    if (btnMain) {
      btnMain.style.backgroundColor = config.primaryColor;
      btnMain.style.zIndex = 2;
      btnMain.style.color = config.secondaryColor;
    }
    if (btnMainFocus) {
      btnMainFocus.style.backgroundColor = config.primaryColor;
      btnMainFocus.style.color = config.secondaryColor;
    }
    if (btnMainHover) {
      btnMainHover.style.backgroundColor = config.primaryColor;
      btnMainHover.style.color = config.secondaryColor;
    }
    if (btnMainActive) {
      btnMainActive.style.backgroundColor = config.primaryColor;
      btnMainActive.style.color = config.secondaryColor;
    }
    if (btnMainActiveHover) {
      btnMainActiveHover.style.backgroundColor = config.primaryColor;
      btnMainActiveHover.style.color = config.secondaryColor;
    }

    if (btnMainActiveHoverIE) {
      btnMainActiveHoverIE.style.backgroundColor = config.primaryColor;
      btnMainActiveHoverIE.style.color = config.secondaryColor;
    }

    if (drawToolsSelected) {
      drawToolsSelected.style.backgroundColor = config.primaryColor;
    }

    if (informationBlanketHeader) {
      informationBlanketHeader.style.backgroundColor = config.primaryColor;
      informationBlanketHeader.style.color = config.secondaryColor;
    }
    if (informationBlanketContainer) {
      informationBlanketContainer.style.borderColor = config.primaryColor;
    }
    if (olControlButton) {
      olControlButton.style.backgroundColor = config.primaryColor;
      olControlButton.style.color = config.secondaryColor;
    }
    if (olControlButtonHover) {
      olControlButtonHover.style.backgroundColor = config.primaryColor;
      olControlButtonHover.style.color = config.secondaryColor;
    }
    if (olControlButtonFocus) {
      olControlButtonFocus.style.backgroundColor = config.primaryColor;
      olControlButtonFocus.style.color = config.secondaryColor;
    }
    if (olControlButtonActive) {
      olControlButtonActive.style.backgroundColor = config.primaryColor;
      olControlButtonActive.style.color = config.secondaryColor;
    }
    if (mapScaleBar) {
      mapScaleBar.style.backgroundColor = config.primaryColor;
    }
    if (mapScaleBarInner) {
      mapScaleBarInner.style.color = config.secondaryColor;
    }
    if (mapScaleText) {
      mapScaleText.style.backgroundColor = config.primaryColor;
      mapScaleText.style.color = config.secondaryColor;
    }    
    if (searchbarInputField) {
      searchbarInputField.style.borderColor = config.primaryColor;
    }
    if (searchbarSearchButton) {
      searchbarSearchButton.style.backgroundColor = config.primaryColor;
      searchbarSearchButton.style.color = config.color;
    }
  }
};
