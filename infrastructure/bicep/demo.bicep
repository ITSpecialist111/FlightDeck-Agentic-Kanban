/**
 * FlightDeck Demo — Container App for the public interactive demo.
 * Separate from main.bicep to avoid touching production infrastructure.
 *
 * References existing Container Apps Environment + Managed Identity
 * from the main deployment.
 */

targetScope = 'resourceGroup'

@description('Azure region')
param location string = 'uksouth'

@description('Container registry name (without .azurecr.io)')
param containerRegistryName string = 'crflightdeck'

@description('Environment suffix')
param environment string = 'dev'

@description('Container image tag')
param imageTag string = 'latest'

// ---------------------------------------------------------------------------
// Existing resources (created by main.bicep)
// ---------------------------------------------------------------------------

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: 'cae-flightdeck-${environment}'
}

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: 'id-flightdeck-${environment}'
}

// ---------------------------------------------------------------------------
// Demo Container App
// ---------------------------------------------------------------------------

resource demoApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'demo-${environment}'
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
        targetPort: 80
        transport: 'http'
      }
      registries: [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'demo'
          image: '${containerRegistryName}.azurecr.io/flightdeck/demo:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
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
// Outputs
// ---------------------------------------------------------------------------

output demoFqdn string = demoApp.properties.configuration.ingress.fqdn
output demoUrl string = 'https://${demoApp.properties.configuration.ingress.fqdn}'
