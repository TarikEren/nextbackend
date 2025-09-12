/**
 * Contains global functionality utilized by more than one service file
 */

import { UnauthorizedError } from "@/lib/errors";
import { ActingUser, ProtectedActions } from "@/lib/types/services/global";
import { Logger } from "pino";
import slugify from "slugify";

export namespace ServiceUtils {
    /**
     * Checks whether the provided user is an admin and throws error if not
     * @param {ActingUser} actingUser - The user making the request
     * @param {ProtectedActions} action - The performed action
     * @throws {UnauthorizedError}
     */
    export function ensureAdmin(logger: Logger, actingUser: ActingUser, action: ProtectedActions): void {
        if (!actingUser.isAdmin) {
            logger.warn({ actingUserId: actingUser.id }, `Unauthorized ${action} product attempt`);
            throw new UnauthorizedError("Bu işlem için gerekli yetkilere sahip değilsiniz");
        }
    }

    /**
     * Generates a slug using the provided name
     * @param name - The name to generate the slug from
     * @returns {string} The slug
     */
    export function generateSlug(name: string): string {
        return slugify(name, { lower: true, strict: true });
    }
}