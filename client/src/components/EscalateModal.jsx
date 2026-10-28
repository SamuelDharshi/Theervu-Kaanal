import React, { useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import '../styles/Modal.css';

// The petitioner's escalation to the grievance cell, with their reason.
const EscalateModal = ({ show, onHide, onSubmit, selectedGrievance }) => {
    const { t } = useT();
    const [reason, setReason] = useState('');

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(reason);
        setReason('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="escalate-title">
                <div className="modal-header">
                    <h2 className="modal-title" id="escalate-title">
                        {t('escalate.title')}
                        {selectedGrievance?.grievanceId ? ` · ${selectedGrievance.grievanceId}` : ''}
                    </h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <label htmlFor="escalationReason" className="form-label">
                            {t('escalate.reasonLabel')}
                        </label>
                        <textarea
                            id="escalationReason"
                            className="modal-textarea"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('escalate.reasonPlaceholder')}
                            required
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="modal-button cancel" onClick={onHide}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="modal-button submit" disabled={!reason.trim()}>
                            {t('escalate.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EscalateModal;
