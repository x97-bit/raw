import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Columns3, PlusCircle, Settings2 } from 'lucide-react';
import FieldConfigTransferPanel from './components/FieldConfigTransferPanel';
import FieldCustomFieldForm from './components/FieldCustomFieldForm';
import FieldCustomFieldsList from './components/FieldCustomFieldsList';
import FieldManagementScopeSelector from './components/FieldManagementScopeSelector';
import FieldVisibilityList from './components/FieldVisibilityList';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAvailableFieldConfigTargets,
  getDefaultFieldConfigTarget,
} from '../../utils/fieldConfigTargets';
import {
  FIELD_MANAGEMENT_SECTIONS as SECTIONS,
  SECTION_FIELDS_MAP,
} from '../../utils/fieldManagementConfig';
import {
  getSectionTargetFields,
  isConfiguredTransactionSection,
} from '../../utils/sectionScreenSpecs';
import useFieldManagementCustomFields from './useFieldManagementCustomFields';
import useFieldManagementVisibility from './useFieldManagementVisibility';

const ACTIVE_TAB_CLASS = 'bg-white/10 text-[#eef3f7] shadow-[0_14px_24px_rgba(0,0,0,0.16)] ring-1 ring-white/10';
const IDLE_TAB_CLASS = 'text-[#91a0ad] hover:bg-white/8 hover:text-[#eef3f7]';

