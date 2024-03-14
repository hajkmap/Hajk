import React from "react";
import { Avatar, IconButton, Paper, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(() => ({
  minWidth: "unset",
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 25,
  height: 25,
  fontSize: "0.8rem",
  backgroundColor: theme.palette.text.primary,
}));

/**
 * @summary Transform a full name to initials, e.g. "John Smith" to "JS"
 *
 * @param {string} displayName
 * @returns {string} The initials from supplied string
 */
const getInitialsFromDisplayName = (displayName) => {
  return displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();
};

/**
 * @summary Compose a tooltip string by joining some user detail values
 *
 * @param {object} userDetails
 * @returns {string} Tooltip string value
 */
const getTooltipString = (userDetails) => {
  // Let's combine the details to an array
  const userDetailsArrays = [userDetails.displayName, userDetails.description];
  // Then we'll get rid of empty values, and create a string by joining the non-empty
  // values.
  return userDetailsArrays.filter((v) => v !== undefined).join(", ");
};

/**
 * @summary A button that contains user's initials inside an Avatar component
 *
 * @param {object} props
 * @returns {object} React
 */
const User = React.memo(({ userDetails }) => {
  return (
    (userDetails && (
      <Tooltip title={getTooltipString(userDetails)}>
        <StyledPaper>
          <StyledIconButton aria-label={userDetails.displayName}>
            <StyledAvatar alt={userDetails.displayName}>
              {getInitialsFromDisplayName(userDetails.displayName)}
            </StyledAvatar>
          </StyledIconButton>
        </StyledPaper>
      </Tooltip>
    )) ||
    null
  );
});

export default User;
