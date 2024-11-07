import prisma from "../../prisma.ts";

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

        // In reality the passwords should be hashed and salted,
        // so the compare would look more like: `await bcrypt.compare(password, (user.password).toString())`
        if (dbUser.email === email && dbUser.password === password) {
          const user = { ...dbUser, strategy: "LOCAL" };
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Password incorrect",
          });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);
