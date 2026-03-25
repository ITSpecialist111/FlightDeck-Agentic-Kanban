// ============================================================================
// FlightDeck — Azure Infrastructure (Bicep)
// Deploys Container Apps hosting for MCP servers, Key Vault, monitoring, and
// managed identity with CORS rules for Power Apps.
// ============================================================================

targetScope = 'resourceGroup'

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

@description('Azure region for all resources.')
param location string

@description('Name of the Azure Container Registry that hosts the MCP server images.')
param containerRegistryName string

@description('Microsoft Entra ID (Azure AD) tenant ID used by the MCP servers for Graph API access.')
param graphTenantId string

@description('Application (client) ID of the Entra app registration used by the MCP servers.')
param graphClientId string

@allowed(['dev', 'staging', 'prod'])
@description('Deployment environment. Controls naming suffixes and default scaling.')
param environment string = 'dev'

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

var suffix = '-${environment}'
var logAnalyticsName = 'log-flightdeck${suffix}'
var appInsightsName = 'appi-flightdeck${suffix}'
var keyVaultName = 'kv-flightdeck${suffix}'
var containerAppsEnvName = 'cae-flightdeck${suffix}'
var managedIdentityName = 'id-flightdeck${suffix}'
var mcpDelegatedAppName = 'mcp-delegated${suffix}'
var mcpWebhookAppName = 'mcp-webhook${suffix}'
var orchestratorAppName = 'orchestrator${suffix}'
var storageName = 'stflightdeck${environment}'

// ---------------------------------------------------------------------------
// Log Analytics Workspace
// ---------------------------------------------------------------------------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ---------------------------------------------------------------------------
// Application Insights
// ---------------------------------------------------------------------------

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ---------------------------------------------------------------------------
// User-Assigned Managed Identity (shared by both Container Apps)
// ---------------------------------------------------------------------------

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
}

@description('Object ID of the admin user for Key Vault access.')
param adminObjectId string = '2ebb7524-6596-4f40-83e3-452c11d4298d'

// ---------------------------------------------------------------------------
// Key Vault — stores GRAPH_CLIENT_SECRET and other secrets
// ---------------------------------------------------------------------------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: managedIdentity.properties.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
      {
        tenantId: subscription().tenantId
        objectId: adminObjectId
        permissions: {
          secrets: [
            'get'
            'set'
            'list'
            'delete'
          ]
        }
      }
    ]
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Reference existing secret — value is set manually via CLI (az keyvault secret set)
resource graphClientSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' existing = {
  parent: keyVault
  name: 'GRAPH-CLIENT-SECRET'
}

// ---------------------------------------------------------------------------
// Container Apps Environment
// ---------------------------------------------------------------------------

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    daprAIInstrumentationKey: appInsights.properties.InstrumentationKey
  }
}

// ---------------------------------------------------------------------------
// Container App: MCP Delegated (OBO) Server
// ---------------------------------------------------------------------------

resource mcpDelegated 'Microsoft.App/containerApps@2024-03-01' = {
  name: mcpDelegatedAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'https://*.powerapps.com'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          allowCredentials: true
          maxAge: 3600
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'graph-client-secret'
          keyVaultUrl: graphClientSecret.properties.secretUri
          identity: managedIdentity.id
        }
        {
          name: 'appinsights-connection-string'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'mcp-delegated'
          image: '${containerRegistryName}.azurecr.io/flightdeck/mcp-delegated:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '3000'
            }
            {
              name: 'AZURE_TENANT_ID'
              value: graphTenantId
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: graphClientId
            }
            {
              name: 'AZURE_CLIENT_SECRET'
              secretRef: 'graph-client-secret'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '20'
              }
            }
          }
        ]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Container App: MCP Webhook (App-level) Server
// ---------------------------------------------------------------------------

resource mcpWebhook 'Microsoft.App/containerApps@2024-03-01' = {
  name: mcpWebhookAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'https://*.powerapps.com'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'PUT'
            'DELETE'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          allowCredentials: true
          maxAge: 3600
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'graph-client-secret'
          keyVaultUrl: graphClientSecret.properties.secretUri
          identity: managedIdentity.id
        }
        {
          name: 'appinsights-connection-string'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'mcp-webhook'
          image: '${containerRegistryName}.azurecr.io/flightdeck/mcp-webhook:latest'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'AZURE_TENANT_ID'
              value: graphTenantId
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: graphClientId
            }
            {
              name: 'AZURE_CLIENT_SECRET'
              secretRef: 'graph-client-secret'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Storage Account (used for durable state / queue triggers if needed later)
// ---------------------------------------------------------------------------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// ---------------------------------------------------------------------------
// Container App: Agent Orchestrator
// Runs the 4 triggers as a Node.js Express app on Container Apps instead of
// Azure Functions — avoids App Service Plan VM quota requirements.
// Triggers: transcript-webhook (HTTP), signal-scanner (cron 15min),
// daily-summary (cron 08:00 UTC), subscription-renewal (cron midnight).
// ---------------------------------------------------------------------------

resource orchestrator 'Microsoft.App/containerApps@2024-03-01' = {
  name: orchestratorAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 7071
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [
            'https://*.powerapps.com'
          ]
          allowedMethods: [
            'GET'
            'POST'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          allowCredentials: true
          maxAge: 3600
        }
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'graph-client-secret'
          keyVaultUrl: graphClientSecret.properties.secretUri
          identity: managedIdentity.id
        }
        {
          name: 'appinsights-connection-string'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'storage-connection-string'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'orchestrator'
          image: '${containerRegistryName}.azurecr.io/flightdeck/orchestrator:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '7071'
            }
            {
              name: 'FOUNDRY_ENDPOINT'
              value: 'https://ai-flightdeck.services.ai.azure.com/api/projects/flightdeck-project'
            }
            {
              name: 'GRAPH_TENANT_ID'
              value: graphTenantId
            }
            {
              name: 'GRAPH_CLIENT_ID'
              value: graphClientId
            }
            {
              name: 'GRAPH_CLIENT_SECRET'
              secretRef: 'graph-client-secret'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
            {
              name: 'AZURE_STORAGE_CONNECTION_STRING'
              secretRef: 'storage-connection-string'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '30'
              }
            }
          }
        ]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

@description('FQDN of the delegated MCP server.')
output mcpDelegatedFqdn string = mcpDelegated.properties.configuration.ingress.fqdn

@description('FQDN of the webhook MCP server.')
output mcpWebhookFqdn string = mcpWebhook.properties.configuration.ingress.fqdn

@description('FQDN of the orchestrator Container App for Graph webhook notifications.')
output orchestratorFqdn string = orchestrator.properties.configuration.ingress.fqdn

@description('Application Insights instrumentation key.')
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey

@description('Key Vault URI for secret management.')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Managed Identity principal ID for RBAC assignments.')
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
