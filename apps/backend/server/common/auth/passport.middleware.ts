import type { Application } from "express";
import prisma from "../../common/prisma.ts";

import passport from "passport";
import "./strategies/local.ts";
import type { User } from "@prisma/client";

export function setupPassport(app: Application) {
  app.use(passport.initialize());
  app.use(passport.authenticate("session"));

  passport.serializeUser(async (user: Express.User, done) => {
    const dbUser = await prisma.user.upsert({
      create: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        strategy: user.strategy,
      },
      update: {
        strategy: user.strategy,
        fullName: user.fullName,
      },
      where: {
        email: user.email,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        strategy: true,
      },
    });
    done(null, dbUser);
  });

  passport.deserializeUser((user: User, done) => {
    try {
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  });
}
