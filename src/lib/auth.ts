import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";

// Production guard: AUTH_URL must be defined in production. NextAuth v5 reads
// AUTH_URL from process.env automatically and uses it to validate callback
// origins. Without AUTH_URL, NextAuth would fall back to incoming Host headers,
// which is unsafe behind proxies/CDNs. We fail fast at module-load time so a
// misconfigured production build/start cannot boot.
if (isProd && !process.env.AUTH_URL) {
  throw new Error("AUTH_URL is required in production");
}

/**
 * NextAuth (v5) configuration.
 *
 * `trustHost` posture:
 * - In development: `trustHost: true` (no AUTH_URL constraint).
 * - In production: `trustHost: true` paired with the `AUTH_URL` environment
 *   variable. NextAuth uses `AUTH_URL` to validate callback URLs against the
 *   configured origin, so requests with mismatched hosts are rejected by
 *   NextAuth's internal validation. The module-load guard above ensures
 *   `AUTH_URL` is present before this config is built; otherwise the process
 *   throws and the app refuses to start.
 *
 * Note: NextAuth v5 expects `trustHost` as a boolean (no per-request function
 * form), so the conditional posture is encoded via the AUTH_URL guard plus
 * NextAuth's own host validation, not via request inspection here.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
