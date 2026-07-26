import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { prompt: 'select_account' } },
    }),
    Google({
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
})
