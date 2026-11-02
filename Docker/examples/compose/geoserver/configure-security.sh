#!/bin/sh
# EXAMPLE ONLY. Run by the geoserver-init service in compose.yaml.
#
# Sets GeoServer up to log users in from the headers that nginx sets:
#
#   X-GeoServer-User   the user name
#   X-GeoServer-Roles  the user's groups, separated by ";"
#
# 1. Creates the authentication filter "hajk-header", which reads them.
# 2. Puts it first in the filter chains for the web interface, REST and the
#    OGC services. The filters that were there before, such as basic
#    authentication for the admin user, stay after it.
#
# Safe to run again: it only adds what is missing. The same can be done by
# hand under Security > Authentication in GeoServer's web interface.
set -eu

FILTER=hajk-header
REST="$GEOSERVER_URL/rest/security"

gs() {
  curl --silent --show-error --fail --user "$GEOSERVER_ADMIN_USER:$GEOSERVER_ADMIN_PASSWORD" "$@"
}

echo "Waiting for GeoServer..."
until gs --output /dev/null "$GEOSERVER_URL/rest/about/version.json" 2>/dev/null; do
  sleep 5
done

# Asking for a filter that does not exist gives 200 and <null/>, so look in
# the list of filters instead.
if gs "$REST/authfilters.xml" | grep -q "<name>$FILTER</name>"; then
  echo "Filter $FILTER already exists"
else
  echo "Creating filter $FILTER"
  gs --output /dev/null --header "Content-Type: application/xml" --data-binary @- \
    "$REST/authfilters" <<EOF
<org.geoserver.security.config.RequestHeaderAuthenticationFilterConfig>
  <name>$FILTER</name>
  <className>org.geoserver.security.filter.GeoServerRequestHeaderAuthenticationFilter</className>
  <roleSource class="org.geoserver.security.config.PreAuthenticatedUserNameFilterConfig\$PreAuthenticatedUserNameRoleSource">Header</roleSource>
  <principalHeaderAttribute>X-GeoServer-User</principalHeaderAttribute>
  <rolesHeaderAttribute>X-GeoServer-Roles</rolesHeaderAttribute>
</org.geoserver.security.config.RequestHeaderAuthenticationFilterConfig>
EOF
fi

for chain in web rest gwc default; do
  xml=$(gs "$REST/filterchain/$chain.xml")
  case "$xml" in
    *"<filter>$FILTER</filter>"*)
      echo "Chain $chain already uses $FILTER"
      ;;
    *)
      echo "Adding $FILTER to chain $chain"
      printf '%s' "$xml" |
        sed "s|\(<filters [^>]*>\)|\1<filter>$FILTER</filter>|" |
        gs --output /dev/null --request PUT --header "Content-Type: application/xml" \
          --data-binary @- "$REST/filterchain/$chain"
      ;;
  esac
done

echo "GeoServer now reads users and roles from the headers set by nginx."
