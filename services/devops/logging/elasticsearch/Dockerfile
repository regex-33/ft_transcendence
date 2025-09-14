ARG ELK_VERSION=8.11.1
FROM docker.elastic.co/elasticsearch/elasticsearch:${ELK_VERSION}

# FROM elastdocker/elasticsearch:${ELK_VERSION}

USER root

RUN mkdir -p /usr/share/elasticsearch/config/templates/
RUN chown -R elasticsearch:elasticsearch /usr/share/elasticsearch/ && \
    find /usr/share/elasticsearch/config -type d -exec chmod 755 {} \; && \
    find /usr/share/elasticsearch/config -type f -exec chmod 644 {} \;

# Copy your custom config files
COPY config/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml
COPY config/log4j2.properties /usr/share/elasticsearch/config/log4j2.properties
COPY templates/template.json /usr/share/elasticsearch/config/templates/
COPY scripts/docker-healthcheck.sh .

USER elasticsearch

EXPOSE 9200 9300
HEALTHCHECK CMD sh ./docker-healthcheck.sh