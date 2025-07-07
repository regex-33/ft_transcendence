#!/bin/bash
# ===== azure/check-status.sh =====
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.azure exists
if [ ! -f ".env.azure" ]; then
    print_error ".env.azure file not found!"
    exit 1
fi

# Load environment variables
source .env.azure

print_status "📊 Checking ft_transcendence deployment status..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed."
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    print_error "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "=================================================="
echo "🏗️  RESOURCE GROUP STATUS"
echo "=================================================="

# Check resource group
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_success "Resource Group: $RESOURCE_GROUP ✅"
    az group show --name $RESOURCE_GROUP --output table
else
    print_error "Resource Group: $RESOURCE_GROUP ❌"
    exit 1
fi

echo ""
echo "=================================================="
echo "🐳 CONTAINER INSTANCES STATUS"
echo "=================================================="

# Check container instances
if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME &> /dev/null; then
    print_success "Container Group: $CONTAINER_GROUP_NAME ✅"
    
    # Get container status
    CONTAINER_STATE=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query instanceView.state --output tsv)
    CONTAINER_IP=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query ipAddress.ip --output tsv)
    CONTAINER_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query ipAddress.fqdn --output tsv)
    
    echo "State: $CONTAINER_STATE"
    echo "IP Address: $CONTAINER_IP"
    echo "FQDN: $CONTAINER_FQDN"
    
    # Show container details
    az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --output table
    
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://$CONTAINER_FQDN"
    echo "   API Gateway: http://$CONTAINER_FQDN:3000"
    
    # Check individual service health
    echo ""
    echo "🔍 Service Health Check:"
    
    # List all containers in the group
    CONTAINERS=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query containers[].name --output tsv)
    
    for container in $CONTAINERS; do
        CONTAINER_STATUS=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query "containers[?name=='$container'].instanceView.currentState.state" --output tsv)
        
        if [ "$CONTAINER_STATUS" = "Running" ]; then
            print_success "  $container: Running ✅"
        else
            print_error "  $container: $CONTAINER_STATUS ❌"
        fi
    done
    
else
    print_error "Container Group: $CONTAINER_GROUP_NAME ❌"
fi

echo ""
echo "=================================================="
echo "🗄️  DATABASE STATUS"
echo "=================================================="

# Check PostgreSQL database
if az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME &> /dev/null; then
    print_success "PostgreSQL Server: $POSTGRES_SERVER_NAME ✅"
    
    DB_STATE=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME --query state --output tsv)
    DB_FQDN=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME --query fullyQualifiedDomainName --output tsv)
    
    echo "State: $DB_STATE"
    echo "FQDN: $DB_FQDN"
    
    az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME --output table
    
    # Check database connectivity
    echo ""
    echo "🔗 Database Connection Test:"
    if [ "$DB_STATE" = "Ready" ]; then
        print_success "  Database is ready for connections ✅"
    else
        print_warning "  Database state: $DB_STATE ⚠️"
    fi
else
    print_error "PostgreSQL Server: $POSTGRES_SERVER_NAME ❌"
fi

echo ""
echo "=================================================="
echo "🗂️  REDIS CACHE STATUS"
echo "=================================================="

# Check Redis cache
if az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME &> /dev/null; then
    print_success "Redis Cache: $REDIS_NAME ✅"
    
    REDIS_STATE=$(az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query provisioningState --output tsv)
    REDIS_HOSTNAME=$(az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query hostName --output tsv)
    REDIS_PORT=$(az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query port --output tsv)
    
    echo "State: $REDIS_STATE"
    echo "Hostname: $REDIS_HOSTNAME"
    echo "Port: $REDIS_PORT"
    
    az redis show --resource-group $RESOURCE_GROUP --name $REDIS_NAME --output table
else
    print_error "Redis Cache: $REDIS_NAME ❌"
fi

echo ""
echo "=================================================="
echo "💾 STORAGE ACCOUNT STATUS"
echo "=================================================="

# Check storage account
if az storage account show --resource-group $RESOURCE_GROUP --name $STORAGE_ACCOUNT_NAME &> /dev/null; then
    print_success "Storage Account: $STORAGE_ACCOUNT_NAME ✅"
    
    STORAGE_STATE=$(az storage account show --resource-group $RESOURCE_GROUP --name $STORAGE_ACCOUNT_NAME --query provisioningState --output tsv)
    
    echo "State: $STORAGE_STATE"
    
    az storage account show --resource-group $RESOURCE_GROUP --name $STORAGE_ACCOUNT_NAME --output table
    
    # Check blob container
    echo ""
    echo "📁 Blob Container Status:"
    if az storage container show --name $AZURE_STORAGE_CONTAINER_NAME --account-name $STORAGE_ACCOUNT_NAME &> /dev/null; then
        print_success "  Container '$AZURE_STORAGE_CONTAINER_NAME' exists ✅"
    else
        print_error "  Container '$AZURE_STORAGE_CONTAINER_NAME' not found ❌"
    fi
else
    print_error "Storage Account: $STORAGE_ACCOUNT_NAME ❌"
fi

echo ""
echo "=================================================="
echo "🏗️  CONTAINER REGISTRY STATUS"
echo "=================================================="

