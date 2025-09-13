#!/usr/bin/env node

/**
 * Logto Configuration Script
 * Issue #10 - Stream B: Authentication & Sign-in Experience
 * 
 * This script helps configure Logto organization templates, roles, and permissions
 * using the Management API.
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: '.env.local' });

class LogtoSetup {
  constructor() {
    this.endpoint = process.env.LOGTO_ENDPOINT;
    this.m2mAppId = process.env.LOGTO_M2M_APP_ID;
    this.m2mAppSecret = process.env.LOGTO_M2M_APP_SECRET;
    this.accessToken = null;
  }

  async getManagementToken() {
    const response = await fetch(`${this.endpoint}/oidc/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.m2mAppId,
        client_secret: this.m2mAppSecret,
        scope: 'all',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get management token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    console.log('✅ Management API token obtained');
    return this.accessToken;
  }

  async apiRequest(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.getManagementToken();
    }

    const response = await fetch(`${this.endpoint}/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createOrganizationRoles() {
    console.log('\n📋 Creating organization roles...');

    const roles = [
      {
        name: 'admin',
        description: 'Full organization management permissions',
        type: 'User'
      },
      {
        name: 'member',
        description: 'Standard user permissions with read/write access',
        type: 'User'
      },
      {
        name: 'guest',
        description: 'Limited read-only access for external users',
        type: 'User'
      }
    ];

    const createdRoles = [];

    for (const role of roles) {
      try {
        const result = await this.apiRequest('/organization-roles', {
          method: 'POST',
          body: JSON.stringify(role),
        });
        createdRoles.push(result);
        console.log(`✅ Created role: ${role.name} (ID: ${result.id})`);
      } catch (error) {
        if (error.message.includes('409')) {
          console.log(`⚠️  Role ${role.name} already exists`);
          // Get existing role
          const roles = await this.apiRequest('/organization-roles');
          const existing = roles.find(r => r.name === role.name);
          if (existing) {
            createdRoles.push(existing);
          }
        } else {
          console.error(`❌ Failed to create role ${role.name}:`, error.message);
        }
      }
    }

    return createdRoles;
  }

  async createOrganizationScopes() {
    console.log('\n🔐 Creating organization scopes...');

    const scopes = [
      {
        name: 'inbox:read',
        description: 'Access communication hub'
      },
      {
        name: 'inbox:write',
        description: 'Create and respond to messages'
      },
      {
        name: 'library:read',
        description: 'View templates and assets'
      },
      {
        name: 'library:write',
        description: 'Create and modify templates'
      },
      {
        name: 'catalog:browse',
        description: 'Browse app marketplace'
      },
      {
        name: 'catalog:install',
        description: 'Install marketplace apps'
      },
      {
        name: 'profile:read',
        description: 'View organization profiles'
      },
      {
        name: 'profile:manage',
        description: 'Manage organization settings'
      },
      {
        name: 'organization:manage',
        description: 'Full organization administration'
      },
      {
        name: 'users:invite',
        description: 'Invite users to organization'
      },
      {
        name: 'users:manage',
        description: 'Manage user roles and permissions'
      }
    ];

    const createdScopes = [];

    for (const scope of scopes) {
      try {
        const result = await this.apiRequest('/organization-scopes', {
          method: 'POST',
          body: JSON.stringify(scope),
        });
        createdScopes.push(result);
        console.log(`✅ Created scope: ${scope.name} (ID: ${result.id})`);
      } catch (error) {
        if (error.message.includes('409')) {
          console.log(`⚠️  Scope ${scope.name} already exists`);
        } else {
          console.error(`❌ Failed to create scope ${scope.name}:`, error.message);
        }
      }
    }

    return createdScopes;
  }

  async assignRolePermissions(roles, scopes) {
    console.log('\n🔗 Assigning permissions to roles...');

    const rolePermissions = {
      admin: [
        'inbox:read', 'inbox:write',
        'library:read', 'library:write',
        'catalog:browse', 'catalog:install',
        'profile:read', 'profile:manage',
        'organization:manage',
        'users:invite', 'users:manage'
      ],
      member: [
        'inbox:read', 'inbox:write',
        'library:read', 'library:write',
        'catalog:browse', 'catalog:install',
        'profile:read'
      ],
      guest: [
        'inbox:read',
        'library:read',
        'catalog:browse',
        'profile:read'
      ]
    };

    for (const role of roles) {
      const permissions = rolePermissions[role.name];
      if (!permissions) continue;

      const scopeIds = permissions
        .map(permission => scopes.find(s => s.name === permission)?.id)
        .filter(Boolean);

      if (scopeIds.length > 0) {
        try {
          await this.apiRequest(`/organization-roles/${role.id}/scopes`, {
            method: 'POST',
            body: JSON.stringify({ organizationScopeIds: scopeIds }),
          });
          console.log(`✅ Assigned ${scopeIds.length} permissions to ${role.name}`);
        } catch (error) {
          console.error(`❌ Failed to assign permissions to ${role.name}:`, error.message);
        }
      }
    }
  }

  async updateApplicationSettings() {
    console.log('\n⚙️  Updating application settings...');

    try {
      // Get current SPA application
      const apps = await this.apiRequest('/applications');
      const spaApp = apps.find(app => app.id === process.env.LOGTO_APP_ID);

      if (!spaApp) {
        throw new Error('SPA application not found');
      }

      // Update redirect URIs and CORS settings
      const updateData = {
        oidcClientMetadata: {
          redirectUris: [
            'http://localhost:6789/api/logto/callback',
            'http://localhost:6789/auth/callback'
          ],
          postLogoutRedirectUris: [
            'http://localhost:6789'
          ]
        },
        customClientMetadata: {
          corsAllowedOrigins: [
            'http://localhost:6789'
          ]
        }
      };

      await this.apiRequest(`/applications/${spaApp.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      console.log('✅ Application settings updated for port 6789');
    } catch (error) {
      console.error('❌ Failed to update application settings:', error.message);
    }
  }

  async setupSignInExperience() {
    console.log('\n🎨 Configuring sign-in experience...');

    try {
      const signInConfig = {
        branding: {
          logoUrl: '',
          darkLogoUrl: '',
          favicon: '',
          primaryColor: '#000000'
        },
        languageInfo: {
          autoDetect: true,
          fallbackLanguage: 'en'
        },
        signInMode: 'SignInAndRegister',
        customCss: `
.logto-container {
  font-family: 'Inter', system-ui, sans-serif;
}

.logto-header {
  margin-bottom: 2rem;
}

.logto-button {
  border-radius: 8px;
  font-weight: 500;
}
        `.trim()
      };

      await this.apiRequest('/sign-in-exp', {
        method: 'PATCH',
        body: JSON.stringify(signInConfig),
      });

      console.log('✅ Sign-in experience configured');
    } catch (error) {
      console.error('❌ Failed to configure sign-in experience:', error.message);
    }
  }

  async run() {
    console.log('🚀 Starting Logto configuration...');
    console.log(`Endpoint: ${this.endpoint}`);

    try {
      await this.getManagementToken();
      
      const scopes = await this.createOrganizationScopes();
      const roles = await this.createOrganizationRoles();
      
      await this.assignRolePermissions(roles, scopes);
      await this.updateApplicationSettings();
      await this.setupSignInExperience();

      console.log('\n🎉 Logto configuration completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Configure social providers in the admin console');
      console.log('2. Set up email templates for invitations');
      console.log('3. Test authentication flows');

    } catch (error) {
      console.error('❌ Configuration failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new LogtoSetup();
  setup.run();
}

export default LogtoSetup;