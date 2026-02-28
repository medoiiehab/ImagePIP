'use client';

import { useEffect, useState } from 'react';
import './AutoApprovalToggle.css';

export default function AutoApprovalToggle() {
    const [autoApproval, setAutoApproval] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                setAutoApproval(data.settings.autoApproval);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to fetch settings:', response.status, errorData);
                setError(`Failed to load settings: ${errorData.error || 'Server Error'}`);
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(`Connection error: ${err.message || 'Unknown error'}`);
        }
    };

    const handleToggle = async () => {
        // If settings aren't loaded yet, try to load them but don't block the UI feel if we have basic state
        // However, for first-time use, we need the settings object to update
        if (!settings) {
            setError('Settings not loaded yet. Please wait...');
            fetchSettings();
            return;
        }

        setIsUpdating(true);
        setError(null);
        const newValue = !autoApproval;

        // Optimistic update
        setAutoApproval(newValue);

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    ...settings,
                    autoApproval: newValue
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update setting');
            }

            const data = await response.json();
            setSettings(data.settings);
            // Ensure local state matches server just in case
            setAutoApproval(data.settings.autoApproval);

        } catch (err: any) {
            setError(err.message || 'Error updating');
            // Roll back local state if server failed
            setAutoApproval(!newValue);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="auto-approval-banner">
            <div className="banner-content">

                <div className="banner-text">
                    <span className="banner-label">Auto-Approval Status:</span>
                    <span className={`status-pill ${autoApproval ? 'active' : 'inactive'}`}>
                        {autoApproval ? 'ENABLED' : 'DISABLED'}
                    </span>
                </div>
            </div>

            <div className="banner-actions">
                {error && <span className="error-tip">{error}</span>}
                <button
                    className={`toggle-btn ${autoApproval ? 'active' : ''} ${isUpdating ? 'loading' : ''}`}
                    onClick={handleToggle}
                    disabled={isUpdating}
                >
                    {isUpdating ? '⏳' : autoApproval ? 'Disable Auto-Approval' : 'Enable Auto-Approval'}
                </button>
            </div>
        </div>
    );
}
