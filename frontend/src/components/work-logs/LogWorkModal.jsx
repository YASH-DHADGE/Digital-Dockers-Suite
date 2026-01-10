import React, { useState } from 'react';
import { X } from 'lucide-react';
import workLogService from '../../services/workLogService';
import './WorkLogs.css';

/**
 * LogWorkModal
 * Modal for manually entering work time
 * Allows specifying start/end times, description, and billable status
 */
const LogWorkModal = ({ workItemId, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour later
    description: '',
    billable: true,
    roundingRule: 'NONE'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.startTime || !formData.endTime) {
      setError('Start and end times are required');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours > 12) {
      setError('Work log duration cannot exceed 12 hours');
      return;
    }

    try {
      setLoading(true);

      await workLogService.createManualLog(workItemId, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        billable: formData.billable,
        roundingRule: formData.roundingRule
      });

      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('Failed to create work log:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-log-modal">
      <div className="manual-log-modal-content">
        <div className="manual-log-modal-header">
          <span>Log Work Time</span>
          <button
            className="manual-log-modal-close"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="manual-log-form-row">
            <div className="manual-log-form-group">
              <label className="manual-log-form-label">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="manual-log-form-input"
                required
                disabled={loading}
              />
            </div>

            <div className="manual-log-form-group">
              <label className="manual-log-form-label">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="manual-log-form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="manual-log-form-group">
            <label className="manual-log-form-label">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="manual-log-form-textarea"
              placeholder="What did you work on?"
              disabled={loading}
            />
          </div>

          <div className="manual-log-form-row">
            <div className="manual-log-form-group">
              <label className="manual-log-form-label">Rounding Rule</label>
              <select
                name="roundingRule"
                value={formData.roundingRule}
                onChange={handleInputChange}
                className="manual-log-form-input"
                disabled={loading}
              >
                <option value="NONE">No Rounding</option>
                <option value="ROUND_5">Round to 5 min</option>
                <option value="ROUND_15">Round to 15 min</option>
                <option value="ROUND_30">Round to 30 min</option>
              </select>
            </div>

            <div className="manual-log-form-group">
              <label style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                <input
                  type="checkbox"
                  name="billable"
                  checked={formData.billable}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{ marginRight: '8px' }}
                />
                <span className="manual-log-form-label" style={{ margin: 0 }}>
                  Billable
                </span>
              </label>
            </div>
          </div>

          <div className="manual-log-modal-actions">
            <button
              type="button"
              className="manual-log-modal-btn secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="manual-log-modal-btn primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Work Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogWorkModal;
