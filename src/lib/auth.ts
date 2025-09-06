import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google, { GoogleProfile } from "next-auth/providers/google";
import logger from "./logger";
import { UserRepository } from "@/repositories/userRepository";
import { UserService } from "@/services/userService";
import { AuthenticationError } from "./errors";

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: "/login",
        error: "/error"
    },
    session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 30 // 30 days
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "email", type: "text" },
                password: { label: "password", type: "password" }
            },
            authorize: async (credentials) => {
                // Dependencies
                const reqLogger = logger.child({ authProvider: 'credentials' });
                const userRepository = new UserRepository(reqLogger);
                const userService = new UserService(userRepository, reqLogger);

                try {
                    // Authenticate the user
                    const user = await userService.authenticateUser({
                        email: credentials?.email as string,
                        password: credentials?.password as string,
                    });

                    // Return the user
                    return {
                        id: user.id,
                        email: user.email,
                        isAdmin: user.isAdmin,
                        emailVerified: user.emailVerified,
                    };
                } catch (error) {
                    // If the error is just an authentication error, return null
                    // Else, log the error and return null
                    if (error instanceof AuthenticationError) {
                        return null;
                    } else {
                        reqLogger.error({ error }, "An unexpected error occurred during authentication");
                        return null;
                    }
                }
            }
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            profile(profile: GoogleProfile) {
                return {
                    id: profile._id,
                    name: profile.name,
                    email: profile.email,
                    isAdmin: false,
                    emailVerified: true
                }
            }
        })
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = user.isAdmin;
                token.emailVerified = (user.emailVerified as boolean)
            }
            return token;
        },

        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.isAdmin = token.isAdmin as boolean;
                session.user.emailVerified = token.emailVerified as boolean;
            }
            return session;
        },

        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const reqLogger = logger.child({ authProvider: 'google-signIn' });
                const userRepository = new UserRepository(reqLogger);
                const userService = new UserService(userRepository, reqLogger);
                try {
                    const dbUser = await userService.findOrCreateUserFromProvider({
                        email: user.email!,
                        firstName: user.name?.split(' ')[0],
                        lastName: user.name?.split(' ').slice(1).join(' ')
                    });
                    user.id = dbUser.id;
                    user.isAdmin = dbUser.isAdmin;
                    user.emailVerified = dbUser.emailVerified;

                } catch (error) {
                    // Log and stop the sign-in process
                    reqLogger.error({ error }, "Failed to find or create user from Google provider.");
                    return false;
                }
            }
            return true;
        }
    },
});