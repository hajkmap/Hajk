import React from "react";
import { array } from "prop-types";

PluginWindows.propTypes = {
  plugins: array.isRequired
};

/**
 *  *
 * @export
 * @param {*} props
 * @returns React.Component
 */
function PluginWindows({ plugins }) {
  return plugins.map((tool, i) => {
    return (
      <tool.component
        key={i}
        map={tool.map}
        app={tool.app}
        options={tool.options}
      />
    );
  });
}

/**
 * The arePropsEqual() function is defined with two parameters:
 * prevProps and nextProps respectively.
 * The arePropsEqual() function returns true when the props are
 * compared to be equal, thereby preventing the component from
 * re-rendering, and returns false when the props are not equal.
 * @param {*} prevProps
 * @param {*} nextProps
 */
function arePropsEqual(prevProps, nextProps) {
  return prevProps.plugins.length === nextProps.plugins.length;
}

export default React.memo(PluginWindows, arePropsEqual);
