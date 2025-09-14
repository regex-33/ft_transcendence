ARG ELK_VERSION=8.11.1
FROM docker.elastic.co/kibana/kibana:${ELK_VERSION}

# FROM elastdocker/kibana:${ELK_VERSION}

USER root

RUN apt update && apt install -y jq curl python 

COPY config/kibana.yml /usr/share/kibana/config/kibana.yml
COPY scripts/docker-healthcheck .

# create dashboard directory
RUN mkdir -p /dashboards

# Copy dashboard files
COPY dashboards /dashboards
# Set ownership and permissions for the configuration directory
RUN chown -R kibana:kibana /dashboards && \
    find /dashboards -type d -exec chmod 755 {} \; && \
    find /dashboards -type f -exec chmod 644 {} \;

RUN chown -R kibana:kibana /usr/share/kibana/config/ && \
    find /usr/share/kibana/config -type d -exec chmod 755 {} \; && \
    find /usr/share/kibana/config -type f -exec chmod 644 {} \;

RUN mkdir -p /scripts
COPY scripts/docker-healthcheck /scripts/docker-healthcheck
COPY scripts/import_dashboards.sh /scripts/import_dashboards.sh

RUN chmod +x /scripts/docker-healthcheck && \
    chmod +x /scripts/import_dashboards.sh && \
    chown kibana:kibana /scripts/import_dashboards.sh && \
    chown kibana:kibana /scripts/docker-healthcheck

USER kibana
EXPOSE 5601

# check health and run import_dashboards

HEALTHCHECK CMD sh /scripts/docker-healthcheck && sh /scripts/import_dashboards.sh