import ActiveDirectory from "activedirectory";
import ActiveDirectoryError from "../utils/ActiveDirectoryError";

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
class ActiveDirectoryService {
  constructor() {
    console.log("[AD] Initiating ActiveDirectoryService");
    // if (process.env.AD_ACTIVE !== "true")
    //   throw new ActiveDirectoryError("AD Service disabled in .env.");
    if (
      process.env.AD_URL === undefined ||
      process.env.AD_BASE_DN === undefined ||
      process.env.AD_USERNAME === undefined ||
      process.env.AD_PASSWORD === undefined
    ) {
      throw new ActiveDirectoryError("Configuration missing");
    }

    // Initiate 2 local stores to cache the results from AD.
    // One will hold user details, the other will hold groups
    // per user.
    this._users = new Map();
    this._groupsPerUser = new Map();

    // The main AD object that will handle communication
    this._ad = new ActiveDirectory(
      process.env.AD_URL,
      process.env.AD_BASE_DN,
      process.env.AD_USERNAME,
      process.env.AD_PASSWORD
    );

    this._trustedHeader = process.env.AD_TRUSTED_HEADER || "X-Control-Header";
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
   * @param {*} req
   * @returns User as specified in configured request header or undefined if checks weren't met.
   * @memberof ActiveDirectoryService
   */
  getUserFromRequestHeader(req) {
    if (process.env.AD_LOOKUP_ACTIVE !== "true") {
      // If AD_LOOKUP_ACTIVE is anything else than "true", we don't care
      // about doing any username checks. Just return undefined as username.
      return undefined;
    } else {
      // AD_LOOKUP_ACTIVE is "true" so let's find out a couple of things.
      // 1. Do we only accept requests from certain IPs? If so, check that
      // request comes from accepted IP. If not, abort.
      // 2. If we passed the first check (either because request comes from
      // accepted IP, or because we accept any IPs (dangerous!)) we can now
      // take care of finding out the user name. It will be read from a REQ
      // header.
      // Implementation follows.

      // Step 1: See if the current req IP is within the accepted IPs range
      const requestComesFromAcceptedIP =
        process.env.AD_TRUSTED_PROXY_IPS === undefined || // If no IPs are specified, because variable isn't set,
        process.env.AD_TRUSTED_PROXY_IPS.trim().length === 0 || // or because it's an empty string, it means that we accept any IP (dangerous!).
        process.env.AD_TRUSTED_PROXY_IPS?.split(",").includes(req.ip); // Else, if specified, split on comma and see if IP exists in list

      if (requestComesFromAcceptedIP === false) {
        console.error(
          "Request not accepted - request IP out of accepted range."
        );
        throw new Error(
          "AD auth requested but request comes from unaccepted IP range. See settings in .env."
        );
      }

      console.log("requestComesFromAcceptedIP: ", requestComesFromAcceptedIP);

      // See which header we should be looking into
      const xControlHeader =
        process.env.AD_TRUSTED_HEADER || "X-Control-Header";

      // The user will only be set only if request comes from accepted IP.
      // Else, we'll send undefined as user parameter, which will in turn lead
      // to errors being thrown (if AD auth is required in .env)
      const user =
        (requestComesFromAcceptedIP && req.get(xControlHeader)) || undefined;
      console.log("user: ", user);
      return user;
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
  flushCache() {
    console.log("Flushing local cache");
    this._users.clear();
    this._groupsPerUser.clear();
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
      // Check if user entry already exists in store
      if (!this._users.has(sAMAccountName)) {
        console.log(`Looking up ${sAMAccountName} in real AD…`);
        // If store didn't contain the requested user, get it from AD
        const user = await this._findUser(sAMAccountName);

        console.log(
          `Saving the following as ${sAMAccountName} in Users Store:`,
          user
        );

        // Save the returned object to AD
        this._users.set(sAMAccountName, user);
      }

      return this._users.get(sAMAccountName);
    } catch (error) {
      console.error(error);
      // Save to Users Store to prevent subsequential lookups - we already
      // know that this user doesn't exist.
      this._users.set(sAMAccountName, {});
      return {};
    }
  }

  async getGroupMembershipForUser(sAMAccountName) {
    try {
      // See if we've got results in store already
      let groups = this._groupsPerUser.get(sAMAccountName);
      if (groups !== undefined) {
        console.log("Found groups in store!");
        return groups;
      }

      console.log("Looking up groups in store…");

      // First, we need to translate the incoming sAMAcountName
      // to the longer userPrincipalName that is required by
      // _getGroupMembershipForUser(). To do that, we need to
      // grab it from user object.
      const { userPrincipalName } = await this.findUser(sAMAccountName);

      // Retrieve groups for user
      groups = await this._getGroupMembershipForUser(userPrincipalName);

      // We only care about the shortname (CN)
      groups = groups.map((g) => g.cn);

      console.log("Done. Setting groups in store and returning.");

      // Set in local store
      this._groupsPerUser.set(sAMAccountName, groups);
      return groups;
    } catch (error) {
      // If we didn't get groups, cache the empty result to eliminate subsequential requests
      this._groupsPerUser.set(sAMAccountName, []);
      console.error(error);
      return [];
    }
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
        console.log("Populating store");
        // …let's cache them.
        await this.getGroupMembershipForUser(sAMAccountName);
      }

      // Now everything should be in store, see if user is member
      // of the specified group
      return this._groupsPerUser.get(sAMAccountName).includes(groupCN);
    } catch (error) {
      console.error(error);
      // If an error was thrown above (e.g because user wasn't found
      // in AD), we return false (because a non-existing user isn't
      // a member of the specified group).
      return false;
    }
  }

  async getAvailableADGroups() {
    try {
      const groups = await this._findGroups();
      return groups.map((g) => g.cn); // We're not interested in the whole object, but only CN property
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  _getGroupMembershipForUser(userPrincipalName) {
    return new Promise((resolve, reject) => {
      this._ad.getGroupMembershipForUser(userPrincipalName, function (
        err,
        groups
      ) {
        if (err) {
          reject(err);
        }

        if (!groups)
          reject(
            new ActiveDirectoryError(`User ${userPrincipalName} not found.`)
          );
        else resolve(groups);
      });
    });
  }

  _findUser(sAMAccountName) {
    return new Promise((resolve, reject) => {
      // Else, lookup and add answer to adStore
      this._ad.findUser(sAMAccountName, function (err, u) {
        if (err) {
          reject(err);
        }
        if (!u)
          reject(new ActiveDirectoryError(`User ${sAMAccountName} not found.`));
        resolve(u);
      });
    });
  }

  // Not needed, as we have another implementation that doesn't use the AD-method
  // _isUserMemberOf(user, group) {
  //   return new Promise((resolve, reject) => {
  //     // First check in this.adStore and easily resolve if found
  //     // resolve(true|false)

  //     // Else, lookup and add answer to adStore
  //     this._ad.isUserMemberOf(user, group, (err, isMember) => {
  //       if (err) {
  //         reject(err);
  //       }

  //       console.log("isMember: ", isMember);
  //       resolve(isMember);
  //     });
  //   });
  // }

  _findGroups(query = "CN=*") {
    return new Promise((resolve, reject) => {
      // Else, lookup and add answer to adStore
      this._ad.findGroups(query, function (err, g) {
        if (err) {
          reject(err);
        }
        if (!g) reject(new ActiveDirectoryError(`Couldn't retrieve groups.`));
        resolve(g);
      });
    });
  }
}

export default new ActiveDirectoryService();
