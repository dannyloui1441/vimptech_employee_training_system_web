import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth';

export async function GET() {
    const guard = await authGuard(['Admin', 'Trainer']);
    if ('response' in guard) return guard.response;

    try {
        const settings = await db.settings.find();

        // Return a condensed version of settings optimized for the Flutter app
        const mobileConfig = {
            appName: settings.mobileApp.appName,
            version: {
                current: settings.mobileApp.appVersion,
                minSupported: settings.mobileApp.minimumSupportedVersion,
                forceUpdate: settings.mobileApp.forceUpdate
            },
            maintenance: {
                enabled: settings.mobileApp.maintenanceMode || settings.system.maintenanceMode,
                message: settings.mobileApp.maintenanceMessage
            },
            theme: {
                primary: settings.mobileApp.theme.primaryColor || settings.general.primaryColor,
                secondary: settings.mobileApp.theme.secondaryColor || settings.general.secondaryColor,
                accent: settings.mobileApp.theme.accentColor || settings.general.accentColor,
            },
            features: settings.mobileApp.features,
            organization: {
                name: settings.general.organizationName,
                logo: settings.general.logo,
            },
            security: {
                twoFactorRequired: settings.security.twoFactor.enabledForAll,
                passwordPolicy: {
                    minLen: settings.security.passwordPolicy.minLength,
                    requireSpecial: settings.security.passwordPolicy.requireSpecialChars
                }
            }
        };

        return NextResponse.json(mobileConfig);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mobile configuration' }, { status: 500 });
    }
}
