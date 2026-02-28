import { NextRequest } from 'next/server';
import { authenticateRequest, successResponse, errorResponse, checkRole } from '@/lib/auth/middleware';
import { supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    const { valid, user, error } = authenticateRequest(request);

    if (!valid || !user) {
        return errorResponse(error || 'Unauthorized', 401);
    }

    // Both admins and clients might need to know some settings (like max file size)
    // But full settings access is usually for admins
    try {
        const { data: settings, error: queryError } = await supabase
            .from('system_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (queryError) {
            console.error('Error fetching settings:', queryError);
            if (queryError.code === '42P01') {
                return errorResponse('System settings table not found. Please run the mg5.sql script in your Supabase SQL Editor.', 404);
            }
            return errorResponse('Error fetching settings', 500);
        }

        // Default settings if the row doesn't exist yet
        const defaultSettings = {
            id: 1,
            site_name: 'Image Pipeline',
            max_file_size_mb: 10,
            auto_delete_days: 30,
            email_notifications: true,
            maintenance_mode: false,
            auto_approval: false,
        };

        const currentSettings = settings || defaultSettings;

        const transformedSettings = {
            siteName: currentSettings.site_name,
            maxFileSize: currentSettings.max_file_size_mb,
            autoDeleteDays: currentSettings.auto_delete_days,
            emailNotifications: currentSettings.email_notifications,
            maintenanceMode: currentSettings.maintenance_mode,
            autoApproval: currentSettings.auto_approval,
        };

        return successResponse({
            settings: transformedSettings,
        });
    } catch (err: any) {
        console.error('Error in GET /api/settings:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
}

export async function POST(request: NextRequest) {
    const { valid, user, error } = authenticateRequest(request);

    if (!valid || !user) {
        return errorResponse(error || 'Unauthorized', 401);
    }

    if (!checkRole(user, ['admin'])) {
        return errorResponse('Only admins can update settings', 403);
    }

    try {
        const body = await request.json();
        const {
            siteName,
            maxFileSize,
            autoDeleteDays,
            emailNotifications,
            maintenanceMode,
            autoApproval
        } = body;

        const { data: updatedSettings, error: updateError } = await supabase
            .from('system_settings')
            .upsert({ // Use upsert instead of update
                id: 1,
                site_name: siteName || 'Image Pipeline',
                max_file_size_mb: maxFileSize || 10,
                auto_delete_days: autoDeleteDays || 30,
                email_notifications: emailNotifications ?? true,
                maintenance_mode: maintenanceMode ?? false,
                auto_approval: autoApproval ?? false,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select()
            .single();

        if (updateError) {
            console.error('Error updating settings:', updateError);
            if (updateError.code === '42P01') {
                return errorResponse('System settings table not found. Please run the mg5.sql script in your Supabase SQL Editor.', 404);
            }
            return errorResponse('Failed to update settings', 500);
        }

        const transformedSettings = {
            siteName: updatedSettings.site_name,
            maxFileSize: updatedSettings.max_file_size_mb,
            autoDeleteDays: updatedSettings.auto_delete_days,
            emailNotifications: updatedSettings.email_notifications,
            maintenanceMode: updatedSettings.maintenance_mode,
            autoApproval: updatedSettings.auto_approval,
        };

        return successResponse({
            success: true,
            settings: transformedSettings,
            message: 'Settings updated successfully',
        });
    } catch (err: any) {
        console.error('Error in POST /api/settings:', err);
        return errorResponse(err.message || 'Internal server error', 500);
    }
}
