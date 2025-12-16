import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { ensureUser } from "@/lib/db/queries";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Magic Link (dev)",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        if (!email) return null;

        const lockedEmail = process.env.SINGLE_USER_EMAIL?.toLowerCase();
        if (lockedEmail && lockedEmail !== email) {
          throw new Error("This demo runs in single-user mode. Use the configured email.");
        }

        const password = credentials?.password ?? "";
        if (process.env.DEV_AUTH_PASSWORD && password !== process.env.DEV_AUTH_PASSWORD) {
          throw new Error("Invalid password.");
        }

        const user = await ensureUser(email, credentials?.email?.split("@")[0]);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/ai" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
