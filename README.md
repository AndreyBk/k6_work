# K6 - нагрузочные тесты
Официальная документация Grafana K6: https://grafana.com/docs/k6/latest/using-k6/

Планирую разделить тесты по веткам (а может и нет)

Набор компонентов:
- скрипт теста *.js (официальная документация рекомендует подключать тесты [configmap](https://grafana.com/docs/k6/latest/testing-guides/running-distributed-tests/#3-add-test-scripts))
- исполнитель k6.exe
- telegraf (разернуть в контейнере вместе с тестом)
- InfluxDb
- Grafana

## Подготовка среды для запуска

1. Устанавливаем Go https://timeweb.cloud/tutorials/go/ustanovka-go-na-windows

Для Windows: 
- cкачиваем установщик https://go.dev/dl/ 
- устанавливаем
- проверяем в терминале командой: _go version_ 
2. Устананвливаем сборщик **Custom k6 Builder** xk6 https://github.com/grafana/xk6 
 - в терминале выполняем команду: go install go.k6.io/xk6/cmd/xk6@latest
 - проверяем %USERPROFILE%\go\bin наличие файла  xk6.exe
3. Собираем исполнитель теста K6 командой xk6 build --with <наименование плагина> --with <наименование плагина>  Набор плагинов (библиотек), необходимых для теста, указываем аргументами команды. Полный набор плагинов расположен https://grafana.com/docs/k6/latest/extensions/explore/  
Пример: xk6 build --with github.com/mostafa/xk6-kafka@latest --with github.com/LeonAdato/xk6-output-statsd  
В результате, получим файл исполнителя теста **k6.exe**

## Подготовка тестовых скриптов
dre_steps.js - тест поиска максимума  
dre_stability.js - тест стабильности

## Локальный запуск теста
Перед запуском тестов, необходимо пробросить порт 9092 kafka на локальную машину
Каманда для запуска теста:   
.\k6 run dr_steps.js -o output-statsd -e K6_STATSD_ENABLE_TAGS=true -e K6_STATSD_ADDR=192.168.0.116:8186 -e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=html-report.html -e CLIENT_ID=xxxxx -e CLIENT_SECRET=xxxxx -e USERNAME=xxxxx -e PASSWORD=xxxxx -e BASE_URL=https://adress.test.com

.\k6 - расположение исполнителя  
K6_STATSD_ADDR - адрес и порт telegtaf (см. конфиг telegraf.conf)  
CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD - креды   
BASE_URL - адрес тестируемого полигона  

## Запуск в Docker
При сборке образа обратить внимание на версию go и версию используемых компонентов, при несовпадении, возникнут ошибки на этапе сборки образа.
Файлы скриптов *.js, файл точки входа docker-entrypoint.sh, конфиг телеграфа telegraf.conf собираю вместе с образом.

Затруднения:
Не получилось [управлять](https://grafana.com/docs/k6/latest/misc/k6-rest-api/#:~:text=life%20cycle.-,Stop%20Test,-PATCH%20http%3A//localhost) тестовым запуском извне.
Что дальше:
посмотреть в сторону playwright (нужен скриншотер и некий мастер как в locust)



