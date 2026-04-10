import { useCallback, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import {
  accountFieldDefs,
  routeFieldDefs,
  SECTION_OPTIONS,
  showSectionLabel,
} from './defaultsManagementConfig';
import DefaultsListRow from './components/DefaultsListRow';
import DefaultsManagementEditorPanel from './components/DefaultsManagementEditorPanel';
import DefaultsManagementListPanel from './components/DefaultsManagementListPanel';
import DefaultsManagementToolbar from './components/DefaultsManagementToolbar';
import {
  buildAccountDefaultBadges,
  buildDefaultsPageCopy,
  buildRouteDefaultBadges,
} from './defaultsManagementPageHelpers';
import useDefaultsLookups from './useDefaultsLookups';
import useDefaultsManagementData from './useDefaultsManagementData';

export default function DefaultsManagementPage({ onBack }) {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [selectedSection, setSelectedSection] = useState(SECTION_OPTIONS[0].key);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const { lookups, loadingLookups } = useDefaultsLookups({
    api,
    onMessage: setMessage,
  });

  const defaultsState = useDefaultsManagementData({
    api,
    selectedSection,
    search,
    onMessage: setMessage,
  });

  const pageCopy = useMemo(() => buildDefaultsPageCopy({
    activeTab,
    accountFormId: defaultsState.accountForm.id,
    routeFormId: defaultsState.routeForm.id,
  }), [activeTab, defaultsState.accountForm.id, defaultsState.routeForm.id]);

  const isAccountTab = activeTab === 'account';
  const listRows = isAccountTab
    ? defaultsState.filteredAccountDefaults
    : defaultsState.filteredRouteDefaults;
  const activeForm = isAccountTab ? defaultsState.accountForm : defaultsState.routeForm;
  const setActiveForm = isAccountTab ? defaultsState.setAccountForm : defaultsState.setRouteForm;
  const activeFieldDefs = isAccountTab ? accountFieldDefs : routeFieldDefs;
  const handleReset = isAccountTab ? defaultsState.resetAccountForm : defaultsState.resetRouteForm;
  const handleSave = isAccountTab ? defaultsState.saveAccount : defaultsState.saveRoute;

  const renderDefaultsRow = useCallback((row) => {
    if (isAccountTab) {
      return (
        <DefaultsListRow
          key={row.id}
          active={defaultsState.accountForm.id === row.id}
          title={row.accountName || 'بدون اسم'}
          badges={buildAccountDefaultBadges(row, showSectionLabel)}
          onSelect={() => defaultsState.selectAccountRow(row)}
          onDelete={() => defaultsState.removeAccount(row.id)}
        />
      );
    }

    return (
      <DefaultsListRow
        key={row.id}
        active={defaultsState.routeForm.id === row.id}
        title={row.govName || 'بدون محافظة'}
        badges={buildRouteDefaultBadges(row, showSectionLabel)}
        onSelect={() => defaultsState.selectRouteRow(row)}
        onDelete={() => defaultsState.removeRoute(row.id)}
      />
    );
  }, [
    defaultsState,
    isAccountTab,
  ]);

  return (
    <div className="page-shell">
      <PageHeader
        title={'إدارة الافتراضيات'}
        subtitle={'ضبط افتراضيات التاجر والمسار لكل قسم'}
        onBack={onBack}
      >
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
          <Settings2 size={14} />
          <span>{'إدارة تشغيلية'}</span>
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-5">
        {message && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {message}
          </div>
        )}

        <DefaultsManagementToolbar
          sectionOptions={SECTION_OPTIONS}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <DefaultsManagementListPanel
            listTitle={pageCopy.listTitle}
            listRows={listRows}
            loadingDefaults={defaultsState.loadingDefaults}
            emptyLabel={pageCopy.emptyLabel}
            onReset={handleReset}
            renderRow={renderDefaultsRow}
          />

          <DefaultsManagementEditorPanel
            formTitle={pageCopy.formTitle}
            formSubtitle={pageCopy.formSubtitle}
            activeForm={activeForm}
            setActiveForm={setActiveForm}
            activeFieldDefs={activeFieldDefs}
            lookups={lookups}
            onReset={handleReset}
            onSave={handleSave}
            loadingLookups={loadingLookups}
            loadingDefaults={defaultsState.loadingDefaults}
            saving={defaultsState.saving}
            saveLabel={pageCopy.saveLabel}
          />
        </div>
      </div>
    </div>
  );
}
