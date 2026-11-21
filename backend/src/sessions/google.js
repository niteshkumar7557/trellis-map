import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prisma.js";

// Takes the database as an argument, so tests can pass a fake one.
export async function findOrCreateGoogleUser(db, profile) {
  // 1. Someone who has signed in with Google before.
  const byGoogleId = await db.user.findUnique({ where: { googleId: profile.id } });
  if (byGoogleId) return byGoogleId;

  // 2. An existing email account: link Google to it, but only if Google has verified
  // the email. Otherwise anyone could make a Google account with your address and
  // take over your Trellis account.
  const email = profile.emails[0];
  if (email.verified) {
    const byEmail = await db.user.findUnique({ where: { email: email.value.toLowerCase() } });
    if (byEmail) {
      return db.user.update({ where: { id: byEmail.id }, data: { googleId: profile.id } });
    }
  }

  // 3. A new person. No password: login refuses password sign-in for this account.
  return db.user.create({
    data: { email: email.value.toLowerCase(), name: profile.displayName, googleId: profile.id },
  });
}

// Only register Google when its keys are set, so the tests and a laptop without the
// keys can still run everything else.
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try { done(null, await findOrCreateGoogleUser(prisma, profile)); }
      catch (err) { done(err); }
    },
  ));
}
