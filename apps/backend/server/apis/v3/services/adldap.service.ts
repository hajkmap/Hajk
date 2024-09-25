import ActiveDirectory from "activedirectory2";
import ActiveDirectoryError from "../utils/active-directory-error.ts";
import log4js from "log4js";
import fs from "fs";
import AdBaseService from "./base/adbase.service.ts";

interface ADConfig {
  logging: log4js.Logger;
  url: string;
  baseDN: string;
  username: string;
  password: string;
  reconnect: boolean;
  connectTimeout: number;
  idleTimeout: number;
  timeout: number;
  tlsOptions: tlsOptions;
}

interface tlsOptions {
  key: string | null;
  cert: string | null;
  ca: string[];
  passphrase: string;
  requestCert: boolean;
  rejectUnauthorized: boolean;
}
/**
 * @description Proposed setup:
 *                  /-> MapService
 * Request -> Proxy
 *                  \-> GeoServer
 *
 * 1. User's request goes to a Proxy. That proxy is the only component visible to the outside world.
 *    Neither MapService nor GeoServer are reachable directly by Request.
 * 2. Proxy authenticates the user. If authentication is successful, Proxy will add user's userPrincipalName
 *    value as the value of the "X-Control-Header" request header. The header's name is can be
 *    overridden in .env.
 * 3. MapService (i.e. this application) should be configured in such a way that it only allows
 *    requests from specified IPs (which should be the Proxy IP).
 *    Alternatively, it could allow
 *    requests from anywhere, but only respect the value of X-Control-Header if request comes
 *    from a specified IP.
 *
 * @class ActiveDirectoryService
 */
class AdLdapService extends AdBaseService {
  #config: ADConfig | null = null; // Will hold AD connection parameters
  tlsOptions: tlsOptions | null = null;
  internalADLogger: log4js.Logger;

  constructor() {
    super();
    // Let's create another logger to separate internal logging from the ActiveDirectory2 library
    this.internalADLogger = log4js.getLogger(
      "service.auth.v3.activedirectory2"
    );
  }

