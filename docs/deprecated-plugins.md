# Deprecated Plugins

As Hajk evolves, some plugins receive small, backward-compatible improvements. In some cases, a better solution is to entirely replace a plugin with another. This results in Hajk having two plugins with similar goals coexisting.

Sometimes, a legacy solution to a problem is replaced by a new one. This is called _plugin deprecation_.

Below is a list of deprecated plugins, using their "codename" (the one used in configuration files), along with the Hajk version at which they became obsolete and the plugin they were replaced by (if any). If no replacement plugin is given, it means that the old plugin became a _community plugin_ (refer to `docs/rfcs/rfc1.md`).

| Old Plugin | Replaced By | Removed in Version | Note                                                |
| ---------- | ----------- | ------------------ | --------------------------------------------------- |
| measure    | measurer    | v3.13.6            |                                                     |
| draw       | sketch      | v3.13.6            |                                                     |
| vtsearch   | N/A         | v3.13.6            | Maintained by Västtrafik. No public fork available. |