export default function FieldManagementPage({ onBack }) {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('visibility');
  const [selectedSection, setSelectedSection] = useState('port-1');
  const [selectedTarget, setSelectedTarget] = useState(getDefaultFieldConfigTarget('port-1'));
  const [message, setMessage] = useState('');
  const messageTimeoutRef = useRef(null);

  const showMessage = useCallback((nextMessage, duration = 3000) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage(nextMessage);
    messageTimeoutRef.current = setTimeout(() => {
      setMessage('');
      messageTimeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => () => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
  }, []);

  const availableTargets = getAvailableFieldConfigTargets(selectedSection);

  useEffect(() => {
    if (!availableTargets.some((target) => target.key === selectedTarget)) {
      setSelectedTarget(getDefaultFieldConfigTarget(selectedSection));
    }
  }, [availableTargets, selectedSection, selectedTarget]);

  const getSectionFieldsForTarget = useCallback((sectionKey, targetKey) => {
    if (isConfiguredTransactionSection(sectionKey)) {
      return getSectionTargetFields(sectionKey, targetKey);
    }
    return SECTION_FIELDS_MAP[sectionKey] || [];
  }, []);

  const customFieldsState = useFieldManagementCustomFields({
    api,
    availableTargets,
    selectedSection,
    selectedTarget,
    getSectionFieldsForTarget,
    showMessage,
  });

  const visibilityState = useFieldManagementVisibility({
    api,
    customFieldsList: customFieldsState.customFieldsList,
    selectedSection,
    selectedTarget,
    getSectionFieldsForTarget,
    showMessage,
  });

  const saving = visibilityState.saving || customFieldsState.saving;
  const currentSectionLabel = SECTIONS.find((section) => section.key === selectedSection)?.label;
  const currentTargetLabel = availableTargets.find((target) => target.key === selectedTarget)?.label || 'الواجهة العامة';
  const currentConfigLabel = `${currentSectionLabel} - ${currentTargetLabel}`;
  const isErrorMessage = message.includes('خطأ');

  return (
    <div className="page-shell" dir="rtl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-6">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl bg-white/6 px-3.5 py-2.5 text-sm font-semibold text-[#c8d4df] transition-all duration-200 hover:bg-white/10 hover:text-[#eef3f7]"
          >
            <ArrowRight size={18} />
            <span>رجوع</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[#eef3f7]">
              <Settings2 size={20} />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-black text-[#eef3f7]">إدارة الحقول</h1>
              <p className="text-sm text-[#91a0ad]">تنظيم الظهور والترتيب والحقول المخصصة لكل شاشة.</p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-2xl px-4 py-3 text-center text-sm font-semibold ${
              isErrorMessage
                ? 'bg-[rgba(183,97,105,0.14)] text-[#e2bcc2]'
                : 'bg-[rgba(59,143,121,0.16)] text-[#b9d8cf]'
            }`}
          >
            {message}
          </div>
        )}

        <div className="inline-flex w-full max-w-md rounded-[1.35rem] bg-white/6 p-1.5 shadow-[0_16px_28px_rgba(0,0,0,0.16)]">
          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-semibold transition-all duration-200 ${activeTab === 'visibility' ? ACTIVE_TAB_CLASS : IDLE_TAB_CLASS}`}
          >
            <Columns3 size={16} />
            إظهار وإخفاء الحقول
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-semibold transition-all duration-200 ${activeTab === 'custom' ? ACTIVE_TAB_CLASS : IDLE_TAB_CLASS}`}
          >
            <PlusCircle size={16} />
            حقول مخصصة
          </button>
        </div>

        <div className="space-y-4">
          <FieldManagementScopeSelector
            sections={SECTIONS}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            availableTargets={availableTargets}
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            currentSectionLabel={currentSectionLabel}
            currentTargetLabel={currentTargetLabel}
          />

          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <FieldConfigTransferPanel
                show={visibilityState.showExportImport}
                onToggle={visibilityState.toggleExportImportPanel}
                currentConfigLabel={currentConfigLabel}
                currentTargetLabel={currentTargetLabel}
                compatibleTargetSections={visibilityState.compatibleTargetSections}
                targetSections={visibilityState.targetSections}
                saving={saving}
                onSelectAllTargetSections={visibilityState.selectAllTargetSections}
                onToggleTargetSection={visibilityState.toggleTargetSection}
                onCopySettingsToSections={visibilityState.copySettingsToSections}
                onImportFromSection={visibilityState.importFromSection}
              />

              <FieldVisibilityList
                loading={visibilityState.loading}
                currentConfigLabel={currentConfigLabel}
                visibleCount={visibilityState.visibleCount}
                fieldConfigs={visibilityState.fieldConfigs}
                dragIndex={visibilityState.dragIndex}
                dragOverIndex={visibilityState.dragOverIndex}
                touchDragIndex={visibilityState.touchDragIndex}
                editingDisplayLabelKey={visibilityState.editingDisplayLabelKey}
                editingDisplayLabelValue={visibilityState.editingDisplayLabelValue}
                saving={saving}
                onDragStart={visibilityState.handleDragStart}
                onDragEnter={visibilityState.handleDragEnter}
                onDragOver={visibilityState.handleDragOver}
                onDragEnd={visibilityState.handleDragEnd}
                onDragLeave={visibilityState.handleDragLeave}
                onStartDisplayLabelEdit={visibilityState.startDisplayLabelEdit}
                onEditingDisplayLabelValueChange={visibilityState.setEditingDisplayLabelValue}
                onSaveDisplayLabelEdit={visibilityState.saveDisplayLabelEdit}
                onCancelDisplayLabelEdit={visibilityState.cancelDisplayLabelEdit}
                onResetDisplayLabelValue={() => visibilityState.setEditingDisplayLabelValue('')}
                onMoveTouchItem={visibilityState.moveTouchItem}
                onToggleVisibility={visibilityState.toggleVisibility}
                onSaveConfigs={visibilityState.saveConfigs}
              />
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <FieldCustomFieldForm
                showAddForm={customFieldsState.showAddForm}
                onShow={() => customFieldsState.setShowAddForm(true)}
                onHide={() => customFieldsState.setShowAddForm(false)}
                newField={customFieldsState.newField}
                setNewField={customFieldsState.setNewField}
                availableTargets={availableTargets}
                selectedTargets={customFieldsState.selectedNewFieldTargets}
                onToggleTarget={customFieldsState.toggleTarget}
                compatibleSections={customFieldsState.compatibleSectionsForNewFieldTargets}
                onToggleSection={customFieldsState.toggleSection}
                onSelectAllSections={customFieldsState.selectAllSections}
                getAvailableFormulaFields={customFieldsState.getAvailableFormulaFields}
                onAddFormulaPart={customFieldsState.addFormulaPart}
                onRemoveFormulaPart={customFieldsState.removeFormulaPart}
                onUpdateFormulaPart={customFieldsState.updateFormulaPart}
                getFormulaPreview={customFieldsState.getFormulaPreview}
                saving={saving}
                onSave={customFieldsState.addCustomField}
              />

              <FieldCustomFieldsList
                currentConfigLabel={currentConfigLabel}
                currentCustomFields={customFieldsState.currentCustomFields}
                editingFieldId={customFieldsState.editingFieldId}
                editingLabel={customFieldsState.editingLabel}
                onEditingLabelChange={customFieldsState.setEditingLabel}
                editingFormula={customFieldsState.editingFormula}
                editingAvailableTargets={customFieldsState.editingAvailableTargets}
                editingCurrentTargets={customFieldsState.editingCurrentTargets}
                onToggleEditingTarget={customFieldsState.toggleEditingTarget}
                currentTargetLabel={currentTargetLabel}
                editingCompatibleSections={customFieldsState.editingCompatibleSections}
                editingSections={customFieldsState.editingSections}
                onSelectAllEditingSections={customFieldsState.selectAllEditingSections}
                onToggleEditingSection={customFieldsState.toggleEditingSection}
                onUpdateEditFormulaPart={customFieldsState.updateEditFormulaPart}
                getEditFormulaFields={customFieldsState.getEditFormulaFields}
                onRemoveEditFormulaPart={customFieldsState.removeEditFormulaPart}
                onAddEditFormulaPart={customFieldsState.addEditFormulaPart}
                getEditFormulaPreview={customFieldsState.getEditFormulaPreview}
                onSaveEditField={customFieldsState.saveEditField}
                onCancelEditField={customFieldsState.cancelEditField}
                onStartEditField={customFieldsState.startEditField}
                onDeleteCustomField={customFieldsState.deleteCustomField}
                resolveFormulaTokenLabel={customFieldsState.resolveFormulaTokenLabel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
