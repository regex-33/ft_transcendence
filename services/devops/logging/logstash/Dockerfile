ARG ELK_VERSION=8.15.0
FROM docker.elastic.co/logstash/logstash:${ELK_VERSION}
# FROM elastdocker/logstash:${ELK_VERSION}

USER root

COPY config/logstash.yml /usr/share/logstash/config/logstash.yml
COPY config/pipelines.yml /usr/share/logstash/config/pipelines.yml

RUN mkdir -p /usr/share/logstash/data \
    /usr/share/logstash/logs \
    /usr/share/logstash/pipeline \
    /usr/share/logstash/patterns

COPY pipeline/ /usr/share/logstash/pipeline/

RUN chown -R logstash:logstash /usr/share/logstash/ && \
    chmod -R 755 /usr/share/logstash/data /usr/share/logstash/logs && \
    find /usr/share/logstash/config -type d -exec chmod 755 {} \; && \
    find /usr/share/logstash/config -type f -exec chmod 644 {} \; && \
    find /usr/share/logstash/pipeline -type f -exec chmod 644 {} \;

USER logstash

EXPOSE 5044 5045 5046 5047 5048 5001 5002 5003 8081 9600



HEALTHCHECK --interval=240s --timeout=120s --retries=5 \
  CMD curl -s -XGET 'http://127.0.0.1:9600'

# Add your logstash plugins setup here
# Example: RUN logstash-plugin install logstash-filter-json

CMD ["logstash", "-f", "/usr/share/logstash/pipeline/"]