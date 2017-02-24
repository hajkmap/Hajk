
function getCSSRule(ruleName) {
    ruleName = ruleName.toLowerCase();
    var rule = undefined;
    if (!document || !document.styleSheets) return;
    Array.prototype.find.call(document.styleSheets, styleSheet => {
        try {
          if (!styleSheet.cssRules) return;
          var mathces = Array.prototype.filter.call(styleSheet.cssRules, cssRule =>
            cssRule instanceof CSSStyleRule &&
            cssRule.selectorText.toLowerCase() === ruleName
          );
          rule = mathces[mathces.length - 1];
          if (rule) {
            rule = rule;
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
      var panelHeader = getCSSRule('.navigation-panel-inner > .panel-heading')

      var panelHeaderItalic = getCSSRule('.navigation-panel-inner > .panel-heading i');

      var backgroundSwitcher = getCSSRule('.background-switcher');
      var backgroundSwitcherHeader = getCSSRule('.background-switcher h3');
      var navigationPanelInner = getCSSRule('.navigation-panel-inner');

      var dl = getCSSRule('dl');
      var dt = getCSSRule('dt');

      var btnPrimary = getCSSRule('.btn-primary');
      var btnPrimaryFocus = getCSSRule('.btn-primary:focus');
      var btnPrimaryHover = getCSSRule('.btn-primary:hover');
      var btnPrimaryActive = getCSSRule('.btn-primary:active');
      var btnPrimaryActiveHover = getCSSRule('.btn-primary:active:hover');
      var btnPrimaryActiveHoverIE = getCSSRule('.btn-primary:hover:active');

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

      var searchToolGroup = getCSSRule('.search-tools .group');

      if (panelHeader) {
        panelHeader.style.backgroundColor = config.primaryColor;
        panelHeader.style.borderColor = config.primaryColor;
        panelHeader.style.color = config.secondaryColor;
      }
      if (panelHeaderItalic) {
        panelHeaderItalic.style.color = config.secondaryColor;
      }
      if (backgroundSwitcher) {
        backgroundSwitcher.style.border = "1px solid " + config.primaryColor;
      }
      if (backgroundSwitcherHeader) {
        backgroundSwitcherHeader.style.backgroundColor = config.primaryColor;
        backgroundSwitcherHeader.style.color = config.secondaryColor;
      }
      if (navigationPanelInner) {
        navigationPanelInner.style.borderRight = "1px solid " + config.primaryColor;
      }
      if (dl) {
        dl.style.border = "1px solid " + config.primaryColor;
      }
      if (dt) {
        dt.style.backgroundColor = config.primaryColor;
        dt.style.color = config.secondaryColor;
      }
      if (btnPrimary) {
        btnPrimary.style.backgroundColor = config.primaryColor;
        btnPrimary.style.borderColor = config.secondaryColor;
        btnPrimary.style.zIndex = 2;
        btnPrimary.style.color = config.secondaryColor;
      }
      if (btnPrimaryFocus) {
        btnPrimaryFocus.style.backgroundColor = config.primaryColor;
        btnPrimaryFocus.style.borderColor = config.secondaryColor;
        btnPrimaryFocus.style.color = config.secondaryColor;
      }
      if (btnPrimaryHover) {
        btnPrimaryHover.style.backgroundColor = config.primaryColor;
        btnPrimaryHover.style.borderColor = config.secondaryColor;
        btnPrimaryHover.style.color = config.secondaryColor;
      }
      if (btnPrimaryActive) {
        btnPrimaryActive.style.backgroundColor = config.primaryColor;
        btnPrimaryActive.style.borderColor = config.secondaryColor;
        btnPrimaryActive.style.color = config.secondaryColor;
      }
      if (btnPrimaryActiveHover) {
        btnPrimaryActiveHover.style.backgroundColor = config.primaryColor;
        btnPrimaryActiveHover.style.borderColor = config.secondaryColor;
        btnPrimaryActiveHover.style.color = config.secondaryColor;
      }

      if (btnPrimaryActiveHoverIE) {
        btnPrimaryActiveHoverIE.style.backgroundColor = config.primaryColor;
        btnPrimaryActiveHoverIE.style.borderColor = config.secondaryColor;
        btnPrimaryActiveHoverIE.style.color = config.secondaryColor;
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
      if (searchToolGroup) {
        searchToolGroup.style.backgroundColor = config.primaryColor;
        searchToolGroup.style.color = config.secondaryColor;
      }
    }
};
