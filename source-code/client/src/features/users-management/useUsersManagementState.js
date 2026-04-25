import { useCallback, useEffect, useState, useTransition } from "react";
import { trpc } from "../../utils/trpc";
import {
  buildCreateUserPayload,
  buildPermissionsPayload,
  buildUserUpdatePayload,
  clearPermissions,
  createInitialUserForm,
  generateTemporaryPassword,
  normalizePermissionList,
  selectAllPermissions,
  togglePermissionSelection,
  validateNewUserForm,
  validateResetPassword,
} from "./usersManagementHelpers";

export default function useUsersManagementState({ api }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState([]);
  const [form, setForm] = useState(createInitialUserForm());
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);

      try {
        const response = await trpc.users.list.query();
        setUsers(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setForm(createInitialUserForm());
    setMessage("");
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingUser(null);
    setEditingPermissions([]);
    setMessage("");
  }, []);

  const closeResetPasswordModal = useCallback(() => {
    setResetPasswordUserId(null);
    setNewPassword("");
    setMessage("");
  }, []);

  const openCreateModal = useCallback(() => {
    setForm(createInitialUserForm());
    setMessage("");
    setShowCreateModal(true);
  }, []);

  const openEditModal = useCallback(
    async user => {
      setEditingUser({ ...user });
      setMessage("");

      try {
        const permissions = await trpc.users.getPermissions.query({
          id: user.UserID,
        });
        setEditingPermissions(normalizePermissionList(permissions));
      } catch (error) {
        console.error(error);
        setEditingPermissions([]);
      }
    },
    [api]
  );

  const openResetPasswordModal = useCallback(userId => {
    setResetPasswordUserId(userId);
    setNewPassword("");
    setMessage("");
  }, []);

  const handleCreate = useCallback(async () => {
    const validationMessage = validateNewUserForm(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    try {
      await trpc.users.create.mutate(buildCreateUserPayload(form));
      closeCreateModal();
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }, [api, closeCreateModal, form, loadUsers]);

  const handleUpdate = useCallback(async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      await trpc.users.update.mutate({
        id: editingUser.UserID,
        ...buildUserUpdatePayload(editingUser),
      });

      if (editingUser.Role !== "admin") {
        await trpc.users.updatePermissions.mutate({
          id: editingUser.UserID,
          permissions: buildPermissionsPayload(editingPermissions),
        });
      }

      closeEditModal();
      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }, [api, closeEditModal, editingPermissions, editingUser, loadUsers]);

  const handleGenerateResetPassword = useCallback(() => {
    setNewPassword(generateTemporaryPassword());
    setMessage("");
  }, []);

  const handleResetPassword = useCallback(async () => {
    const validationMessage = validateResetPassword(newPassword);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    try {
      await trpc.users.resetPassword.mutate({
        id: resetPasswordUserId,
        newPassword: newPassword,
      });

      let copied = false;
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(newPassword);
          copied = true;
        }
      } catch (clipboardError) {
        console.warn("Could not copy the generated password.", clipboardError);
      }

      closeResetPasswordModal();
      window.alert(
        copied
          ? "تمت إعادة تعيين كلمة المرور ونسخها."
          : "تمت إعادة تعيين كلمة المرور بنجاح."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }, [api, closeResetPasswordModal, newPassword, resetPasswordUserId]);

  const handleFormChange = useCallback((key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  }, []);

  const handleEditingUserChange = useCallback(updater => {
    setEditingUser(current =>
      typeof updater === "function" ? updater(current) : updater
    );
  }, []);

  const handleTogglePermission = useCallback(key => {
    setEditingPermissions(current => togglePermissionSelection(current, key));
  }, []);

  const handleSelectAllPermissions = useCallback(() => {
    setEditingPermissions(selectAllPermissions());
  }, []);

  const handleClearPermissions = useCallback(() => {
    setEditingPermissions(clearPermissions());
  }, []);

  return {
    closeCreateModal,
    closeEditModal,
    closeResetPasswordModal,
    editingPermissions,
    editingUser,
    form,
    handleClearPermissions,
    handleCreate,
    handleEditingUserChange,
    handleFormChange,
    handleGenerateResetPassword,
    handleResetPassword,
    handleSelectAllPermissions,
    handleTogglePermission,
    handleUpdate,
    loading,
    message,
    newPassword,
    openCreateModal,
    openEditModal,
    openResetPasswordModal,
    resetPasswordUserId,
    saving,
    setNewPassword,
    showCreateModal,
    users,
  };
}
