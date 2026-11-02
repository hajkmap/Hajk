// Turns the user's groups into roles for GeoServer, see nginx.conf.
//
// Hajk wants the groups separated by ",", but GeoServer separates roles
// with ";" and uses "," for role parameters, as in "ROLE_A(p1=x,p2=y);ROLE_B".
// Sending Hajk's header to GeoServer would make all groups one single role.

// Members of this group become administrators of GeoServer. GeoServer does
// not map header roles to its own admin role, so the role is added here.
const GEOSERVER_ADMIN_GROUP = "GIS_ADMIN";

function roles(r) {
  const groups = (r.variables.hajk_groups || "")
    .split(",")
    .map((group) => group.trim())
    // Characters with a meaning to GeoServer must not be in a role name.
    .filter((group) => group && !/[;()=]/.test(group));

  if (groups.includes(GEOSERVER_ADMIN_GROUP)) {
    groups.push("ROLE_ADMINISTRATOR");
  }
  return groups.join(";");
}

export default { roles };
