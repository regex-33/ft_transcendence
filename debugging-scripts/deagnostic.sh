#!/bin/bash
# Docker Swarm Diagnostic Script
# Run this on the manager node to diagnose service issues

echo "=== DOCKER SWARM DIAGNOSTIC ==="
echo

echo "1. Node Status and Labels:"
echo "========================="
docker node ls
echo
echo "Node Labels:"
for node in $(docker node ls --format "{{.ID}}"); do
    echo "Node: $(docker node inspect $node --format '{{.Description.Hostname}} ({{.Spec.Role}})')"
    echo "Labels:"
    docker node inspect $node --format '{{range $k, $v := .Spec.Labels}}  {{$k}} = {{$v}}{{end}}'
    echo "Availability: $(docker node inspect $node --format '{{.Spec.Availability}}')"
    echo "Status: $(docker node inspect $node --format '{{.Status.State}}')"
    echo
done

echo "2. Service Status Details:"
echo "========================"
docker service ls
echo

echo "3. Failed Services Details:"
echo "=========================="
for service in $(docker service ls --filter "desired-state=running" --format "{{.Name}}"); do
    replicas=$(docker service ls --filter "name=$service" --format "{{.Replicas}}")
    if [[ $replicas == 0/* ]]; then
        echo "FAILED SERVICE: $service"
        echo "Replicas: $replicas"
        echo "Service inspect:"
        docker service inspect $service --format '{{.Spec.TaskTemplate.Placement.Constraints}}'
        echo "Recent tasks:"
        docker service ps $service --no-trunc
        echo "---"
    fi
done

echo
echo "4. Networks:"
echo "==========="
docker network ls --filter driver=overlay

echo
echo "5. Secrets and Configs:"
echo "====================="
echo "Secrets:"
docker secret ls
echo "Configs:"
docker config ls

echo
echo "6. System Resources:"
echo "==================="
echo "Manager node resources:"
docker system df
echo
echo "Images available:"
docker image ls --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo
echo "7. Service Logs (last 10 lines each for failed services):"
echo "========================================================"
for service in $(docker service ls --filter "desired-state=running" --format "{{.Name}}"); do
    replicas=$(docker service ls --filter "name=$service" --format "{{.Replicas}}")
    if [[ $replicas == 0/* ]]; then
        echo "=== LOGS for $service ==="
        docker service logs --tail 10 $service 2>/dev/null || echo "No logs available"
        echo
    fi
done
