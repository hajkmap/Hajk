# Migration to V2 API

## `new-client/public/appConfig.json`

### Removed keys

As a result of [finalizing the migration to the consolidated loading approach in Client UI (first started in #682)](https://github.com/hajkmap/Hajk/commit/01123dd79aec6d66b0f7cd4f3ad767bef2f2c4f2), [the new error page in Client UI added in 3.13.6](https://github.com/hajkmap/Hajk/commit/f2201fc2c63988175172315313344a8992a17c4d) as well as [#1369](https://github.com/hajkmap/Hajk/issues/1369), the following keys are now obsolete, **have no effect in Client UI** and can be safely removed:

- `appName`
- `version`
- `experimentalNewApi`
- `noLayerSwitcherMessage`
- `networkErrorMessage`
- `parseErrorMessage`

### Added keys

Due to the [new error page in Client UI added in 3.13.6](https://github.com/hajkmap/Hajk/commit/f2201fc2c63988175172315313344a8992a17c4d), three keys have been added:

- `loadErrorTitle`
- `loadErrorMessage`
- `loadErrorReloadButtonText`

## `new-admin/public/config.json`

Simply replace `v1` with `v2` to ensure that all requests go to the current API, e.g.
`http://localhost:3002/api/v1/mapconfig/list` -> `http://localhost:3002/api/v2/mapconfig/list`

## `new-backend/.env`

If you previously specified a value for `API_VERSIONS`, bear in mind that `2` is the only allowed value at this moment.

The recommended setting, however, is to leave this option unset which will default to all currently supported API versions (which currently is V2).

```shell
#API_VERSIONS=2
```

## Other locations

It's a good idea to search your configuration files as well as `App_Data` and replace all occurences of `/api/v1` with `/api/v2`. Common places where you can expect to find references is Backend's proxy functionality, layers that use these proxies as well as some tools that have some specific URL settings in their configurations.
