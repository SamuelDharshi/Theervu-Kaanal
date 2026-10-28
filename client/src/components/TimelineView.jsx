import React, { useState, useEffect } from 'react';
import { useT } from '../i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import '../styles/Timeline.css';
import { API_BASE } from '../config';

const TimelineView = ({ grievanceId, onBack }) => {
    const { t, formatDate } = useT();
    const [timelineStages, setTimelineStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Ignore a response that arrives after grievanceId changed or the view closed.
        let cancelled = false;

        const fetchTimelineStages = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const response = await fetch(`${API_BASE}/api/grievances/${grievanceId}/timeline-stages`, {
                    headers: headers
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch timeline stages');
                }

                const data = await response.json();
                if (!cancelled) setTimelineStages(data.timelineStages);
            } catch (error) {
                console.error('Error fetching timeline stages:', error);
                if (!cancelled) setError('timeline.failed');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchTimelineStages();
        return () => { cancelled = true; };
    }, [grievanceId]);

    // Flat stage markers: ink for progress, red for escalation, filled for resolution.
    const getStageIcon = (stageName) => {
        const kind = stageName === 'Escalated' ? 'escalated' : stageName === 'Resolution' ? 'done' : 'step';
        return <span className={`timeline-dot timeline-dot--${kind}`} aria-hidden="true" />;
    };

    // Define the logical order of stages
    const getStageOrder = (stageName) => {
        switch (stageName) {
            case 'Grievance Filed':
                return 1;
            case 'Under Review':
                return 2;
            case 'Investigation':
                return 3;
            case 'Escalated':
                return 4;
            case 'Reassigned':
                return 5;
            case 'Resolution':
                return 6;
            default:
                return 7; // Any custom stages will appear at the end
        }
    };

    // Sort timeline stages by logical order and then by date
    const sortedStages = [...timelineStages].sort((a, b) => {
        const orderA = getStageOrder(a.stageName);
        const orderB = getStageOrder(b.stageName);

        // If stages have different logical order, sort by that
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // If stages have the same logical order, sort by date
        return new Date(a.date) - new Date(b.date);
    });

    if (loading) return <div className="timeline-container text-muted">{t('timeline.loading')}</div>;
    if (error) return <div className="error">{t(error)}</div>;

    return (
        <div className="timeline-container">
            <div className="d-flex align-items-center mb-3">
                <button
                    type="button"
                    className="btn btn-link text-dark me-3"
                    onClick={onBack}
                    aria-label={t('common.back')}
                >
                    <ArrowLeft size={24} />
                </button>
                <h3 className="mb-0">{t('timeline.title')}</h3>
            </div>
            <div className="timeline">
                {sortedStages.map((stage, index) => (
                    <div key={index} className={`timeline-item ${stage.stageName === 'Escalated' ? 'is-escalated' : ''}`} style={{ '--i': index }}>
                        <div className="timeline-icon">
                            {getStageIcon(stage.stageName)}
                        </div>
                        <div className="timeline-content">
                            <h4>{t(`stage.byName.${stage.stageName}`)}</h4>
                            <p className="date">
                                {formatDate(stage.date)}
                            </p>
                            <p className="description">{stage.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineView;