# Check container registry
if az acr show --resource-group $RESOURCE_GROUP --name $ACR_NAME &> /dev/null; then
    print_success "Container Registry: $ACR_NAME ✅"
    
    ACR_STATE=$(az acr show --resource-group $RESOURCE_GROUP --name $ACR_NAME --query provisioningState --output tsv)
    ACR_LOGIN_SERVER=$(az acr show --resource-group $RESOURCE_GROUP --name $ACR_NAME --query loginServer --output tsv)
    
    echo "State: $ACR_STATE"
    echo "Login Server: $ACR_LOGIN_SERVER"
    
    az acr show --resource-group $RESOURCE_GROUP --name $ACR_NAME --output table
    
    echo ""
    echo "📦 Docker Images in Registry:"
    if az acr repository list --name $ACR_NAME --output table 2>/dev/null; then
        # Show image tags for each repository
        REPOS=$(az acr repository list --name $ACR_NAME --output tsv 2>/dev/null)
        for repo in $REPOS; do
            echo "  Repository: $repo"
            az acr repository show-tags --name $ACR_NAME --repository $repo --output table --query "[].{Tag:name,CreatedTime:timeCreated}" 2>/dev/null || echo "    No tags found"
        done
    else
        print_warning "No repositories found in registry"
    fi
else
    print_error "Container Registry: $ACR_NAME ❌"
fi

echo ""
echo "=================================================="
echo "📋 RECENT CONTAINER LOGS"
echo "=================================================="

# Show recent logs from containers
if az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME &> /dev/null; then
    print_status "Recent logs from container services..."
    
    # Get list of containers
    CONTAINERS=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query containers[].name --output tsv)
    
    for container in $CONTAINERS; do
        echo ""
        echo "--- Logs from $container ---"
        az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --container-name $container --tail 5 2>/dev/null || echo "No logs available for $container"
    done
else
    print_warning "Cannot retrieve logs - container group not found"
fi

echo ""
echo "=================================================="
echo "🚀 SERVICE ENDPOINTS TEST"
echo "=================================================="

if [ ! -z "$CONTAINER_FQDN" ]; then
    print_status "Testing service endpoints..."
    
    # Test frontend
    echo "🌐 Testing Frontend..."
    if curl -s -f "http://$CONTAINER_FQDN" > /dev/null; then
        print_success "  Frontend is accessible ✅"
    else
        print_error "  Frontend is not accessible ❌"
    fi
    
    # Test API Gateway
    echo "🔌 Testing API Gateway..."
    if curl -s -f "http://$CONTAINER_FQDN:3000/health" > /dev/null 2>&1; then
        print_success "  API Gateway is accessible ✅"
    else
        print_warning "  API Gateway health check failed ⚠️"
    fi
    
    # Test individual microservices (if they have health endpoints)
    SERVICES=("auth-service:3001" "user-service:3002" "game-service:3003" "match-service:3004" "tournament-service:3005" "chat-service:3006" "notification-service:3007" "file-service:3008" "stats-service:3009")
    
    for service in "${SERVICES[@]}"; do
        SERVICE_NAME=$(echo $service | cut -d: -f1)
        SERVICE_PORT=$(echo $service | cut -d: -f2)
        
        echo "🔍 Testing $SERVICE_NAME..."
        if curl -s -f "http://$CONTAINER_FQDN:$SERVICE_PORT/health" > /dev/null 2>&1; then
            print_success "  $SERVICE_NAME is accessible ✅"
        else
            print_warning "  $SERVICE_NAME health check failed ⚠️"
        fi
    done
else
    print_warning "No FQDN available for endpoint testing"
fi

echo ""
echo "=================================================="
echo "💰 ESTIMATED COSTS"
echo "=================================================="

print_status "Checking estimated costs for the last 30 days..."
az consumption usage list \
    --start-date $(date -d '30 days ago' +%Y-%m-%d) \
    --end-date $(date +%Y-%m-%d) \
    --output table \
    --query "[?contains(instanceId, '$RESOURCE_GROUP')]" \
    2>/dev/null || print_warning "Cost information not available (may require billing setup)"

echo ""
echo "=================================================="
echo "🔧 TROUBLESHOOTING INFO"
echo "=================================================="

# Show resource group resources
echo "📋 All resources in resource group:"
az resource list --resource-group $RESOURCE_GROUP --output table

# Show any deployment errors
echo ""
echo "⚠️  Recent deployment operations:"
az deployment group list --resource-group $RESOURCE_GROUP --output table --query "[?provisioningState!='Succeeded']" 2>/dev/null || echo "No recent deployments found"

echo ""
print_success "✅ Status check completed!"
echo ""
echo "💡 Useful commands:"
echo "   - View all resources: az resource list --resource-group $RESOURCE_GROUP --output table"
echo "   - View container logs: az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --container-name <service-name>"
echo "   - Restart containers: az container restart --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME"
echo "   - Scale containers: az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME"
echo "   - Monitor performance: az monitor metrics list --resource /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_GROUP_NAME"
echo ""
echo "📊 Dashboard URLs:"
echo "   - Azure Portal: https://portal.azure.com/#@$AZURE_TENANT_ID/resource/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/overview"
echo "   - Container Instances: https://portal.azure.com/#@$AZURE_TENANT_ID/resource/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/$CONTAINER_GROUP_NAME/overview"
echo ""
if [ ! -z "$CONTAINER_FQDN" ]; then
    echo "🌍 Application Access:"
    echo "   - Frontend: http://$CONTAINER_FQDN"
    echo "   - API Gateway: http://$CONTAINER_FQDN:3000"
    echo "   - Game Service: http://$CONTAINER_FQDN:3003"
    echo "   - Chat Service: http://$CONTAINER_FQDN:3006"
fi
echo ""
print_status "For detailed logs of a specific service:"
echo "  az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --container-name <service-name> --follow"