#!/bin/bash
# ===== azure/cleanup.sh =====
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

print_warning "🧹 This will DELETE ALL Azure resources for ft_transcendence!"
print_warning "Resources to be deleted:"
print_warning "  - Resource Group: $RESOURCE_GROUP"
print_warning "  - Container Registry: $ACR_NAME"
print_warning "  - PostgreSQL Database: $POSTGRES_SERVER_NAME"
print_warning "  - Redis Cache: $REDIS_NAME"
print_warning "  - Storage Account: $STORAGE_ACCOUNT_NAME"
print_warning "  - Container Instances: $CONTAINER_GROUP_NAME"
print_warning "  - ALL DATA WILL BE LOST!"

echo ""
read -p "Are you sure you want to continue? (Type 'DELETE' to confirm): " confirmation

if [ "$confirmation" != "DELETE" ]; then
    print_status "Cleanup cancelled."
    exit 0
fi

print_status "🗑️ Starting cleanup of Azure resources..."

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

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource group $RESOURCE_GROUP does not exist. Nothing to clean up."
    exit 0
fi

# Option 1: Delete everything by deleting the resource group
print_status "🔥 Deleting resource group: $RESOURCE_GROUP"
print_status "This will delete ALL resources in the group..."

az group delete \
    --name $RESOURCE_GROUP \
    --yes \
    --no-wait

print_success "✅ Cleanup initiated!"
print_status "🕐 The deletion is running in the background and may take several minutes."
print_status "You can check the status with: az group show --name $RESOURCE_GROUP"

# Optional: Clean up local Docker images
echo ""
read -p "Do you want to clean up local Docker images? (y/N): " cleanup_docker

if [[ $cleanup_docker =~ ^[Yy]$ ]]; then
    print_status "🐳 Cleaning up local Docker images..."
    
    # Remove built images
    docker images | grep "ft-transcendence" | awk '{print $3}' | xargs -r docker rmi -f
    
    # Remove dangling images
    docker image prune -f
    
    print_success "Local Docker images cleaned up!"
fi

print_success "🎉 Cleanup completed!"
print_status "All Azure resources have been deleted."
print_status "It may take a few minutes for all resources to be fully removed."

