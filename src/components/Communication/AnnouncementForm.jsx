import { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Eye, Edit3 } from 'lucide-react';

/**
 * Custom Input component with proper label association
 */
const InputField = ({ label, required, error, id: providedId, name, ...props }) => {
  const generatedId = useId();
  const inputId = providedId || (name ? `input-${name}` : generatedId);
  const errorId = `${inputId}-error`;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-2">
          {label}
          {required && <span className="text-danger-red ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
        className={`w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border transition-all duration-200 text-text-primary placeholder:text-text-muted focus:outline-none ${
          error
            ? 'border-danger-red/50 focus:border-danger-red focus:ring-1 focus:ring-danger-red/20'
            : 'border-white/[0.06] focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20'
        }`}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-danger-red">{error}</p>}
    </div>
  );
};

/**
 * Custom Textarea component with proper label association
 */
const TextareaField = ({ label, required, error, id: providedId, name, ...props }) => {
  const generatedId = useId();
  const textareaId = providedId || (name ? `textarea-${name}` : generatedId);
  const errorId = `${textareaId}-error`;

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-secondary mb-2">
          {label}
          {required && <span className="text-danger-red ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
        className={`w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border transition-all duration-200 text-text-primary placeholder:text-text-muted focus:outline-none resize-none ${
          error
            ? 'border-danger-red/50 focus:border-danger-red focus:ring-1 focus:ring-danger-red/20'
            : 'border-white/[0.06] focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20'
        }`}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-danger-red">{error}</p>}
    </div>
  );
};

/**
 * Custom Select component with proper label association
 */
const SelectField = ({ label, options, id: providedId, name, ...props }) => {
  const generatedId = useId();
  const selectId = providedId || (name ? `select-${name}` : generatedId);

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
    <select
      id={selectId}
      name={name}
      {...props}
      className="w-full px-4 py-2.5 rounded-lg bg-void-deep/50 border border-white/[0.06] text-text-primary focus:outline-none focus:border-blade-blue/50 focus:ring-1 focus:ring-blade-blue/20 transition-all duration-200 appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-void-elevated">
          {opt.label}
        </option>
      ))}
    </select>
  </div>
  );
};

/**
 * Custom Checkbox component
 */
const Checkbox = ({ label, checked, onChange, disabled }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
        checked
          ? 'bg-blade-blue border-blade-blue shadow-[0_0_10px_rgba(0,112,243,0.3)]'
          : 'border-white/[0.1] bg-void-deep/50 group-hover:border-white/[0.2]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {checked && (
          <svg className="w-3 h-3 text-void-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
    <span className={`text-sm text-text-primary ${disabled ? 'opacity-50' : ''}`}>{label}</span>
  </label>
);

/**
 * Button component
 */
const Button = ({ children, variant = 'primary', isLoading, className = '', ...props }) => {
  const variants = {
    primary: 'bg-blade-blue text-void-deep hover:shadow-[0_0_20px_rgba(0,112,243,0.3)] font-medium',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-5 py-2.5 rounded-lg text-sm transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </motion.button>
  );
};

/**
 * AnnouncementForm - Form for creating/editing announcements
 * Redesigned with Precision Instrument design system
 */
export default function AnnouncementForm({
  announcement = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const isEditMode = announcement !== null;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    visibleTo: 'all',
    pinned: false,
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        priority: announcement.priority || 'normal',
        visibleTo: announcement.visibleTo || 'all',
        pinned: announcement.pinned || false,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        visibleTo: 'all',
        pinned: false,
      });
    }
  }, [announcement]);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      visibleTo: formData.visibleTo,
      pinned: formData.pinned,
    });
  };

  const priorityOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'important', label: 'Important' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const audienceOptions = [
    { value: 'all', label: 'Everyone' },
    { value: 'athletes', label: 'Athletes Only' },
    { value: 'coaches', label: 'Coaches Only' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Title"
        required
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        placeholder="Enter announcement title"
        error={errors.title}
        disabled={loading}
      />

      {/* Content with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-secondary">
            Content
            <span className="text-danger-red ml-1">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-blade-blue hover:text-blade-blue/80 transition-colors"
          >
            {showPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {showPreview ? (
          <div className="w-full min-h-[150px] rounded-lg p-3 bg-void-deep/50 border border-white/[0.06] text-text-primary text-sm whitespace-pre-wrap">
            {formData.content || (
              <span className="text-text-muted italic">Nothing to preview</span>
            )}
          </div>
        ) : (
          <TextareaField
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Write your announcement content..."
            rows={6}
            error={errors.content}
            disabled={loading}
          />
        )}
      </div>

      <SelectField
        label="Priority"
        value={formData.priority}
        onChange={(e) => handleChange('priority', e.target.value)}
        disabled={loading}
        options={priorityOptions}
      />

      <SelectField
        label="Audience"
        value={formData.visibleTo}
        onChange={(e) => handleChange('visibleTo', e.target.value)}
        disabled={loading}
        options={audienceOptions}
      />

      <Checkbox
        label="Pin this announcement"
        checked={formData.pinned}
        onChange={(e) => handleChange('pinned', e.target.checked)}
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          disabled={loading}
        >
          {isEditMode ? 'Update Announcement' : 'Create Announcement'}
        </Button>
      </div>
    </form>
  );
}
