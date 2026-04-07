import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Plus, Trash2, Save, Settings2, Columns3, PlusCircle, GripVertical, X, Pencil, Check, Download, Upload, Copy, ArrowLeftRight, FileText, ClipboardList, CreditCard } from 'lucide-react';
import {
  buildFieldConfigKey,
  expandFieldSectionsForTarget,
  getAvailableFieldConfigTargets,
  getDefaultFieldConfigTarget,
  isSectionTargetCompatible,
  matchesFieldTarget,
  usesLegacyFieldConfigFallback,
} from '../utils/fieldConfigTargets';
import { normalizeFieldLabel } from '../utils/fieldConfigMetadata';
import { getSectionTargetFields, isConfiguredTransactionSection } from '../utils/sectionScreenSpecs';

const DEBT_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'account_name', label: 'الشخص', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'fee_usd', label: 'الرسوم ($)', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ (د.ع)', type: 'number' },
  { key: 'fee_iqd', label: 'الرسوم (د.ع)', type: 'number' },
  { key: 'trans_type', label: 'النوع', type: 'text' },
  { key: 'state', label: 'الحالة', type: 'text' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

const SPECIAL_HAIDER_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'driver_name', label: 'السائق', type: 'text' },
  { key: 'vehicle_plate', label: 'السيارة', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'weight', label: 'الوزن', type: 'number' },
  { key: 'cost_usd', label: 'التكلفة ($)', type: 'money' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'profit_usd', label: 'الربح ($)', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ (د.ع)', type: 'number' },
];


const SPECIAL_PARTNER_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'port_name', label: 'المنفذ', type: 'text' },
  { key: 'trader_name', label: 'التاجر', type: 'text' },
  { key: 'driver_name', label: 'السائق', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'gov_name', label: 'الجهة الحكومية', type: 'text' },
  { key: 'qty', label: 'الكمية', type: 'number' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'amount_usd_partner', label: 'الشريك ($)', type: 'money' },
  { key: 'clr', label: 'CLR', type: 'number' },
  { key: 'tx', label: 'TX', type: 'number' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

const FX_FIELDS = [
  { key: 'ref_no', label: 'رقم الوصل', type: 'text' },
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'account_name', label: 'اسم التاجر', type: 'text' },
  { key: 'currency', label: 'العملة', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ دولار', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ دينار', type: 'money' },
  { key: 'cost_usd', label: 'التكلفة بالدولار', type: 'money' },
  { key: 'cost_iqd', label: 'التكلفة بالدينار', type: 'money' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

const TRIAL_BALANCE_FIELDS = [
  { key: 'account_name', label: 'الحساب', type: 'text' },
  { key: 'account_type', label: 'النوع', type: 'text' },
  { key: 'shipment_count', label: 'عدد الشحنات', type: 'number' },
  { key: 'debit_usd', label: 'مدين ($)', type: 'money' },
  { key: 'credit_usd', label: 'دائن ($)', type: 'money' },
  { key: 'balance_usd', label: 'الرصيد ($)', type: 'money' },
  { key: 'debit_iqd', label: 'مدين (د.ع)', type: 'money' },
  { key: 'credit_iqd', label: 'دائن (د.ع)', type: 'money' },
  { key: 'balance_iqd', label: 'الرصيد (د.ع)', type: 'money' },
  { key: 'transaction_count', label: 'المعاملات', type: 'number' },
];

const REPORTS_FIELDS = [
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'ref_no', label: 'المرجع', type: 'text' },
  { key: 'account_name', label: 'التاجر', type: 'text' },
  { key: 'good_type', label: 'البضاعة', type: 'text' },
  { key: 'weight', label: 'الوزن', type: 'number' },
  { key: 'cost_usd', label: 'التكلفة ($)', type: 'money' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'profit_usd', label: 'الربح ($)', type: 'money' },
  { key: 'notes', label: 'ملاحظات', type: 'text' },
];

const PAYMENT_MATCHING_FIELDS = [
  { key: 'account_name', label: 'الحساب', type: 'text' },
  { key: 'unpaid_count', label: 'غير مسدد', type: 'number' },
  { key: 'remaining_usd', label: 'المتبقي ($)', type: 'money' },
  { key: 'remaining_iqd', label: 'المتبقي (د.ع)', type: 'money' },
  { key: 'trans_date', label: 'التاريخ', type: 'date' },
  { key: 'ref_no', label: 'المرجع', type: 'text' },
  { key: 'amount_usd', label: 'المبلغ ($)', type: 'money' },
  { key: 'amount_iqd', label: 'المبلغ (د.ع)', type: 'money' },
  { key: 'paid_usd', label: 'المسدد ($)', type: 'money' },
  { key: 'payment_status', label: 'حالة التسديد', type: 'text' },
];

// Map section keys to their default fields
const SECTION_FIELDS_MAP = {
  'debts': DEBT_FIELDS,
  'special-haider': SPECIAL_HAIDER_FIELDS,
  'special-partner': SPECIAL_PARTNER_FIELDS,
  'fx-1': FX_FIELDS,
  'reports': REPORTS_FIELDS,
  'trial-balance': TRIAL_BALANCE_FIELDS,
  'payment-matching': PAYMENT_MATCHING_FIELDS,
};

const SECTIONS = [
  { key: 'port-1', label: 'السعودية', group: 'المنافذ' },
  { key: 'port-2', label: 'المنذرية', group: 'المنافذ' },
  { key: 'port-3', label: 'القائم', group: 'المنافذ' },
  { key: 'transport-1', label: 'النقل', group: 'النقل والشراكة' },
  { key: 'partnership-1', label: 'الشراكة', group: 'النقل والشراكة' },
  { key: 'debts', label: 'الديون', group: 'الإدارة' },
  { key: 'special-haider', label: 'حيدر شركة الأنوار', group: 'حسابات خاصة' },
  { key: 'special-partner', label: 'ياسر عادل', group: 'حسابات خاصة' },
  { key: 'fx-1', label: 'الصيرفة', group: 'الإدارة' },
  { key: 'reports', label: 'التقارير', group: 'الإدارة' },
  { key: 'trial-balance', label: 'ميزان المراجعة', group: 'الإدارة' },
  { key: 'payment-matching', label: 'ربط التسديد', group: 'الإدارة' },
];

const TARGET_SCREEN_META = {
  list: { icon: ClipboardList, description: 'إعدادات القائمة وكشف الحركة' },
  statement: { icon: ClipboardList, description: 'إعدادات شاشة كشف الحساب والجداول' },
  invoice: { icon: FileText, description: 'إعدادات نموذج إضافة الفاتورة' },
  payment: { icon: CreditCard, description: 'إعدادات نموذج التسديد' },
  default: { icon: Columns3, description: 'إعدادات الشاشة العامة لهذا القسم' },
};

const FIELD_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'money', label: 'مبلغ مالي' },
  { value: 'date', label: 'تاريخ' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'formula', label: 'عملية حسابية' },
];

