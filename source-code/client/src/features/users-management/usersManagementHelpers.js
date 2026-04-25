import {
  PASSWORD_MIN_LENGTH,
  isStrongPassword,
} from "../../../../shared/passwordPolicy";
import { ALL_USER_PERMISSION_KEYS } from "./usersManagementConfig";

const UPPERCASE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijkmnopqrstuvwxyz";
const NUMBER_CHARS = "23456789";
const SYMBOL_CHARS = "!@#$%";
const PASSWORD_CHARSET = `${UPPERCASE_CHARS}${LOWERCASE_CHARS}${NUMBER_CHARS}${SYMBOL_CHARS}`;
export const PASSWORD_REQUIREMENTS_MESSAGE = `يجب أن تتكون كلمة المرور من ${PASSWORD_MIN_LENGTH} أحرف على الأقل وأن تتضمن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.`;

const getRandomNumber = max => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const pickRandomChar = chars => chars[getRandomNumber(chars.length)];

const shuffleCharacters = value => {
  const chars = value.split("");

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomNumber(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars.join("");
};

export const createInitialUserForm = () => ({
  username: "",
  password: "",
  fullName: "",
  role: "user",
});

export const normalizePermissionList = (permissions = []) =>
  Array.from(new Set((permissions || []).filter(Boolean)));

export const buildCreateUserPayload = form => ({
  username: form?.username?.trim?.() || "",
  password: form?.password || "",
  fullName: form?.fullName?.trim?.() || "",
  role: form?.role || "user",
});

export const buildUserUpdatePayload = user => ({
  fullName: user?.FullName?.trim?.() || "",
  role: user?.Role || "user",
  isActive: user?.IsActive ? 1 : 0,
});

export const buildPermissionsPayload = permissions => ({
  permissions: normalizePermissionList(permissions),
});

export const validateNewUserForm = form => {
  if (
    !form?.fullName?.trim?.() ||
    !form?.username?.trim?.() ||
    !form?.password
  ) {
    return "جميع الحقول مطلوبة";
  }

  if (!isStrongPassword(form.password)) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return "";
};

export const validateResetPassword = newPassword => {
  if (!isStrongPassword(newPassword || "")) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return "";
};

export const generateTemporaryPassword = (length = 12) => {
  const safeLength = Math.max(
    PASSWORD_MIN_LENGTH,
    Math.min(32, Number(length) || 12)
  );
  const requiredChars = [
    pickRandomChar(UPPERCASE_CHARS),
    pickRandomChar(LOWERCASE_CHARS),
    pickRandomChar(NUMBER_CHARS),
  ];

  const remainingChars = Array.from(
    { length: Math.max(0, safeLength - requiredChars.length) },
    () => pickRandomChar(PASSWORD_CHARSET)
  );

  const password = shuffleCharacters(
    [...requiredChars, ...remainingChars].join("")
  );
  return isStrongPassword(password)
    ? password
    : generateTemporaryPassword(safeLength);
};

export const togglePermissionSelection = (permissions, key) =>
  permissions.includes(key)
    ? permissions.filter(permission => permission !== key)
    : [...permissions, key];

export const selectAllPermissions = () => [...ALL_USER_PERMISSION_KEYS];

export const clearPermissions = () => [];
