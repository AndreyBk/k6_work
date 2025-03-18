FROM grafana/xk6
USER root
RUN /usr/local/bin/xk6 build v0.57.0 \
    --with github.com/mostafa/xk6-kafka@v0.30.0 \
    --with github.com/LeonAdato/xk6-output-statsd

RUN apk add --update --no-cache ca-certificates openssl
RUN wget https://dl.influxdata.com/telegraf/releases/telegraf-1.34.0_linux_amd64.tar.gz
RUN tar xf telegraf-1.34.0_linux_amd64.tar.gz -C / --strip-components=2
RUN rm telegraf-1.34.0_linux_amd64.tar.gz

COPY utils /xk6/utils
COPY docker-entrypoint.sh /xk6/docker-entrypoint.sh
COPY dre_steps.js /xk6/dre_steps.js
COPY dre_rest.js /xk6/dre_rest.js
COPY telegraf_debug.conf telegraf.conf

ENTRYPOINT ["/bin/sh","/xk6/docker-entrypoint.sh"]