const OPERATORS = [
  { value: '+', label: '+', title: 'جمع' },
  { value: '-', label: '−', title: 'طرح' },
  { value: '*', label: '×', title: 'ضرب' },
  { value: '/', label: '÷', title: 'قسمة' },
];

export default function FieldManagementPage({ onBack }) {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('visibility');
  const [selectedSection, setSelectedSection] = useState('port-1');
  const [selectedTarget, setSelectedTarget] = useState(getDefaultFieldConfigTarget('port-1'));
  const [fieldConfigs, setFieldConfigs] = useState([]);
  const [customFieldsList, setCustomFieldsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Drag and drop state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItemRef = useRef(null);
  const [editingDisplayLabelKey, setEditingDisplayLabelKey] = useState(null);
  const [editingDisplayLabelValue, setEditingDisplayLabelValue] = useState('');

  // Edit custom field state
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingFormula, setEditingFormula] = useState(null); // { id, label, fieldType, formulaParts, options, defaultValue, placement }
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingSections, setEditingSections] = useState([]);

  // Export/Import state
  const [showExportImport, setShowExportImport] = useState(false);
  const [targetSections, setTargetSections] = useState([]);

  // New custom field form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'text',
    options: '',
    defaultValue: '',
    placement: 'transaction',
    sections: [],
    formulaParts: [{ type: 'field', value: '' }], // for formula type
  });

  // Show message helper
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const availableTargets = getAvailableFieldConfigTargets(selectedSection);
  const activeConfigKey = buildFieldConfigKey(selectedSection, selectedTarget);
  const compatibleSectionsForSelectedTarget = SECTIONS.filter((section) => isSectionTargetCompatible(section.key, selectedTarget));
  const compatibleTargetSections = compatibleSectionsForSelectedTarget.filter((section) => section.key !== selectedSection);

  const getSectionFieldsForTarget = useCallback((sectionKey, targetKey) => {
    if (isConfiguredTransactionSection(sectionKey)) {
      return getSectionTargetFields(sectionKey, targetKey);
    }
    return SECTION_FIELDS_MAP[sectionKey] || [];
  }, []);

  const loadFieldConfigSet = useCallback(async (sectionKey, targetKey) => {
    const configKey = buildFieldConfigKey(sectionKey, targetKey);
    const configs = await api(`/field-config/${configKey}`);
    if (configs?.length > 0) return configs;
    if (usesLegacyFieldConfigFallback(targetKey) && configKey !== sectionKey) {
      return api(`/field-config/${sectionKey}`);
    }
    return configs || [];
  }, [api]);

  useEffect(() => {
    if (!availableTargets.some(target => target.key === selectedTarget)) {
      setSelectedTarget(getDefaultFieldConfigTarget(selectedSection));
    }
  }, [availableTargets, selectedSection, selectedTarget]);

  // Load field configs for selected section
  const loadFieldConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const [configs, allCustoms] = await Promise.all([
        loadFieldConfigSet(selectedSection, selectedTarget),
        api('/custom-fields'),
      ]);
      setCustomFieldsList(allCustoms);
      const scopedCustoms = allCustoms.filter((field) => matchesFieldTarget(field, selectedSection, selectedTarget));

      const sectionFields = getSectionFieldsForTarget(selectedSection, selectedTarget);
      const allFields = [...sectionFields];
      scopedCustoms.forEach(cf => {
        if (!allFields.find(f => f.key === cf.fieldKey)) {
          allFields.push({
            key: cf.fieldKey,
            label: cf.label,
            type: cf.fieldType,
            isCustom: true,
            customId: cf.id,
          });
        }
      });

      const merged = allFields.map((f, index) => {
        const config = configs.find(c => c.fieldKey === f.key);
        const baseLabel = f.baseLabel || f.label;
        return {
          ...f,
          label: baseLabel,
          baseLabel,
          displayLabel: typeof config?.displayLabel === 'string' ? config.displayLabel : '',
          visible: config
            ? (config.visible === 1 || config.visible === true)
            : (f.isCustom ? false : true),
          sortOrder: config ? (config.sortOrder || 0) : index + 1,
        };
      });

      merged.sort((a, b) => a.sortOrder - b.sortOrder);
      setFieldConfigs(merged);
    } catch (e) {
      console.error('Failed to load field configs:', e);
    }
    setLoading(false);
  }, [api, getSectionFieldsForTarget, loadFieldConfigSet, selectedSection, selectedTarget]);

  useEffect(() => {
    loadFieldConfigs();
  }, [loadFieldConfigs]);

  // Load custom fields list
  const loadCustomFields = useCallback(async () => {
    try {
      const customs = await api('/custom-fields');
      setCustomFieldsList(customs);
    } catch (e) {
      console.error(e);
    }
  }, [api]);

  useEffect(() => {
    if (activeTab === 'custom') loadCustomFields();
  }, [activeTab, loadCustomFields]);

  const getCompatibleSectionsForTarget = useCallback((targetKey) => {
    return SECTIONS.filter((section) => isSectionTargetCompatible(section.key, targetKey));
  }, []);

  useEffect(() => {
    setTargetSections((prev) => prev.filter((sectionKey) => compatibleTargetSections.some((section) => section.key === sectionKey)));
    setNewField((prev) => ({
      ...prev,
      sections: prev.sections.filter((sectionKey) => compatibleSectionsForSelectedTarget.some((section) => section.key === sectionKey)),
    }));
  }, [selectedSection, selectedTarget]);

  useEffect(() => {
    if (!editingFieldId) return;
    const targetKey = editingTarget || selectedTarget;
    const compatibleSections = getCompatibleSectionsForTarget(targetKey);
    setEditingSections((prev) => {
      const filtered = prev.filter((sectionKey) => compatibleSections.some((section) => section.key === sectionKey));
      if (filtered.length > 0) return filtered;
      if (compatibleSections.some((section) => section.key === selectedSection)) {
        return [selectedSection];
      }
      return compatibleSections[0] ? [compatibleSections[0].key] : [];
    });
  }, [editingFieldId, editingTarget, getCompatibleSectionsForTarget, selectedSection, selectedTarget]);

  const getCustomFieldsForSections = useCallback((sectionKeys = [], targetKey = selectedTarget) => {
    const keys = sectionKeys.length > 0 ? sectionKeys : [selectedSection];
    return customFieldsList.filter((field) => {
      return keys.some((key) => matchesFieldTarget(field, key, targetKey));
    });
  }, [customFieldsList, selectedSection, selectedTarget]);

  // Toggle field visibility
  const toggleVisibility = (key) => {
    setFieldConfigs(prev => prev.map(f => f.key === key ? { ...f, visible: !f.visible } : f));
  };

  const updateDisplayLabel = (key, value) => {
    setFieldConfigs(prev => prev.map((field) => (
      field.key === key
        ? { ...field, displayLabel: value }
        : field
    )));
  };

  const startDisplayLabelEdit = (field) => {
    setEditingDisplayLabelKey(field.key);
    setEditingDisplayLabelValue(field.displayLabel || '');
  };

  const cancelDisplayLabelEdit = () => {
    setEditingDisplayLabelKey(null);
    setEditingDisplayLabelValue('');
  };

  const saveDisplayLabelEdit = (field) => {
    updateDisplayLabel(field.key, editingDisplayLabelValue.trim());
    cancelDisplayLabelEdit();
  };

  // ==================== DRAG AND DROP ====================
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    dragItemRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image semi-transparent
    const el = e.currentTarget;
    el.style.opacity = '0.5';
    setTimeout(() => { el.style.opacity = '1'; }, 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (dragItemRef.current === null) return;
    setDragOverIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newConfigs = [...fieldConfigs];
      const [draggedItem] = newConfigs.splice(dragIndex, 1);
      newConfigs.splice(dragOverIndex, 0, draggedItem);
      newConfigs.forEach((f, i) => f.sortOrder = i + 1);
      setFieldConfigs(newConfigs);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleDragLeave = (e) => {
    // Only reset if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  // ==================== TOUCH DRAG (mobile) ====================
  const [touchDragIndex, setTouchDragIndex] = useState(null);

  const moveTouchItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= fieldConfigs.length) return;
    const newConfigs = [...fieldConfigs];
    const [item] = newConfigs.splice(fromIndex, 1);
    newConfigs.splice(toIndex, 0, item);
    newConfigs.forEach((f, i) => f.sortOrder = i + 1);
    setFieldConfigs(newConfigs);
    setTouchDragIndex(toIndex);
  };

  // ==================== SAVE ====================
  const saveConfigs = async () => {
    setSaving(true);
    try {
      const fields = fieldConfigs.map((f, i) => ({
        fieldKey: f.key,
        visible: f.visible,
        sortOrder: i + 1,
        displayLabel: f.displayLabel || '',
      }));
      await api(`/field-config/${activeConfigKey}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      });
      showMessage('تم حفظ إعدادات الحقول بنجاح');
      cancelDisplayLabelEdit();
    } catch (e) {
      showMessage('خطأ في الحفظ: ' + e.message);
    }
    setSaving(false);
  };

  // ==================== CUSTOM FIELD CRUD ====================
  const expandSectionsForTarget = useCallback((sections) => {
    const baseSections = (sections && sections.length > 0 ? sections : [selectedSection]).filter(Boolean);
    return expandFieldSectionsForTarget(baseSections, selectedTarget);
  }, [selectedSection, selectedTarget]);

  const addCustomField = async () => {
    if (!newField.label.trim()) {
      showMessage('يرجى إدخال اسم الحقل');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: newField.label,
        fieldType: newField.fieldType,
        options: newField.fieldType === 'select' ? newField.options.split(',').map(s => s.trim()).filter(Boolean) : null,
        defaultValue: newField.defaultValue || null,
        placement: newField.placement,
        sections: expandSectionsForTarget(newField.sections),
        formula: newField.fieldType === 'formula' ? { parts: newField.formulaParts } : null,
      };
      // Validate formula
      if (newField.fieldType === 'formula') {
        const fieldParts = newField.formulaParts.filter(p => p.type === 'field');
        if (fieldParts.length < 2 || fieldParts.some(p => !p.value)) {
          showMessage('يرجى اختيار حقلين على الأقل في المعادلة');
          setSaving(false);
          return;
        }
      }
      await api('/custom-fields', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showMessage('تم إضافة الحقل المخصص بنجاح');
      setShowAddForm(false);
      setNewField({ label: '', fieldType: 'text', options: '', defaultValue: '', placement: 'transaction', sections: [], formulaParts: [{ type: 'field', value: '' }] });
      loadCustomFields();
      loadFieldConfigs();
    } catch (e) {
      showMessage('خطأ: ' + e.message);
    }
    setSaving(false);
  };

  const deleteCustomField = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحقل المخصص؟ سيتم حذف جميع القيم المرتبطة به.')) return;
    try {
      await api(`/custom-fields/${id}`, { method: 'DELETE' });
      showMessage('تم حذف الحقل المخصص');
      loadCustomFields();
      loadFieldConfigs();
    } catch (e) {
      showMessage('خطأ: ' + e.message);
    }
  };

  // ==================== EDIT CUSTOM FIELD (NAME + FORMULA) ====================
  const startEditField = (cf) => {
    const initialTarget = selectedTarget;
    const initialSections = getCompatibleSectionsForTarget(initialTarget)
      .filter((section) => matchesFieldTarget(cf, section.key, initialTarget))
      .map((section) => section.key);
    setEditingFieldId(cf.id);
    setEditingLabel(cf.label);
    setEditingTarget(initialTarget);
    setEditingSections(initialSections.length > 0 ? initialSections : [selectedSection]);
    // If it's a formula field, also load formula for editing
    if (cf.fieldType === 'formula' && cf.formula?.parts) {
      setEditingFormula({
        id: cf.id,
        label: cf.label,
        fieldType: cf.fieldType,
        formulaParts: [...cf.formula.parts],
        options: cf.options,
        defaultValue: cf.defaultValue,
        placement: cf.placement,
      });
    } else {
      setEditingFormula(null);
    }
  };

  const cancelEditField = () => {
    setEditingFieldId(null);
    setEditingLabel('');
    setEditingFormula(null);
    setEditingTarget(null);
    setEditingSections([]);
  };

  const saveEditField = async (id) => {
    if (!editingLabel.trim()) {
      showMessage('اسم الحقل لا يمكن أن يكون فارغاً');
      return;
    }
    try {
      const cf = customFieldsList.find(c => c.id === id);
      const targetKey = editingTarget || selectedTarget;
      const baseSections = editingSections.length > 0 ? editingSections : [selectedSection];
      if (!cf) {
        showMessage('تعذر العثور على الحقل المطلوب');
        return;
      }
      const payload = {
        label: editingLabel,
        fieldType: cf.fieldType,
        options: cf.options,
        defaultValue: cf.defaultValue,
        placement: cf.placement,
        sections: expandFieldSectionsForTarget(baseSections, targetKey),
      };
      // Include updated formula if editing a formula field
      if (editingFormula && cf.fieldType === 'formula') {
        const fieldParts = editingFormula.formulaParts.filter(p => p.type === 'field');
        if (fieldParts.length < 2 || fieldParts.some(p => !p.value)) {
          showMessage('يرجى اختيار حقلين على الأقل في المعادلة');
          return;
        }
        payload.formula = { parts: editingFormula.formulaParts };
      }
      await api(`/custom-fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showMessage('تم تحديث الحقل بنجاح');
      setEditingFieldId(null);
      setEditingLabel('');
      setEditingFormula(null);
      setEditingTarget(null);
      setEditingSections([]);
      loadCustomFields();
      loadFieldConfigs();
    } catch (e) {
      showMessage('خطأ في التحديث: ' + e.message);
    }
  };

  // ==================== EDITING FORMULA HELPERS ====================
  const addEditFormulaPart = () => {
    setEditingFormula(prev => ({
      ...prev,
      formulaParts: [
        ...prev.formulaParts,
        { type: 'operator', value: '+' },
        { type: 'field', value: '' },
      ],
    }));
  };

  const removeEditFormulaPart = (index) => {
    setEditingFormula(prev => {
      const parts = [...prev.formulaParts];
      if (index > 0) {
        parts.splice(index - 1, 2);
      } else if (parts.length > 1) {
        parts.splice(0, 2);
      }
      if (parts.length === 0) {
        return { ...prev, formulaParts: [{ type: 'field', value: '' }] };
      }
      return { ...prev, formulaParts: parts };
    });
  };

  const updateEditFormulaPart = (index, value) => {
    setEditingFormula(prev => {
      const parts = [...prev.formulaParts];
      parts[index] = { ...parts[index], value };
      return { ...prev, formulaParts: parts };
    });
  };

  // Get available formula fields for editing in the current target and selected sections
  const getEditFormulaFields = () => {
    const fieldsMap = new Map();
    const targetKey = editingTarget || selectedTarget;
    const sectionKeys = editingSections.length > 0 ? editingSections : [selectedSection];
    sectionKeys.forEach((sectionKey) => {
      getSectionFieldsForTarget(sectionKey, targetKey)
        .filter(f => ['number', 'money'].includes(f.type))
        .forEach(f => {
          if (!fieldsMap.has(f.key)) fieldsMap.set(f.key, f);
        });
    });
    getCustomFieldsForSections(sectionKeys, targetKey)
      .filter(cf => ['number', 'money'].includes(cf.fieldType))
      .filter(cf => cf.id !== editingFieldId)
      .forEach(cf => {
        if (!fieldsMap.has(cf.fieldKey)) {
          fieldsMap.set(cf.fieldKey, { key: cf.fieldKey, label: cf.label, type: cf.fieldType, isCustom: true });
        }
      });
    return Array.from(fieldsMap.values());
  };

  const getEditFormulaPreview = () => {
    if (!editingFormula) return '';
    const availableFields = getEditFormulaFields();
    return editingFormula.formulaParts.map(p => {
      if (p.type === 'operator') {
        const op = OPERATORS.find(o => o.value === p.value);
        return ` ${op?.label || p.value} `;
      }
      const field = availableFields.find(f => f.key === p.value);
      return field ? field.label : '(اختر حقل)';
    }).join('');
  };

  // ==================== EXPORT/IMPORT FIELD SETTINGS ====================
  const toggleTargetSection = (key) => {
    setTargetSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const selectAllTargetSections = () => {
    const otherSections = compatibleTargetSections.map(s => s.key);
    setTargetSections(prev => prev.length === otherSections.length ? [] : otherSections);
  };

  const copySettingsToSections = async () => {
    if (targetSections.length === 0) {
      showMessage('يرجى اختيار قسم واحد على الأقل');
      return;
    }
    setSaving(true);
    try {
      // Get current section's field configs
      const fields = fieldConfigs.map((f, i) => ({
        fieldKey: f.key,
        visible: f.visible,
        sortOrder: i + 1,
        displayLabel: f.displayLabel || '',
      }));

      // Apply to each target section
      let successCount = 0;
      for (const sectionKey of targetSections) {
        try {
          await api(`/field-config/${buildFieldConfigKey(sectionKey, selectedTarget)}`, {
            method: 'PUT',
            body: JSON.stringify({ fields }),
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to copy to ${sectionKey}:`, e);
        }
      }

      showMessage(`تم نسخ الإعدادات إلى ${successCount} من ${targetSections.length} أقسام بنجاح`);
      setShowExportImport(false);
      setTargetSections([]);
    } catch (e) {
      showMessage('خطأ في النسخ: ' + e.message);
    }
    setSaving(false);
  };

  const importFromSection = async (sourceKey) => {
    setSaving(true);
    try {
      // Load source section configs
      const sourceConfigs = await loadFieldConfigSet(sourceKey, selectedTarget);
      const fields = sourceConfigs.map(c => ({
        fieldKey: c.fieldKey,
        visible: c.visible === 1 || c.visible === true,
        sortOrder: c.sortOrder || 0,
        displayLabel: c.displayLabel || '',
      }));

      // Apply to current section
      await api(`/field-config/${activeConfigKey}`, {
        method: 'PUT',
        body: JSON.stringify({ fields }),
      });

      showMessage(`تم استيراد إعدادات ${SECTIONS.find(s => s.key === sourceKey)?.label} بنجاح`);
      setShowExportImport(false);
      loadFieldConfigs();
    } catch (e) {
      showMessage('خطأ في الاستيراد: ' + e.message);
    }
    setSaving(false);
  };

  // ==================== FORMULA BUILDER HELPERS ====================
  const addFormulaPart = () => {
    setNewField(prev => ({
      ...prev,
      formulaParts: [
        ...prev.formulaParts,
        { type: 'operator', value: '+' },
        { type: 'field', value: '' },
      ],
    }));
  };

  const removeFormulaPart = (index) => {
    setNewField(prev => {
      const parts = [...prev.formulaParts];
      // Remove the field and its preceding operator (if exists)
      if (index > 0) {
        parts.splice(index - 1, 2); // remove operator + field
      } else if (parts.length > 1) {
        parts.splice(0, 2); // remove field + following operator
      }
      if (parts.length === 0) {
        return { ...prev, formulaParts: [{ type: 'field', value: '' }] };
      }
      return { ...prev, formulaParts: parts };
    });
  };

  const updateFormulaPart = (index, value) => {
    setNewField(prev => {
      const parts = [...prev.formulaParts];
      parts[index] = { ...parts[index], value };
      return { ...prev, formulaParts: parts };
    });
  };

  // Get available fields for formula based on selected sections
  const getAvailableFormulaFields = () => {
    // Collect fields from all selected sections, deduplicate by key
    const fieldsMap = new Map();
    const sections = newField.sections.length > 0 ? newField.sections : [selectedSection];
    sections.forEach(sKey => {
      const sectionFields = getSectionFieldsForTarget(sKey, selectedTarget);
      sectionFields.filter(f => ['number', 'money'].includes(f.type)).forEach(f => {
        if (!fieldsMap.has(f.key)) fieldsMap.set(f.key, f);
      });
    });
    getCustomFieldsForSections(sections, selectedTarget)
      .filter(cf => ['number', 'money'].includes(cf.fieldType))
      .forEach(cf => {
        if (!fieldsMap.has(cf.fieldKey)) {
          fieldsMap.set(cf.fieldKey, { key: cf.fieldKey, label: cf.label, type: cf.fieldType, isCustom: true });
        }
      });
    return Array.from(fieldsMap.values());
  };

  // Build formula preview text
  const getFormulaPreview = () => {
    const availableFields = getAvailableFormulaFields();
    return newField.formulaParts.map(p => {
      if (p.type === 'operator') {
        const op = OPERATORS.find(o => o.value === p.value);
        return op ? ` ${op.label} ` : ` ${p.value} `;
      }
      const field = availableFields.find(f => f.key === p.value);
      return field ? field.label : '(اختر حقل)';
    }).join('');
  };

  // Toggle section in new field form
  const toggleSection = (sectionKey) => {
    setNewField(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionKey)
        ? prev.sections.filter(s => s !== sectionKey)
        : [...prev.sections, sectionKey]
    }));
  };

  const toggleEditingSection = (sectionKey) => {
    setEditingSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const selectAllSections = () => {
    setNewField(prev => ({
      ...prev,
      sections: prev.sections.length === compatibleSectionsForSelectedTarget.length ? [] : compatibleSectionsForSelectedTarget.map(s => s.key)
    }));
  };

  const selectAllEditingSections = () => {
    const compatibleSections = getCompatibleSectionsForTarget(editingTarget || selectedTarget);
    setEditingSections(prev => prev.length === compatibleSections.length ? [] : compatibleSections.map(s => s.key));
  };

  const visibleCount = fieldConfigs.filter(f => f.visible).length;
  const currentSectionLabel = SECTIONS.find(s => s.key === selectedSection)?.label;
  const currentTargetLabel = availableTargets.find(target => target.key === selectedTarget)?.label || 'الواجهة العامة';
  const currentConfigLabel = `${currentSectionLabel} - ${currentTargetLabel}`;
  const currentCustomFields = getCustomFieldsForSections([selectedSection], selectedTarget);
  const editingAvailableTargets = availableTargets;
  const editingCurrentTarget = editingTarget || selectedTarget;
  const editingCompatibleSections = getCompatibleSectionsForTarget(editingCurrentTarget);
  const editingTargetLabel = editingAvailableTargets.find(target => target.key === editingCurrentTarget)?.label || currentTargetLabel;
  const renderScopeSelector = () => {
    const sectionGroups = SECTIONS.reduce((groups, section) => {
      if (!groups[section.group]) groups[section.group] = [];
      groups[section.group].push(section);
      return groups;
    }, {});

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold text-gray-700">1. اختر القسم</label>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {currentSectionLabel}
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(sectionGroups).map(([groupLabel, sections]) => (
                <div key={groupLabel}>
                  <div className="mb-1.5 px-1 text-xs font-bold text-gray-400">{groupLabel}</div>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => setSelectedSection(section.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedSection === section.key
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-gray-700">2. اختر الشاشة الفرعية</label>
                <p className="mt-1 text-xs text-gray-500">
                  لكل شاشة إعدادات مستقلة للإظهار والترتيب واسم العرض.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {currentTargetLabel}
              </span>
            </div>
            <div className={`grid gap-3 ${availableTargets.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {availableTargets.map((target) => {
                const targetMeta = TARGET_SCREEN_META[target.key] || TARGET_SCREEN_META.default;
                const TargetIcon = targetMeta.icon;
                const isActive = selectedTarget === target.key;

                return (
                  <button
                    key={target.key}
                    type="button"
                    onClick={() => setSelectedTarget(target.key)}
                    className={`rounded-2xl border px-4 py-4 text-right transition-all ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl p-3 ${isActive ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <TargetIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold ${isActive ? 'text-primary-800' : 'text-gray-800'}`}>
                            {target.label}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-primary-700 ring-1 ring-primary-100">
                              نشطة
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{targetMeta.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary-900 via-primary-800 to-primary-900 text-white shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowRight size={20} />
            <span>رجوع</span>
          </button>
          <div className="flex items-center gap-3">
            <Settings2 size={22} />
            <h1 className="text-xl font-bold">إدارة الحقول</h1>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-xl text-center font-medium animate-fade-in ${message.includes('خطأ') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200 max-w-md">
          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'visibility' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Columns3 size={16} />
            إظهار/إخفاء الحقول
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'custom' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PlusCircle size={16} />
            حقول مخصصة
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-4 space-y-4">
        {renderScopeSelector()}

        {/* ==================== VISIBILITY TAB ==================== */}
        {activeTab === 'visibility' && (
          <div className="space-y-4">
            {/* Export/Import Button */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowExportImport(!showExportImport); setTargetSections([]); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  showExportImport
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <ArrowLeftRight size={16} />
                نسخ / استيراد الإعدادات
              </button>
            </div>

            {/* Export/Import Panel */}
            {showExportImport && (
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2">
                    <ArrowLeftRight size={16} />
                    نسخ / استيراد إعدادات الحقول
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Export: Copy current settings to other sections */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Copy size={14} className="text-blue-500" />
                      <span>نسخ إعدادات <strong>{currentConfigLabel}</strong> إلى أقسام أخرى:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={selectAllTargetSections}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                      >
                        {targetSections.length === compatibleTargetSections.length ? 'إلغاء الكل' : 'تحديد الكل'}
                      </button>
                      {compatibleTargetSections.map(s => (
                        <button
                          key={s.key}
                          onClick={() => toggleTargetSection(s.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            targetSections.includes(s.key)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={copySettingsToSections}
                      disabled={saving || targetSections.length === 0}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      {saving ? 'جارٍ النسخ...' : `نسخ الإعدادات إلى ${targetSections.length} أقسام`}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="text-xs text-gray-400 font-medium">أو</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  {/* Import: Load settings from another section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Upload size={14} className="text-green-500" />
                      <span>استيراد إعدادات من قسم آخر إلى <strong>{currentConfigLabel}</strong>:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {compatibleTargetSections.map(s => (
                        <button
                          key={s.key}
                          onClick={() => {
                            if (confirm(`هل تريد استيراد إعدادات "${s.label} - ${currentTargetLabel}" إلى "${currentConfigLabel}"؟ سيتم استبدال الإعدادات الحالية.`)) {
                              importFromSection(s.key);
                            }
                          }}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <Upload size={12} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fields List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">جارٍ التحميل...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-700">الحقول - {currentConfigLabel}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      اسحب لإعادة الترتيب
                    </span>
                    <span className="text-xs text-gray-400">{visibleCount} من {fieldConfigs.length} ظاهر</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {fieldConfigs.map((field, index) => (
                    <div
                      key={field.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDragLeave={handleDragLeave}
                      className={`flex items-center gap-3 px-4 py-3 transition-all cursor-grab active:cursor-grabbing select-none ${
                        field.visible ? 'bg-white' : 'bg-gray-50/50'
                      } ${dragOverIndex === index ? 'border-t-2 border-primary-500 bg-primary-50/30' : ''} ${
                        dragIndex === index ? 'opacity-50' : ''
                      } ${touchDragIndex === index ? 'ring-2 ring-primary-400 bg-primary-50/30' : ''}`}
                    >
                      {/* Drag handle */}
                      <div className="flex items-center text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing">
                        <GripVertical size={18} />
                      </div>

                      {/* Order number */}
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center font-mono shrink-0">
                        {index + 1}
                      </span>

                      {/* Field name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${field.visible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                            {normalizeFieldLabel(field.displayLabel, field.baseLabel || field.label)}
                          </span>
                          {field.isCustom && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">مخصص</span>
                          )}
                          {!field.isCustom && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">مدمج</span>
                          )}
                          {editingDisplayLabelKey !== field.key && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startDisplayLabelEdit(field);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              <Pencil size={12} />
                              تعديل الاسم
                            </button>
                          )}
                        </div>
                        {editingDisplayLabelKey === field.key ? (
                          <div className="mt-2 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
                            <label className="mb-2 block text-xs font-medium text-primary-700">
                              تعديل المسمى في هذه الشاشة
                            </label>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                              <input
                                type="text"
                                value={editingDisplayLabelValue}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setEditingDisplayLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveDisplayLabelEdit(field);
                                  if (e.key === 'Escape') cancelDisplayLabelEdit();
                                }}
                                placeholder={field.baseLabel || field.label}
                                className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveDisplayLabelEdit(field);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700"
                                >
                                  <Check size={12} />
                                  اعتماد
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelDisplayLabelEdit();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  <X size={12} />
                                  إلغاء
                                </button>
                                {!!field.displayLabel && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingDisplayLabelValue('');
                                    }}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                                  >
                                    رجوع للأصلي
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500">
                            {!!field.displayLabel ? 'المسمى الحالي مخصص لهذه الشاشة.' : 'يستخدم الاسم الأصلي لهذا الحقل.'}
                          </div>
                        )}
                        {!!field.displayLabel && (
                          <p className="mt-1 text-xs text-slate-400">
                            الاسم الأصلي: {field.baseLabel || field.label}
                          </p>
                        )}
                      </div>

                      {/* Mobile reorder buttons (fallback for touch) */}
                      <div className="flex flex-col gap-0.5 sm:hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTouchItem(index, index - 1); }}
                          disabled={index === 0}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors p-0.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTouchItem(index, index + 1); }}
                          disabled={index === fieldConfigs.length - 1}
                          className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors p-0.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                      </div>

                      {/* Toggle visibility */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(field.key); }}
                        className={`p-2 rounded-lg transition-all ${
                          field.visible
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {field.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={saveConfigs}
                    disabled={saving}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== CUSTOM FIELDS TAB ==================== */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {/* Add New Custom Field Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-white border-2 border-dashed border-primary-300 text-primary-600 py-4 rounded-xl font-bold hover:bg-primary-50 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                إضافة حقل مخصص جديد
              </button>
            )}

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                  <h3 className="font-bold text-primary-800">إضافة حقل مخصص جديد</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Field Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحقل *</label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={e => setNewField(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="مثال: رقم الحاوية"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Field Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحقل</label>
                    <select
                      value={newField.fieldType}
                      onChange={e => setNewField(prev => ({ ...prev, fieldType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {FIELD_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options (for select type) */}
                  {newField.fieldType === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">الخيارات (مفصولة بفاصلة)</label>
                      <input
                        type="text"
                        value={newField.options}
                        onChange={e => setNewField(prev => ({ ...prev, options: e.target.value }))}
                        placeholder="خيار 1, خيار 2, خيار 3"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {/* Formula Builder (for formula type) */}
                  {newField.fieldType === 'formula' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">بناء المعادلة</label>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        {/* Formula Parts */}
                        <div className="space-y-3">
                          {newField.formulaParts.map((part, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {part.type === 'operator' ? (
                                // Operator selector
                                <div className="flex items-center gap-1 mx-auto">
                                  {OPERATORS.map(op => (
                                    <button
                                      key={op.value}
                                      type="button"
                                      onClick={() => updateFormulaPart(idx, op.value)}
                                      className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                                        part.value === op.value
                                          ? 'bg-primary-600 text-white shadow-md scale-110'
                                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                                      }`}
                                      title={op.title}
                                    >
                                      {op.label}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                // Field selector
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {Math.floor(idx / 2) + 1}
                                  </div>
                                  <select
                                    value={part.value}
                                    onChange={e => updateFormulaPart(idx, e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                  >
                                    <option value="">اختر الحقل...</option>
                                    {getAvailableFormulaFields().map(f => (
                                      <option key={f.key} value={f.key}>{f.label}</option>
                                    ))}
                                  </select>
                                  {/* Remove button (only if more than 1 field) */}
                                  {newField.formulaParts.filter(p => p.type === 'field').length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeFormulaPart(idx)}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                      title="حذف"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add field button */}
                        <button
                          type="button"
                          onClick={addFormulaPart}
                          className="mt-3 w-full border-2 border-dashed border-blue-300 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus size={16} />
                          إضافة حقل آخر
                        </button>

                        {/* Formula Preview */}
                        {newField.formulaParts.some(p => p.type === 'field' && p.value) && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">معاينة المعادلة:</div>
                            <div className="text-sm font-bold text-primary-800 text-center" dir="ltr">
                              {getFormulaPreview()}
                            </div>
                          </div>
                        )}
                      </div>

                      {newField.sections.length === 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                          لعرض الحقول المتاحة، يرجى اختيار قسم واحد على الأقل أدناه
                        </p>
                      )}
                    </div>
                  )}

                  {/* Default Value (not for formula) */}
                  {newField.fieldType !== 'formula' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">القيمة الافتراضية (اختياري)</label>
                    <input
                      type="text"
                      value={newField.defaultValue}
                      onChange={e => setNewField(prev => ({ ...prev, defaultValue: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  )}

                  {/* Sections */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">الأقسام التي يظهر فيها الحقل</label>
                      <button
                        onClick={selectAllSections}
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        {newField.sections.length === compatibleSectionsForSelectedTarget.length ? 'إلغاء الكل' : 'تحديد الكل'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {compatibleSectionsForSelectedTarget.map(s => (
                        <button
                          key={s.key}
                          onClick={() => toggleSection(s.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            newField.sections.includes(s.key)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={addCustomField}
                    disabled={saving || !newField.label.trim()}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'جارٍ الحفظ...' : 'إضافة الحقل'}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Custom Fields List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-700">الحقول المخصصة - {currentConfigLabel}</h3>
              </div>
              {currentCustomFields.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <PlusCircle size={40} className="mx-auto mb-3 opacity-30" />
                  <p>لا توجد حقول مخصصة لهذا القسم بعد</p>
                  <p className="text-xs mt-1">أضف حقلاً جديداً أو غيّر القسم لعرض حقول أخرى</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentCustomFields.map(cf => (
                    <div key={cf.id} className="px-4 py-3">
                      {editingFieldId === cf.id ? (
                        /* ===== EDITING MODE ===== */
                        <div className="space-y-3">
                          {/* Name editing */}
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">اسم الحقل</label>
                            <input
                              type="text"
                              value={editingLabel}
                              onChange={e => setEditingLabel(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !editingFormula) saveEditField(cf.id);
                                if (e.key === 'Escape') cancelEditField();
                              }}
                              autoFocus
                              className="w-full border border-primary-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>

                          {editingAvailableTargets.length > 1 && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500">واجهة ظهور الحقل</label>
                              <div className="flex flex-wrap gap-2">
                                {editingAvailableTargets.map(target => (
                                  <button
                                    key={target.key}
                                    type="button"
                                    onClick={() => setEditingTarget(target.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      editingCurrentTarget === target.key
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {target.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-slate-500">
                                بعد الحفظ سيظهر هذا الحقل ضمن <strong>{editingTargetLabel}</strong>.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <label className="block text-xs font-medium text-gray-500">الأقسام التي سيظهر فيها الحقل</label>
                              <button
                                type="button"
                                onClick={selectAllEditingSections}
                                className="text-xs text-primary-600 hover:text-primary-800"
                              >
                                {editingSections.length === editingCompatibleSections.length ? 'إلغاء الكل' : 'تحديد الكل'}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {editingCompatibleSections.map(section => (
                                <button
                                  key={section.key}
                                  type="button"
                                  onClick={() => toggleEditingSection(section.key)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    editingSections.includes(section.key)
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  {section.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Formula editing (only for formula type) */}
                          {editingFormula && (
                            <div className="space-y-3">
                              <label className="block text-xs font-medium text-gray-500">تعديل المعادلة</label>
                              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                                {/* Formula Parts */}
                                <div className="space-y-3">
                                  {editingFormula.formulaParts.map((part, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      {part.type === 'operator' ? (
                                        <div className="flex items-center gap-1 mx-auto">
                                          {OPERATORS.map(op => (
                                            <button
                                              key={op.value}
                                              type="button"
                                              onClick={() => updateEditFormulaPart(idx, op.value)}
                                              className={`w-10 h-10 rounded-lg text-lg font-bold transition-all ${
                                                part.value === op.value
                                                  ? 'bg-purple-600 text-white shadow-md scale-110'
                                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                                              }`}
                                              title={op.title}
                                            >
                                              {op.label}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {Math.floor(idx / 2) + 1}
                                          </div>
                                          <select
                                            value={part.value}
                                            onChange={e => updateEditFormulaPart(idx, e.target.value)}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                          >
                                            <option value="">اختر الحقل...</option>
                                            {getEditFormulaFields().map(f => (
                                              <option key={f.key} value={f.key}>{f.label}</option>
                                            ))}
                                          </select>
                                          {editingFormula.formulaParts.filter(p => p.type === 'field').length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => removeEditFormulaPart(idx)}
                                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                              title="حذف"
                                            >
                                              <X size={16} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Add field button */}
                                <button
                                  type="button"
                                  onClick={addEditFormulaPart}
                                  className="mt-3 w-full border-2 border-dashed border-purple-300 text-purple-600 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center justify-center gap-1"
                                >
                                  <Plus size={16} />
                                  إضافة حقل آخر
                                </button>

                                {/* Formula Preview */}
                                {editingFormula.formulaParts.some(p => p.type === 'field' && p.value) && (
                                  <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                                    <div className="text-xs text-gray-500 mb-1">معاينة المعادلة:</div>
                                    <div className="text-sm font-bold text-purple-800 text-center" dir="ltr">
                                      {getEditFormulaPreview()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Save / Cancel buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => saveEditField(cf.id)}
                              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Check size={16} />
                              حفظ التعديلات
                            </button>
                            <button
                              onClick={cancelEditField}
                              className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <X size={16} />
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ===== DISPLAY MODE ===== */
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800">{cf.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                              <span className={`px-2 py-0.5 rounded ${cf.fieldType === 'formula' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                {FIELD_TYPES.find(t => t.value === cf.fieldType)?.label || cf.fieldType}
                              </span>
                              <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded">
                                {cf.fieldKey}
                              </span>
                              {cf.fieldType === 'formula' && cf.formula?.parts && (
                                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded" dir="ltr">
                                  {cf.formula.parts.map(p => {
                                    if (p.type === 'operator') {
                                      const op = OPERATORS.find(o => o.value === p.value);
                                      return ` ${op?.label || p.value} `;
                                    }
                                    const selectedField = getSectionFieldsForTarget(selectedSection, selectedTarget).find((field) => field.key === p.value);
                                    if (selectedField) return selectedField.label;
                                    for (const fields of Object.values(SECTION_FIELDS_MAP)) {
                                      const f = fields.find(fl => fl.key === p.value);
                                      if (f) return f.label;
                                    }
                                    const customField = customFieldsList.find(field => field.fieldKey === p.value);
                                    if (customField) return customField.label;
                                    return p.value;
                                  }).join('')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditField(cf)}
                              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={cf.fieldType === 'formula' ? 'تعديل الاسم والمعادلة' : 'تعديل الاسم'}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => deleteCustomField(cf.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
