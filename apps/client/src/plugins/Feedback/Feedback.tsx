import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import FeedbackModel from "./FeedbackModel";
import FeedbackView from "./FeedbackView";

import FeedbackIcon from "@mui/icons-material/Feedback";

import { DEFAULT_MAX_LENGTH } from "./constants";
import { configText } from "src/i18n";
import type { FeedbackProps } from "./types";

/**
 * @summary Lets users send short feedback to the admins. Saved by Backend,
 * see FEEDBACK_* in Backend's .env.
 */
const Feedback: React.FC<FeedbackProps> = (props) => {
  const [model] = React.useState(() => new FeedbackModel(props.app));
  const { options } = props;

  return (
    <BaseWindowPlugin
      {...props}
      type="Feedback"
      custom={{
        icon: <FeedbackIcon />,
        height: "dynamic",
        width: 400,
      }}
    >
      <FeedbackView
        model={model}
        // An empty instruction text from Admin hides the instruction
        instructionText={
          options.instructionText === ""
            ? ""
            : configText("feedback.instructionText", options.instructionText)
        }
        thankYouText={configText("feedback.thankYouText", options.thankYouText)}
        maxLength={
          Number.isInteger(options.maxLength) && options.maxLength! > 0
            ? options.maxLength!
            : DEFAULT_MAX_LENGTH
        }
      />
    </BaseWindowPlugin>
  );
};

export default Feedback;
