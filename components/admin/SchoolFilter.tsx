'use client';

import { useEffect } from 'react';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import './SchoolFilter.css';

interface SchoolFilterProps {
    onSchoolChange: (schoolUuid: string | undefined) => void;
    selectedSchoolUuid?: string;
}

export default function SchoolFilter({
    onSchoolChange,
    selectedSchoolUuid
}: SchoolFilterProps) {
    const { teams, fetchTeams, isLoading } = useTeamManagement();

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    return (
        <div className="school-filter">
            <div className="filter-label">Filter by School:</div>
            <div className="school-tabs">
                <button
                    className={`school-tab ${!selectedSchoolUuid ? 'active' : ''}`}
                    onClick={() => onSchoolChange(undefined)}
                >
                    All Schools
                </button>
                {teams.map((school) => (
                    <button
                        key={school.uuid}
                        className={`school-tab ${selectedSchoolUuid === school.uuid ? 'active' : ''}`}
                        onClick={() => onSchoolChange(school.uuid)}
                    >
                        {school.name}
                    </button>
                ))}
                {isLoading && <span className="filter-loading">Loading...</span>}
            </div>
        </div>
    );
}
