'use client';

import { useState } from 'react';

interface MultiSchoolSelectorProps {
    schools: string[];
    onAddSchool: (schoolUuid: string) => void;
    onRemoveSchool?: (schoolUuid: string) => void;
}

export default function MultiSchoolSelector({
    schools = [],
    onAddSchool,
    onRemoveSchool
}: MultiSchoolSelectorProps) {
    const [newSchoolUuid, setNewSchoolUuid] = useState('');
    const [error, setError] = useState('');

    const handleAdd = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newSchoolUuid.trim()) return;

        if (!/^\d{4}$/.test(newSchoolUuid)) {
            setError('Must be 4 digits');
            return;
        }

        if (schools.includes(newSchoolUuid)) {
            setError('Already added');
            return;
        }

        onAddSchool(newSchoolUuid);
        setNewSchoolUuid('');
        setError('');
    };

    return (
        <div className="multi-school-selector">
            <label className="text-sm font-semibold mb-2 block">Linked Schools</label>

            {/* List of current schools */}
            <div className="school-tags">
                {schools.length === 0 ? (
                    <span className="text-muted text-sm italic">No schools linked</span>
                ) : (
                    schools.map((uuid) => (
                        <div key={uuid} className="school-tag">
                            <span>{uuid}</span>
                            {onRemoveSchool && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveSchool(uuid)}
                                    className="remove-school-btn"
                                    aria-label="Remove school"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add new school input */}
            <div className="add-school-input">
                <input
                    type="text"
                    value={newSchoolUuid}
                    onChange={(e) => {
                        setNewSchoolUuid(e.target.value);
                        if (error) setError('');
                    }}
                    placeholder="New School UUID (e.g. 1002)"
                    maxLength={4}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd(e);
                    }}
                />
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAdd()}
                >
                    Add Linked School
                </button>
            </div>
            {error && <p className="text-danger text-xs mt-1">{error}</p>}

            <p className="text-muted text-xs mt-2">
                Enter a School UUID to link this user to another school.
            </p>
        </div>
    );
}
