```
ft_transcendence/
├── docker-compose.yml
├── .env
├── Makefile
├── README.md
├── scripts/
│   ├── start-dev.sh
│   ├── start-prod.sh
│   ├── stop-all.sh
│   └── health-check.sh
├──azure/
│   ├── docker-compose.azure.yml        # Modified docker-compose for Azure
│   ├── .env.azure                      # Azure-specific environment variables
│   ├── deploy.sh                       # Deploy everything to Azure
│   ├── cleanup.sh                      # Remove everything from Azure
│   ├── check-status.sh                 # Check if services are running
└── services/                        # All Microservices
    ├── frontend/                    # Frontend Service
    ├── api-gateway/                 # API Gateway
    ├── auth-service/               # Authentication Service
    ├── user-service/               # User Management Service
    ├── game-service/               # Pong Game Service
    ├── match-service/              # Match History Service
    ├── tournament-service/         # Tournament Service
    ├── chat-service/               # Chat Service
    ├── notification-service/       # Notification Service
    ├── file-service/               # File Upload Service
    ├── stats-service/              # Statistics Service
    └── devops/                     # DevOps Infrastructure
        ├── monitoring/             # Prometheus + Grafana
        ├── logging/                # ELK Stack
        ├── nginx/                  # Load Balancer & Reverse Proxy
        ├── databases/              # Database Configurations
```