import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor() {
    super({
      authorizationURL: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
      clientID: process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      callbackURL: process.env.BACKEND_URL + '/auth/microsoft/callback',
      scope: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://graph.microsoft.com/User.Read',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ) {
    try {
      console.log('Access Token received:', accessToken ? 'Yes' : 'No');
      console.log('Access Token length:', accessToken?.length || 0);

      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString(),
          );
          console.log('Access token scopes (scp):', payload.scp);
          console.log('Access token roles:', payload.roles);
          console.log('Access token aud:', payload.aud);
        } else {
          console.log(
            'Access token is not a JWT (cannot introspect scopes locally)',
          );
        }
      } catch (e) {
        console.log('Could not parse access token payload:', e?.message);
      }

      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Microsoft Graph API response status:', response.status);
      console.log(
        'Microsoft Graph API response statusText:',
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Microsoft Graph API error response:', errorText);
        throw new Error(
          `Failed to fetch user profile from Microsoft Graph: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const userProfile = await response.json();
      console.log('Microsoft user profile:', userProfile);

      const user = {
        email: userProfile.mail || userProfile.userPrincipalName,
        name: userProfile.displayName,
        provider: 'microsoft',
        providerId: userProfile.id,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName || 'User')}&background=random`,
      };

      console.log('Microsoft user created:', user);
      return done(null, user);
    } catch (error) {
      console.error('Microsoft Strategy validation error:', error);
      return done(error, null);
    }
  }
}
