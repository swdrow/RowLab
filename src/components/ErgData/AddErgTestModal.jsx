import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { handleApiResponse } from '@utils/api';

/**
 * Modal for adding a new erg test
 */
function AddErgTestModal({ athlete, isOpen, onClose, onSuccess }) {
  const { getAuthHeaders } = useAuthStore();
  const [formData, setFormData] = useState({
    testDate: new Date().toISOString().split('T')[0],
    testType: '2k',
    result: '',
    split: '',
    strokeRate: '',
    watts: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const testTypes = ['2k', '6k', '5k', '30min', '500m', '1k', '10k', 'other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.result) {
      setError('Result is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/erg-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          athleteId: athlete.id,
          ...formData,
          strokeRate: formData.strokeRate || undefined,
          watts: formData.watts || undefined,
        }),
      });

      const data = await handleApiResponse(res, 'Failed to add erg test');

      // Reset form
      setFormData({
        testDate: new Date().toISOString().split('T')[0],
        testType: '2k',
        result: '',
        split: '',
        strokeRate: '',
        watts: '',
        notes: '',
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      testDate: new Date().toISOString().split('T')[0],
      testType: '2k',
      result: '',
      split: '',
      strokeRate: '',
      watts: '',
      notes: '',
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚣</div>
          <h2 className="text-xl font-bold text-text-primary">
            Add Erg Test
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {athlete?.firstName} {athlete?.lastName}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Date *
              </label>
              <input
                type="date"
                name="testDate"
                value={formData.testDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Test Type *
              </label>
              <select
                name="testType"
                value={formData.testType}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
                required
              >
                {testTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Result (mm:ss.t) *
            </label>
            <input
              type="text"
              name="result"
              value={formData.result}
              onChange={handleChange}
              placeholder="e.g., 6:30.5 or 1:45.2"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Split (per 500m)
            </label>
            <input
              type="text"
              name="split"
              value={formData.split}
              onChange={handleChange}
              placeholder="e.g., 1:37.6"
              className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Stroke Rate
              </label>
              <input
                type="number"
                name="strokeRate"
                value={formData.strokeRate}
                onChange={handleChange}
                placeholder="e.g., 32"
                min="10"
                max="50"
                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Watts
              </label>
              <input
                type="number"
                name="watts"
                value={formData.watts}
                onChange={handleChange}
                placeholder="e.g., 350"
                min="50"
                max="600"
                className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-void-elevated text-text-primary focus:ring-2 focus:ring-blade-blue/50 focus:border-blade-blue/30 outline-none transition text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blade-blue hover:bg-blade-blue/90 text-void-deep font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blade-blue/20"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Test'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddErgTestModal;
