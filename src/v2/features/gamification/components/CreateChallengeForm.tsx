import { useState } from 'react';
import { useCreateChallenge, useChallengeTemplates } from '../../../hooks/useChallenges';
import { useToast } from '../../../contexts/ToastContext';
import type {
  ChallengeType,
  ChallengeMetric,
  CreateChallengeInput,
} from '../../../types/gamification';

interface CreateChallengeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateChallengeForm({ onSuccess, onCancel }: CreateChallengeFormProps) {
  const { showToast } = useToast();
  const { data: templates } = useChallengeTemplates();
  const createChallenge = useCreateChallenge();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateChallengeInput>>({
    name: '',
    description: '',
    type: 'individual',
    metric: 'meters',
  });

  // Set default dates (today + 7 days)
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData({
        name: template.name,
        description: template.description,
        type: template.type,
        metric: template.metric,
        templateId,
      });
      // Set end date based on template duration
      const end = new Date(Date.now() + template.defaultDurationDays * 24 * 60 * 60 * 1000);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !startDate || !endDate) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    try {
      await createChallenge.mutateAsync({
        ...formData,
        name: formData.name!,
        type: formData.type as ChallengeType,
        metric: formData.metric as ChallengeMetric,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      } as CreateChallengeInput);

      showToast('success', 'Challenge created!');
      onSuccess?.();
    } catch (error) {
      showToast('error', 'Failed to create challenge');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template selection */}
      {templates && templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-2">
            Start from template (optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template.id)}
                className={`
                  p-3 text-left rounded-lg border transition-colors
                  ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-bdr-default hover:border-primary/50'
                  }
                `}
              >
                <p className="font-medium text-sm text-txt-primary">{template.name}</p>
                <p className="text-xs text-txt-secondary mt-0.5">{template.metric}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Challenge Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Holiday Meters Challenge"
          className="w-full px-3 py-2 bg-surface border border-bdr-default rounded-lg text-txt-primary placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-txt-primary mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Who can row the most meters during break?"
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary placeholder:text-txt-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      {/* Type and Metric */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Type</label>
          <select
            value={formData.type || 'individual'}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, type: e.target.value as ChallengeType }))
            }
            className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="individual">Individual Competition</option>
            <option value="collective">Team Goal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Metric</label>
          <select
            value={formData.metric || 'meters'}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, metric: e.target.value as ChallengeMetric }))
            }
            className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="meters">Total Meters</option>
            <option value="workouts">Workout Count</option>
            <option value="attendance">Attendance</option>
            <option value="composite">Composite Score</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-primary mb-1">End Date *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full px-3 py-2 bg-surface border border-bdr rounded-lg text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-bdr-default">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createChallenge.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {createChallenge.isPending ? 'Creating...' : 'Create Challenge'}
        </button>
      </div>
    </form>
  );
}

export default CreateChallengeForm;
