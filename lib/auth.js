import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const db = getDb();
        const result = await db.execute({
          sql: "SELECT * FROM admins WHERE username = ?",
          args: [credentials.username],
        });
        const admin = result.rows[0];
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password, admin.password_hash);
        if (!valid) return null;
        return { id: String(admin.id), name: admin.username, role: "admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session?.user) session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
