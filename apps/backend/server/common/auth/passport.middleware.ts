import type { Application, Request } from "express";
// import prisma from "../../common/prisma.ts";
import passport from "passport";

import "./strategies/local.ts";

interface IUser {
  email: string;
  password: string;
}

export function setupPassport(app: Application) {
  // Init
  app.use(passport.initialize());
  app.use(passport.authenticate("session"));

  passport.serializeUser((_req: Request, user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: IUser, done) => {
    // In reality we'd do something like this to grab user from prisma
    // const u = prisma.localAccount.findFirstOrThrow({
    //   where: { email: user.email },
    // });
    const u = {
      email: "tester@example.com",
      password: "123456",
    };
    done(null, u);
  });
}
