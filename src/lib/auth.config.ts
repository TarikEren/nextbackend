import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 30 // 30 days
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedRoutes = ["/admin", "/user"];
            const guestRoutes = ["/login", "/register"];

            const isProtectedRoute = protectedRoutes.some((route) => nextUrl.pathname.startsWith(route));
            const isGuestRoute = guestRoutes.some((route) => nextUrl.pathname.startsWith(route));

            if (isProtectedRoute && !isLoggedIn) {
                // If not logged in and on a protected route, redirect to login.
                return false;
            }

            if (isGuestRoute && isLoggedIn) {
                // If logged in and on a guest route, redirect to homepage.
                return Response.redirect(new URL('/', nextUrl));
            }

            // If none of the above, allow the request.
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;