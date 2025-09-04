import 'next-auth';
import 'next-auth/jwt';

// Augment the built-in session and user types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            isAdmin: boolean;
            emailVerified: boolean;
        } & DefaultSession['user']; // Keep the default properties
    }

    interface User {
        id: string;
        email: string;
        isAdmin: boolean;
        emailVerified: boolean;
    }
}

// Augment the built-in JWT type
declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        isAdmin: boolean;
        emailVerified: boolean;
    }
}