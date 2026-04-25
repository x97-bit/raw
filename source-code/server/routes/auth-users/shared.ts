import { Response } from "express";
import { z } from "zod";
import {
  isStrongPassword,
  PASSWORD_MIN_LENGTH,
} from "../../../shared/passwordPolicy";
import { AuthRequest, isAdminUser } from "../../_core/appAuth";
import {
  createRateLimitMiddleware,
  resolveRateLimitClientIp,
} from "../../_core/rateLimit";
import type { AppUserRecord } from "../../db/schema/dbTypes";

type LegacyUserShapeInput = Pick<
  AppUserRecord,
  "id" | "username" | "name" | "role" | "active" | "createdAt"
> &
  Partial<Pick<AppUserRecord, "profileImage" | "permissions" | "updatedAt">>;

export const authRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth-login",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى لاحقًا.",
  keyFn: req => {
    const username =
      String(req.body?.username ?? "")
        .trim()
        .toLowerCase() || "anonymous";
    return `${resolveRateLimitClientIp(req)}:${username}`;
  },
});

export const passwordRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth-password",
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: "تم تجاوز الحد المسموح لطلبات كلمة المرور. حاول مرة أخرى لاحقًا.",
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});

const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(128)
  .refine(isStrongPassword, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long and include uppercase, lowercase, and numeric characters.`,
  });

export const userRoleSchema = z.enum(["admin", "user"]);
export const permissionListSchema = z
  .array(z.string().trim().min(1).max(64))
  .max(100);

export const createUserSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: strongPasswordSchema,
  name: z.string().trim().min(1).max(120).optional(),
  fullName: z.string().trim().min(1).max(120).optional(),
  role: userRoleSchema.optional(),
  permissions: permissionListSchema.optional(),
});

export const updateUserSchema = z
  .object({
    username: z.string().trim().min(1).max(64).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    fullName: z.string().trim().min(1).max(120).optional(),
    role: userRoleSchema.optional(),
    Role: userRoleSchema.optional(),
    permissions: permissionListSchema.optional(),
    profileImage: z
      .union([z.string().trim().max(350_000), z.null()])
      .optional(),
    active: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
    IsActive: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
    password: strongPasswordSchema.optional(),
  })
  .refine(payload => Object.keys(payload).length > 0, {
    message: "No user updates were provided.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: strongPasswordSchema,
  })
  .refine(payload => payload.currentPassword !== payload.newPassword, {
    message: "The new password must be different from the current password.",
  });

export const resetPasswordSchema = z
  .object({
    password: strongPasswordSchema.optional(),
    newPassword: strongPasswordSchema.optional(),
  })
  .refine(payload => Boolean(payload.password || payload.newPassword), {
    message: "A new password is required.",
  });

export const profileImageDataUrlSchema = z
  .string()
  .trim()
  .max(350_000)
  .regex(/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i, {
    message: "Profile image must be a PNG, JPG, or WEBP data URL.",
  });

export const profileUpdateSchema = z.object({
  profileImage: z.union([profileImageDataUrlSchema, z.null()]),
});

export const permissionsPayloadSchema = z.union([
  z.object({ permissions: permissionListSchema }),
  permissionListSchema,
]);

export const LOGIN_VALIDATION_MESSAGE = "Login payload is invalid.";
export const CREATE_USER_VALIDATION_MESSAGE = "User details are invalid.";
export const UPDATE_USER_VALIDATION_MESSAGE = "User update payload is invalid.";
export const CHANGE_PASSWORD_VALIDATION_MESSAGE =
  "Password change payload is invalid.";
export const RESET_PASSWORD_VALIDATION_MESSAGE =
  "Password reset payload is invalid.";
export const PROFILE_UPDATE_VALIDATION_MESSAGE =
  "Profile update payload is invalid.";
export const PERMISSIONS_VALIDATION_MESSAGE = "Permissions payload is invalid.";
export const USER_ID_LABEL = "User id";
export const FORBIDDEN_ERROR = "غير مصرح";

export function toLegacyUserShape(user: LegacyUserShapeInput) {
  return {
    ...user,
    UserID: user.id,
    FullName: user.name,
    Username: user.username,
    Role: user.role,
    IsActive: user.active,
    ProfileImage: user.profileImage ?? null,
    LastLogin: user.createdAt,
  };
}

export function normalizeActiveFlag(value: boolean | number | undefined) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value ? 1 : 0;
}

export function requireAdmin(req: AuthRequest, res: Response) {
  if (isAdminUser(req)) {
    return true;
  }

  res.status(403).json({ error: FORBIDDEN_ERROR });
  return false;
}

export function normalizePermissionsPayload(
  payload: z.infer<typeof permissionsPayloadSchema>
) {
  return Array.isArray(payload) ? payload : payload.permissions;
}
