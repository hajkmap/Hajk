
function getCSSRule(ruleName) {
    ruleName = ruleName.toLowerCase();
    var rule = undefined;
    if (!document || !document.styleSheets) return;
    Array.prototype.find.call(document.styleSheets, styleSheet => {
        if (!styleSheet.cssRules) return;
        var mathces = Array.prototype.filter.call(styleSheet.cssRules, cssRule =>
          cssRule instanceof CSSStyleRule &&
          cssRule.selectorText.toLowerCase() === ruleName
        );
        rule = mathces[mathces.length - 1];
        if (rule) {
          rule = rule;
        }
    });
    return rule;
}

module.exports = {
    configure: function (config) {

      var panelHeader = getCSSRule('.navigation-panel-inner > .panel-heading')
      var backgroundSwitcher = getCSSRule('.background-switcher');
      var backgroundSwitcherHeader = getCSSRule('.background-switcher h3');
      var navigationPanelInner = getCSSRule('.navigation-panel-inner');
      var dl = getCSSRule('dl');
      var dt = getCSSRule('dt');
      var btnPrimary = getCSSRule('.btn-primary');
      var btnPrimaryFocus = getCSSRule('.btn-primary:focus, .btn-primary.focus');
      var btnPrimaryHover = getCSSRule('.btn-primary:hover');
      var inputFocus = getCSSRule('input[type="text"]:focus');

      if (panelHeader) {
        panelHeader.style.backgroundColor = config.primaryColor;
      }
      if (backgroundSwitcher) {
        backgroundSwitcher.style.border = "1px solid " + config.primaryColor;
      }
      if (backgroundSwitcherHeader) {
        backgroundSwitcherHeader.style.backgroundColor = config.primaryColor;
      }
      if (navigationPanelInner) {
        navigationPanelInner.style.borderRight = "1px solid " + config.primaryColor;
      }
      if (dl) {
        dl.style.border = "1px solid " + config.primaryColor;
      }
      if (dt) {
        dt.style.backgroundColor = config.primaryColor;
      }
      if (btnPrimary) {
        btnPrimary.style.backgroundColor = config.primaryColor;
      }
      if (btnPrimaryFocus) {
        btnPrimaryFocus.style.backgroundColor = config.primaryColor;
      }
      if (btnPrimaryHover) {
        btnPrimaryHover.style.backgroundColor = config.primaryColor;
      }
      if (inputFocus) {
        inputFocus.style.outline = "2px solid " + config.primaryColor;
      }

    }
};
