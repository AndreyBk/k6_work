#!/bin/sh
set -eu
cd /xk6
telegraf  -config /xk6/telegraf.conf &
/xk6/k6 run dre_rest.js -o output-statsd \
      -e K6_STATSD_ENABLE_TAGS=true




