import UserModel from "@/models/userModel";
import * as bcrypt from "bcrypt";
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/db/db";
import Google, { GoogleProfile } from "next-auth/providers/google";
import { IUserModel } from "@/lib/types";

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
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) {
                    throw new Error("E-posta ve şifre alanları zorunludur.");
                }

                await connectDB();
                try {
                    // Find the user and explicitly select the password field
                    const user = await UserModel.findOne({ email: email.toLowerCase() })
                        .select('+password') // Get the password field
                        .lean<IUserModel>();      // Tell lean the object shape

                    // If user is not found or password doesn't exist (due to schema)
                    if (!user || !user.password) {
                        throw new Error("Geçersiz e-posta veya şifre.");
                    }

                    const isPasswordMatch = await bcrypt.compare(password, user.password);
                    if (!isPasswordMatch) {
                        throw new Error("Geçersiz e-posta veya şifre.");
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        isAdmin: user.isAdmin,
                        emailVerified: user.emailVerified
                    };
                } catch (error: any) {
                    // Log the real error for debugging, but throw a generic one
                    console.error("Authorize error:", error.message);
                    throw new Error("Geçersiz e-posta veya şifre.");
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
                await connectDB();
                let dbUser = await UserModel.findOne({ email: user.email }).lean<IUserModel>();
                // If the user doesn't exist, create them
                if (!dbUser) {
                    try {
                        const newUser = await UserModel.create({
                            email: user.email,
                            password: undefined,
                            isAdmin: false,
                            emailVerified: true
                        });
                        // Assign the newly created user to dbUser
                        dbUser = newUser.toObject() as IUserModel;

                    } catch (error) {
                        console.error("Error during Google sign-in user creation:", error);
                        return false;
                    }
                }
                user.id = dbUser._id.toString();
                user.isAdmin = dbUser.isAdmin;
                user.emailVerified = dbUser.emailVerified;
            }
            return true;
        }
    },
});