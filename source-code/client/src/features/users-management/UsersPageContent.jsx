import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import UserCreateModal from './components/UserCreateModal';
import UserEditModal from './components/UserEditModal';
import UserResetPasswordModal from './components/UserResetPasswordModal';
import UsersListCard from './components/UsersListCard';
import useUsersManagementState from './useUsersManagementState';

export default function UsersPage({ onBack }) {
  const { api } = useAuth();
  const {
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
  } = useUsersManagementState({ api });

  return (
    <div className="page-shell">
      <PageHeader
        title="إدارة المستخدمين والصلاحيات"
        subtitle="إنشاء المستخدمين وتحديث الأدوار والصلاحيات"
        onBack={onBack}
      >
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus size={16} />
          <span>إضافة مستخدم</span>
        </button>
      </PageHeader>

      <div className="mx-auto max-w-5xl space-y-6 p-5">
        <UsersListCard
          users={users}
          loading={loading}
          onCreate={openCreateModal}
          onEdit={openEditModal}
          onResetPassword={openResetPasswordModal}
        />
      </div>

      {showCreateModal && (
        <UserCreateModal
          form={form}
          message={message}
          saving={saving}
          onClose={closeCreateModal}
          onSave={handleCreate}
          onFormChange={handleFormChange}
        />
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          permissions={editingPermissions}
          message={message}
          saving={saving}
          onClose={closeEditModal}
          onSave={handleUpdate}
          onUserChange={handleEditingUserChange}
          onTogglePermission={handleTogglePermission}
          onSelectAllPermissions={handleSelectAllPermissions}
          onClearPermissions={handleClearPermissions}
        />
      )}

      {resetPasswordUserId && (
        <UserResetPasswordModal
          message={message}
          newPassword={newPassword}
          saving={saving}
          onClose={closeResetPasswordModal}
          onGeneratePassword={handleGenerateResetPassword}
          onSave={handleResetPassword}
          onPasswordChange={setNewPassword}
        />
      )}
    </div>
  );
}
