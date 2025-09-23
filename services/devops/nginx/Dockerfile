FROM owasp/modsecurity-crs:nginx

USER root

RUN apt-get update && apt-get install -y curl jq net-tools

RUN rm /etc/nginx/conf.d/default.conf
RUN chmod -R 755 /etc/nginx

RUN mkdir -p /etc/nginx/conf.d
RUN mkdir -p /var/log/nginx
RUN chown -R nginx:nginx /var/log/nginx

COPY config/ft-transcendence.conf /etc/nginx/conf.d/
COPY config/crs-setup.conf /etc/modsecurity.d/owasp-crs/crs-setup.conf
# USER nginx


EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
