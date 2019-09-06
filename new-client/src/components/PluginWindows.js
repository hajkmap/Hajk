import React from "react";

/**
 *  *
 * @export
 * @param {*} props
 * @returns React.Component
 */
export default function PluginWindows(props) {
  const { plugins } = props;
  return plugins.map((tool, i) => {
    console.log("tool: ", tool);
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
