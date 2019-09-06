import React from "react";
import { Hidden, Tooltip } from "@material-ui/core";

/**
 * Creates the elements of our Drawer list.
 * Note that there's a Hidden element that wraps it all up.
 * The reason for this is that we want to hide all buttons
 * that are not target=toolbar on all screen sizes except the smallest ones.
 * In other words: on small screens this will even render Widget plugins
 * (target=left|right) as if they were Drawer plugins, because
 * there's simply no screen estate to display the widget buttons.
 *
 * @export
 * @param {*} props
 * @returns React.Component
 */
// export default function PluginsList(props) {
//   const { plugins, onPluginClicked } = props;
//   return plugins.map((tool, i) => {
//     const tooltipInstruction = tool.options.instruction
//       ? atob(tool.options.instruction)
//       : "";

//     return (
//       <Hidden key={i} smUp={tool.options.target !== "toolbar"}>
//         <Tooltip title={tooltipInstruction} placement="top">
//           <div onClick={onPluginClicked} onMouseOver={e => e.stopPropagation()}>
//             <tool.component
//               map={tool.map}
//               app={tool.app}
//               options={tool.options}
//               type="toolbarItem"
//             />
//           </div>
//         </Tooltip>
//       </Hidden>
//     );
//   });
// }
