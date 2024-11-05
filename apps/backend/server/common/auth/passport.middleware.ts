import type { Application, Request } from "express";
import prisma from "../../common/prisma.ts";

import passport from "passport";
import "./strategies/local.ts";

export function setupPassport(app: Application) {
  // Init
  app.use(passport.initialize());
  app.use(passport.authenticate("session"));

  passport.serializeUser(async (_req: Request, user, done) => {
    const dbUser = await prisma.user.upsert({
      create: {
        email: user.email,
        strategy: user.strategy,
        fullName: "Foo Bar",
      },
      update: {
        strategy: user.strategy,
        fullName: "Foo Bar",
      },
      where: {
        email: user.email,
      },
    });

    console.log("Serialize user: ", dbUser);
    done(null, dbUser);
  });

  passport.deserializeUser((obj, done) => {
    console.log("Deserialize user: ", obj);
    try {
      done(null, obj);
    } catch (error) {
      done(error, false);
    }
  });
}
