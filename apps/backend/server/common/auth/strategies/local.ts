import type { User } from "@prisma/client";
import prisma from "../../prisma.ts";
import bcrypt from "bcrypt";

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

passport.use(
  "local",
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Early check
        if (!email || !password) {
          done(null, false, {
            message: "Email is required",
          });
        }

        // Let's try to grab user from the DB
        const dbUser = await prisma.localAccount.findFirst({
          where: { email },
        });

        if (!dbUser) {
          return done(null, false, {
            message: "User not found",
          });
        }

        if (!dbUser?.password) {
          return done(null, false, {
            message: "Account not yet verified",
          });
        }

        const isMatch = await bcrypt.compare(password, dbUser.password);

        if (!isMatch) {
          return done(null, false, {
            message: "Password incorrect",
          });
        }

        const user = { ...dbUser, strategy: "LOCAL" } as User;
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