  init() {
    if (process.env.AD_LOOKUP_ACTIVE !== "true") {
      this.logger.warn(
        "AD_LOOKUP_ACTIVE is set to %o in .env. Not enabling ActiveDirectory authentication.\nIf you run this in production, you can still restrict access to admin-only endpoints by setting RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS to any value.",
        process.env.AD_LOOKUP_ACTIVE
      );
      return;
    }

    this.logger.trace("Initiating ActiveDirectoryService V3");

    // If .env says we should use AD but the configuration is missing, abort.
    if (
      process.env.AD_URL === undefined ||
      process.env.AD_BASE_DN === undefined ||
      process.env.AD_USERNAME === undefined ||
      process.env.AD_PASSWORD === undefined
    ) {
      const e = new ActiveDirectoryError(
        `One or more AD configuration parameters is missing. Check the AD_* options. 
        If you want to run backend without the AD functionality, set AD_LOOKUP_ACTIVE=false.`
      );
      this.logger.fatal(e.message);
      throw e;
    }

    // Check if .env is configured for LDAPS. For the TLS functionality,
    // we require all of the following keys:
    const certs = [
      process.env.AD_TLS_PATH_TO_KEY,
      process.env.AD_TLS_PATH_TO_CERT,
      process.env.AD_TLS_PATH_TO_CA,
    ];

    // If at least one of those keys is set, then _all_ of them must be.
    if (
      certs.some(this.#isReadableFile) &&
      certs.every(this.#throwErrorIfNotReadable)
    ) {
      const buffers = { key: null, cert: null, ca: null };

      try {
        buffers.key = fs.readFileSync(process.env.AD_TLS_PATH_TO_KEY);
        buffers.cert = fs.readFileSync(process.env.AD_TLS_PATH_TO_CERT);
        buffers.ca = fs.readFileSync(process.env.AD_TLS_PATH_TO_CA);
      } catch (error) {
        const e = new ActiveDirectoryError(
          `
          Could not read TLS certificate files necessary for establishing the LDAPS connection. 
          Control your AD_TLS_* options or disable TLS by providing a ldap:// URL to the service. 
          ${error.message}`
        );
        this.logger.fatal(e.message);
      }

      this.tlsOptions = {
        key: buffers.key,
        cert: buffers.cert,
        ca: [buffers.ca],
        passphrase: process.env.AD_TLS_PASSPHRASE,
        requestCert: true,
        rejectUnauthorized: true,
      };
    }
    // An extra check: if .env says that we don't want to use TLS, but the
    // AD_URL seems to point to LDAPS server, let the log know, as it's probably
    // a mistake.
    else if (process.env.AD_URL.includes("ldaps://")) {
      this.logger.warn(
        `Caution: the configured AD_URL parameter contains "ldaps://" but you have not provided any TLS certificates!`
      );
    }

    // Grab some more options from .env regarding auto-reconnect and timeout
    // and transform to valid config constants. See also: http://ldapjs.org/client.html
    // and #1320.

    // Try to reconnect when the connection gets lost (Default is false)
    const optReconnect = process.env.AD_RECONNECT === "true";
    // Milliseconds client should wait before timing out on TCP connections (Default: OS default)
    const optConnectTimeout = Number.parseInt(process.env.AD_CONNECTTIMEOUT); // ms
    // Milliseconds after last activity before client emits idle event
    const optIdleTimeout = Number.parseInt(process.env.AD_IDLETIMEOUT); // ms
    // Milliseconds client should let operations live for before timing out (Default: Infinity)
    const optTimeout = Number.parseInt(process.env.AD_TIMEOUT);

    // Now we have the AD options and - optionally - the TLS options.
    // We're ready to prepare the config object for AD.
    this.#config = {
      logging: this.internalADLogger,
      url: process.env.AD_URL,
      baseDN: process.env.AD_BASE_DN,
      username: process.env.AD_USERNAME,
      password: process.env.AD_PASSWORD,
      reconnect: optReconnect,
      // Assign the various timeout options only if value isn't NaN
      ...(!Number.isNaN(optConnectTimeout) && {
        connectTimeout: optConnectTimeout,
      }),
      ...(!Number.isNaN(optIdleTimeout) && { idleTimeout: optIdleTimeout }),
      ...(!Number.isNaN(optTimeout) && { timeout: optTimeout }),
      // Assign some TLS options only if they exists
      ...(this.tlsOptions && { tlsOptions: this.tlsOptions }),
    };

    // The main AD object that will handle communication
    this.logger.trace(
      `Setting up AD connection to using the following options (\`logging\`, \`password\` and \`tlsOptions\` are obfuscated from this log message):`
    );
    const { password, tlsOptions, logging, ...obfuscatedConfig } = this.#config;
    this.logger.trace("%o", obfuscatedConfig);

    this._ad = new ActiveDirectory(this.#config);

    this.logger.info(`Testing the AD connection to ${process.env.AD_URL}…`);

    // Check the LDAP(S) connection. It will return true if OK or throw an error if connection
    // can't be established. Ideally, we'd want to await the return value here, but
    // we're in a constructor so it can't be done. Still, we achieve the goal of
    // aborting the startup if connection fails, so it doesn't really matter in the end.
    if (process.env.AD_CHECK_CONNECTION === "true") {
      this.#checkConnection();
    }

    // Initiate 3 local stores to cache the results from AD.
    // One will hold user details, the other will hold groups
    // per user.
    this._users = new Map();
    this._groups = new Set();
    this._groupsPerUser = new Map();

    this._trustedHeader = process.env.AD_TRUSTED_HEADER || "X-Control-Header";
  }
  /**
   * @summary Checks if provided path is a readable file. Fails silently
   * @description The reason for the silent failing here is that it is possible
   * that none of the paths are set, and that's fine. In that case we should
   * just continue without the TLS functionality.
   *
   * @param {*} path
   * @returns
   * @memberof ActiveDirectoryService
   */
  #isReadableFile(path) {
    try {
      fs.accessSync(path, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @summary Checks if provided path is a readable file. Throws error on failure.
   * @description This predicate function is used when we check that _every_
   * path is readable. By the time this is run, we require _all_ paths to exist,
   * so if one fails, it's a total failure and we can not continue without
   * informing the admin.
   *
   * @param {*} path
   * @returns
   * @memberof ActiveDirectoryService
   */
  #throwErrorIfNotReadable(path) {
    try {
      fs.accessSync(path, fs.constants.R_OK);
      return true;
    } catch (error) {
      const e = new ActiveDirectoryError(
        `
        Could not read certificate. Check your AD_TLS_PATH_* settings.
        ${error.message}
        ABORTING STARTUP.
        `
      );
      this.logger.fatal(e.message);
      throw e;
    }
  }

  /**
   * @summary Checks if a connection to the specified LDAP server can be established.
   *
   * @memberof ActiveDirectoryService
   */
  #checkConnection() {
    this.logger.info(`Attempting to connect to ${process.env.AD_URL}…`);

    // We will want to call logger from inside a callback of an instance
    // to ActiveDirectory. Inside that instance, `this` will refer to the
    // instance itself, rather than to _this_ class, hence making our
    // logger unavailable. So let's save a reference to it inside a variable.
    const serviceInstanceLogger = this.logger;

    // In order to check that the AD connection parameters are valid, we
    // create a new, separate ActiveDirectory instance. The reason for this
    // is that this basic check fails if AD_RECONNECT is set to `true` (rather
    // it fails silently, so it seems like everything's fine, when it's not).
    // This separate instance will _always_ have AD_RECONNECT disabled, so
    // the check will work as intended.
    const connectionCheckerConfig = { ...this.#config, reconnect: false };
    const connectionChecker = new ActiveDirectory(connectionCheckerConfig);

    // Prepare the query that will be sent to the AD. Admin can set a specific
    // query or leave it empty to just ask for "everything". Either way,
    // we'll limit the results to 1 item, so it won't be heavy on the AD.
    const query = process.env.AD_CHECK_CONNECTION_QUERY || undefined;

    // Wrap the call to find() in a try/catch, as we want to catch
    // internal errors that might occur inside the AD component. One
    // reason could be that the query string is malformed. Another common
    // source of issues are TLS certificates and their format.
    try {
      connectionChecker.find(
        { filter: query, sizeLimit: 1 },
        function (err, res) {
          if (err || !res) {
            const e = new ActiveDirectoryError(
              ` AD CONNECTION FAILED!
Connection to ${process.env.AD_URL} failed. Control your AD_* settings
in .env. There could be an issue with the certificates, CA, passphrase,
and/or user credentials (see original error below).
Also, make sure that the machine that runs this process can access the 
specified server (no firewalls etc that block the request). 

--------------------------- ORIGINAL ERROR ----------------------------
Error code: ${err.code}
Error message: ${err.message}
${err.stack}
------------------------- END ORIGINAL ERROR ----------------------------

ABORTING STARTUP.
            `
            );
            // Write the error to log file
            serviceInstanceLogger.fatal(e.message);

            // Now, abort startup by throwing an _uncaught_ error. Note that this
            // wil NOT be caught by the try/catch we're inside, as we're NOT inside
            // of it. We are in fact inside a callback, and that callback, and I haven't
            // defined any try/catch here on purpose. From the NodeJS docs:
            //
            // "If it is necessary to terminate the Node.js process due to an error condition,
            // throwing an uncaught error and allowing the process to terminate accordingly
            // is safer than calling process.exit()."
            throw e;
          } else {
            serviceInstanceLogger.info(
              `Connection to ${process.env.AD_URL} succeeded.`
            );
            return true;
          }
        }
      );
    } catch (error) {
      const e = new ActiveDirectoryError(`
      Couldn't test AD connection to ${process.env.AD_URL} due to malformed query value: "${process.env.AD_CHECK_CONNECTION_QUERY}". 
      Check the AD_CHECK_CONNECTION_QUERY parameter in .env.
      ABORTING STARTUP.`);
      serviceInstanceLogger.fatal(e);
      throw e;
    }
  }

  /**
   * Some useful admin functions that can be reached via the /ad endpoint:
   * - getUsers
   * - getGroups
   * - getGroupsPerUser
   * - flushStores
   */
  async getStore(store) {
    try {
      // Exit early if someone tries to call this endpoint on a setup with disabled AD
      if (!this._ad) {
        this.logger.trace(
          "Attempt to access AD functionality failed – AD is disabled in .env"
        );
        throw new ActiveDirectoryError(
          "Can't access AD methods because AD functionality is disabled in .env"
        );
      }

      // Prepare the object that we'll populate when looping GroupsPerUser
      const output = {};

      switch (store.toLowerCase()) {
        case "users":
          return Object.fromEntries(this._users);
        case "groups":
          return Array.from(this._groups);
        case "groupsperuser":
          // This is a bit more complicated as our Store contains
          // a Map of Promises, and that isn't easily JSON-able.
          // A couple of steps are necessary to convert its values
          // to a casual object that contains resolved Promises's values.

          // Loop through each entry in the Map, note the async callback
          this._groupsPerUser.forEach(async (v, k) => {
            // Add a new entry to the output object, the key should
            // be same as the Map's key, while value should be the resolved Promise
            output[k] = await Promise.resolve(v);
          });

          return output;

        default:
          return null;
      }
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Entirely flush the local cache of users and groups and start over by fetching from AD.
   * @description We utilize a local caching mechanism in order to minimize the traffic to AD.
   * This means that if a request comes in, and user object doesn't exist, we ask AD for the user
   * and group details, and store them locally (in two Maps). When subsequential requests arrive,
   * we just look them up in the local cache.
   *
   * The implication of this is that if network administrators change a users group membership,
   * we don't have the latest updates (and won't even care about asking the AD for them, as the user
   * is already cached!).
   *
   * This method simply resets this cache which will make all requests to be fetched from AD again.
   *
   * @memberof ActiveDirectoryService
   */
  async flushStores() {
    try {
      this.logger.trace("Flushing local cache stores…");
      this._users.clear();
      this._groups.clear();
      this._groupsPerUser.clear();
      return "All local caches successfully flushed.";
    } catch (error) {
      this.logger.error("[flushStores] %s", error.message);
      return { error };
    }
  }

  /**
   * @summary Helper that makes it easy to see if AD auth is configured, and
   * in that case if user name can be trusted.
   *
   * @description Admin can configure AD authentication by setting certain flags in.env.
   * If those are set, we should extract user name from a request header, usually
   * X-Control-Header. However, if admin has specified a range of trusted IPs (which should
   * be done), the header's value will only be read if request comes from a trusted IP. Else
   * undefined will be returned, which will lead to errors.
   *
   * Please note that a special flag, AD_OVERRIDE_USER_WITH_VALUE, will override the value of
   * request header. Use it only for development and debugging purposes, NEVER in production.
   *
   * @param {*} req
   * @returns User as specified in configured request header or undefined if checks weren't met.
   * @memberof ActiveDirectoryService
   */

  async isUserValid(sAMAccountName) {
    this.logger.trace(
      "[isUserValid] Checking if %o is a valid user in AD",
      sAMAccountName
    );

    // Grab the user object from AD (or Users store, if already there)
    const user = await this.findUser(sAMAccountName);

    // We assume that the user is valid if it has the sAMAccountName property.
    // Invalid users, that have not been found in AD, will be set to empty objects,
    // so this should work in all cases (unless some AD lacks the sAMAccountName property).
    const isValid = Object.prototype.hasOwnProperty.call(
      user,
      "sAMAccountName"
    );
    this.logger.trace(
      "[isUserValid] %o is %sa valid user in AD",
      sAMAccountName,
      isValid ? "" : "NOT "
    );
    return isValid;
  }

  /**
   * @summary Retrieve the user object from AD
   * @description The local store will be used to cache retrieved AD objects
   * in order to minimize requests to the AD. Requested user object is returned
   * if found, else null.
   *
   * @param {*} sAMAccountName
   * @returns {user} or empty object, if user not found
   * @memberof ActiveDirectoryService
   */
  async findUser(sAMAccountName) {
    try {
      // If anything else than String is supplied, it can't be a valid sAMAccountName
      if (typeof sAMAccountName !== "string") {
        throw new Error(
          `${sAMAccountName} is not a string, hence it can't be a valid user name sAMAccountName`
        );
      }

      sAMAccountName = sAMAccountName.trim();

      if (sAMAccountName.length === 0) {
        throw new Error("Empty string is not a valid sAMAccountName");
      }

      // Check if user entry already exists in store
      if (!this._users.has(sAMAccountName)) {
        this.logger.trace(
          "[findUser] Looking up %o in real AD",
          sAMAccountName
        );
        // If store didn't contain the requested user, get it from AD
        const user = await this._findUser(sAMAccountName);

        this.logger.trace(
          "[findUser] Saving %o in user store with value: \n%O",
          sAMAccountName,
          user
        );

        // Save the returned object to AD
        this._users.set(sAMAccountName, user);
      }

      return this._users.get(sAMAccountName);
    } catch (error) {
      this.logger.error("[findUser] %s", error.message);
      // Save to Users Store to prevent subsequential lookups - we already
      // know that this user doesn't exist.
      this._users.set(sAMAccountName, {});
      return {};
    }
  }

  /**
   * @summary Get a list of groups that a given user belongs to
   *
   * @param {*} sAMAccountName
   * @returns {Promise} That will resolve to an Array of groups or empty array if user wasn't found
   * @memberof ActiveDirectoryService
   */
  async getGroupMembershipForUser(sAMAccountName) {
    // First, check if we the store already contains an entry for the given user.
    // Note that the store holds Promises, hence we must use await to grab the values,
    // or else we'd just get the Promise itself!
    let groups = await this._groupsPerUser.get(sAMAccountName);
    if (groups !== undefined) {
      this.logger.trace(
        "[getGroupMembershipForUser] %o groups already found in groups-per-users store",
        sAMAccountName
      );
      return groups;
    }

    this.logger.trace(
      "[getGroupMembershipForUser] No entry for %o in the groups-per-users store yet. Populating…",
      sAMAccountName
    );

    // Before we start making any requests to AD, let's create an entry
    // in the groups store, so that a Promise can be returned if
    // more requests to this method would happened while we're already
    // awaiting answer from the AD
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise(async (resolve) => {
      try {
        // First, we need to translate the incoming sAMAcountName
        // to the longer userPrincipalName that is required by
        // _getGroupMembershipForUser(). To do that, we need to
        // grab it from user object.
        const { userPrincipalName } = await this.findUser(sAMAccountName);

        // Retrieve groups for user
        groups = await this._getGroupMembershipForUser(userPrincipalName);

        // We only care about the shortname (CN)
        groups = groups.map((g) => g.cn).sort();

        this.logger.trace(
          "[getGroupMembershipForUser] Done. Setting groups-per-users store key %o to value: %O",
          sAMAccountName,
          groups
        );

        // Resolve the Promise with retrieved groups. Note that this will resolve
        // the Promise that is stored in _groupsPerUser store.
        resolve(groups);
      } catch (error) {
        // If we got here, something above must have thrown an error. The most probable
        // reason is that user couldn't be found in AD. That means that there are no
        // groups to resolve with. But we need an array as the value of our entry in
        // _groupsPerUser, so we resolve with an empty array. Note that this means that
        // our Promises in the store will be resolved either way - whether group membership
        // was found, or not.
        this.logger.error(error.message);
        this.logger.error(error);
        resolve([]);
      }
    });

    // THIS IS IMPORTANT! Store the Promise in our _groupsPerUser store to prevent
    // subsequent requests to the AD, if one request for a given user already is pending.
    this._groupsPerUser.set(sAMAccountName, promise);

    // Now return the Promise, so whatever function using this will wait for the Promise to
    // settle (in practice resolve, as this Promise never gets rejected) before it attempts
    // to read the value.
    return promise;
  }

  async isUserMemberOf(sAMAccountName, groupCN) {
    try {
      // First some checks, so we don't get random results from the AD
      if (sAMAccountName === undefined)
        throw new ActiveDirectoryError(
          "Cannot lookup group membership for undefined user"
        );
      if (groupCN === undefined)
        throw new ActiveDirectoryError(
          "Cannot lookup membership if group isn't specified"
        );

      // If we haven't cached the requested user's groups yet…
      if (!this._groupsPerUser.has(sAMAccountName)) {
        this.logger.trace(
          "[isUserMemberOf] Can't find %o in groups-per-users store. Will need to populate.",
          sAMAccountName
        );
        // …let's cache them.
        await this.getGroupMembershipForUser(sAMAccountName);
      }

      // Now everything should be in store, see if user is member
      // of the specified group. Note that the store contains Promises,
      // so we must use await to extract the resolved values.
      const usersGroups = await this._groupsPerUser.get(sAMAccountName);
      return usersGroups.includes(groupCN);
    } catch (error) {
      this.logger.error(error.message);
      // If an error was thrown above (e.g because user wasn't found
      // in AD), we return false (because a non-existing user isn't
      // a member of the specified group).
      return false;
    }
  }

  /**
   * @description Fetch an array of all available AD groups
   *
   * @returns {Array} AD groups
   * @memberof ActiveDirectoryService
   */
  async getAvailableADGroups() {
    try {
      // Exit early if someone tries to call this endpoint on a setup with disabled AD
      if (!this._ad) {
        throw new ActiveDirectoryError(
          "AD functionality disabled - there is no way to find out available AD groups"
        );
      }

      // This is a bit of an expensive operation so we utilize a caching mechanism here too
      if (this._groups.size === 0) {
        // Looks as cache is empty, go on and ask the AD
        const groups = await this._findGroups();

        // Replace the cache with a new Set that…
        this._groups = new Set(groups.map((g) => g.cn).sort()); // isn't the whole object, but rather only an array of CN properties
      }

      // Spread the Set into an Array, which is the expected output format
      return [...this._groups];
    } catch (error) {
      this.logger.error(error.message);
      return [];
    }
  }

  /**
   * @summary A useful admin method that will return the common groups for any users
   * TODO: Fix /admin so it makes use of this new method instead of the generic getAvailableADGroups().
   * @param {Array} users A list of users
   * @returns {Array} Groups that are common for all specified users
   * @memberof ActiveDirectoryService
   */
  async findCommonADGroupsForUsers(users) {
    try {
      if (users.length < 1)
        throw new ActiveDirectoryError(
          "Can't find common groups if no users are supplied"
        );

      // Grab Promises that will contain all users' groups
      const promises = users
        .split(",")
        .map((u) => this.getGroupMembershipForUser(u));

      // Wait for all promises to resolve
      const userGroups = await Promise.all(promises);

      // Reduce the arrays of groups to only include common items
      // (this is basically a multi-array intersection operation)
      const commonGroups = userGroups.reduce((a, b) =>
        a.filter((c) => b.includes(c))
      );

      return commonGroups;
    } catch (error) {
      this.logger.error(error.message);
      return [];
    }
  }

  _getGroupMembershipForUser(userPrincipalName) {
    return new Promise((resolve, reject) => {
      this._ad.getGroupMembershipForUser(
        userPrincipalName,
        function (err, groups) {
          if (err) {
            return reject(err);
          }

          if (!groups)
            reject(
              new ActiveDirectoryError(`User ${userPrincipalName} not found.`)
            );
          else resolve(groups);
        }
      );
    });
  }

  _findUser(sAMAccountName) {
    return new Promise((resolve, reject) => {
      // Else, lookup and add answer to adStore
      this._ad.findUser(sAMAccountName, function (err, u) {
        if (err) {
          return reject(err);
        }

        if (!u)
          reject(new ActiveDirectoryError(`User ${sAMAccountName} not found.`));
        else resolve(u);
      });
    });
  }

  _findGroups(query = "CN=*") {
    return new Promise((resolve, reject) => {
      // Else, lookup and add answer to adStore
      this._ad.findGroups(query, function (err, g) {
        if (err) {
          return reject(err);
        }

        if (!g) reject(new ActiveDirectoryError(`Couldn't retrieve groups.`));
        else resolve(g);
      });
    });
  }
}

export default AdLdapService;
