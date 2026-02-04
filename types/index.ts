export interface Team {
    id: string;
    name: string;
    uuid: string;
    schoolUuid?: string;
    is_active?: boolean;
    users?: User[];
    created_at?: string;
}

export interface User {
    id: string;
    uuid: string;
    role: string | 'admin' | 'client';
    schools?: string[];
    schoolUuid?: string;
    school_uuid?: string;
    created_at?: string;
    createdAt?: string;
}

export interface Photo {
    id: string;
    fileName: string;
    file_name?: string;
    filePath: string;
    file_path?: string;
    status: 'pending' | 'approved' | 'rejected' | 'migrated';
    approved?: boolean;
    migratedToGoogleDrive?: boolean;
    migrated_to_google_drive?: boolean;
    uploadedAt: string;
    uploaded_at?: string;
    created_at?: string;
    approvedAt?: string;
    approved_at?: string;
    userId: string;
    user_id?: string;
    schoolUuid?: string;
    school_uuid?: string;
    school_name?: string;
    schools?: {
        name: string;
    };
    metadata?: {
        publicUrl?: string;
        size?: number;
        [key: string]: any;
    };
    file_size?: number;
}
