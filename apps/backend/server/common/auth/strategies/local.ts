import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

passport.use(
  "local",
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Early check
        if (!email) {
          done(null, false);
        }

        // In reality this should be done in the database:
        //const user = await this.localAccount.findUnique({ where: { email } });

        // But for now, let's fake a user for testing purposes
        const user = {
          email: "tester@example.com",
          password: "123456",
        };

        // In reality the passwords should be hashed and salted,
        // so the compare would look more like: `await bcrypt.compare(password, (user.password).toString())`
        if (user.email === email && user.password === password) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: "Username or password incorrect.",
          });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);
