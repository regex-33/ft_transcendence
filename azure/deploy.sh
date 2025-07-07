#!/bin/bash
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
    print_error "Please copy .env.azure.example to .env.azure and configure it."
    exit 1
fi

# Load environment variables
source .env.azure

print_status "🚀 Starting deployment of ft_transcendence to Azure..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    print_error "curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    print_error "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# 1. Create Resource Group
print_status "📦 Creating resource group: $RESOURCE_GROUP"
az group create \
    --name $RESOURCE_GROUP \
    --location "$LOCATION" \
    --output table

# 2. Create Azure Container Registry
print_status "🏗️ Creating Azure Container Registry: $ACR_NAME"
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --output table

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
print_success "ACR Login Server: $ACR_LOGIN_SERVER"

# 3. Log in to ACR
print_status "🔑 Logging into Azure Container Registry..."
az acr login --name $ACR_NAME

# 4. Create Azure Database for PostgreSQL
print_status "🗄️ Creating Azure Database for PostgreSQL: $POSTGRES_SERVER_NAME"
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER_NAME \
    --location "$LOCATION" \
    --admin-user $POSTGRES_ADMIN_USER \
    --admin-password $POSTGRES_ADMIN_PASSWORD \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 14 \
    --output table

# Create database
print_status "📊 Creating database: $POSTGRES_DATABASE"
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER_NAME \
    --database-name $POSTGRES_DATABASE

# Configure firewall to allow Azure services
print_status "🔥 Configuring PostgreSQL firewall..."
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# 5. Create Azure Cache for Redis
print_status "🗂️ Creating Azure Cache for Redis: $REDIS_NAME"
az redis create \
    --resource-group $RESOURCE_GROUP \
    --name $REDIS_NAME \
    --location "$LOCATION" \
    --sku Basic \
    --vm-size c0 \
    --output table

# 6. Create Azure Storage Account
print_status "💾 Creating Azure Storage Account: $STORAGE_ACCOUNT_NAME"
az storage account create \
    --resource-group $RESOURCE_GROUP \
    --name $STORAGE_ACCOUNT_NAME \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --output table

# Create blob container
print_status "📁 Creating blob container: $AZURE_STORAGE_CONTAINER_NAME"
az storage container create \
    --name $AZURE_STORAGE_CONTAINER_NAME \
    --account-name $STORAGE_ACCOUNT_NAME \
    --public-access blob

# 7. Build and push Docker images
print_status "🔨 Building and pushing Docker images..."

# Update the docker-compose file with the actual ACR login server
sed -i "s|\${ACR_LOGIN_SERVER}|$ACR_LOGIN_SERVER|g" docker-compose.azure.yml

# Build all images
docker-compose -f docker-compose.azure.yml build

# Push all images to ACR
docker-compose -f docker-compose.azure.yml push

# 8. Deploy to Azure Container Instances
print_status "🌐 Deploying to Azure Container Instances..."

# Create container group from docker-compose
az container create \
    --resource-group $RESOURCE_GROUP \
    --name $CONTAINER_GROUP_NAME \
    --file docker-compose.azure.yml \
    --dns-name-label $DNS_NAME_LABEL \
    --location "$LOCATION" \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_NAME \
    --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

# 9. Get the public IP and URL
print_status "🔍 Getting deployment information..."
CONTAINER_IP=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query ipAddress.ip --output tsv)
CONTAINER_FQDN=$(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME --query ipAddress.fqdn --output tsv)

print_success "✅ Deployment completed successfully!"
echo ""
echo "🌍 Your application is now available at:"
echo "   Frontend: http://$CONTAINER_FQDN"
echo "   API Gateway: http://$CONTAINER_FQDN:3000"
echo "   IP Address: $CONTAINER_IP"
echo ""
echo "📊 To check the status of your containers:"
echo "   ./check-status.sh"
echo ""
echo "🗑️ To clean up all resources:"
echo "   ./cleanup.sh"
echo ""
print_warning "Note: It may take a few minutes for all services to be fully available."
print_warning "You can check the logs using: az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP_NAME"
