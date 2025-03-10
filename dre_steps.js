import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import exec from 'k6/execution';
import { getEnvVar } from "./utils/utils.js";
import { ErrorHandler } from "./utils/error_handler.js";
//import {Writer, Reader, Connection, SchemaRegistry, SCHEMA_TYPE_AVRO} from "k6/x/kafka"; // import kafka extension
import {Writer, Reader, Connection, SchemaRegistry, CODEC_SNAPPY, SCHEMA_TYPE_JSON} from "k6/x/kafka"; // import kafka extension
import { uuidv4,randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { SharedArray } from 'k6/data';

/*
.\k6 run dr_steps.js -o output-statsd -e K6_STATSD_ENABLE_TAGS=true -e K6_STATSD_ADDR=192.168.0.116:8186 -e K6_WEB_DASHBOARD=true -e K6_WEB_DASHBOARD_EXPORT=html-report.html -e CLIENT_ID=xxxx -e CLIENT_SECRET=xxxx -e USERNAME=xxxx -e PASSWORD=xxxx -e BASE_URL=https://test.com
*/
const DEBUG = getEnvVar("DEBUG", true);
const CLIENT_ID = getEnvVar("CLIENT_ID");
const CLIENT_SECRET = getEnvVar("CLIENT_SECRET");
const USERNAME = getEnvVar("USERNAME");
const PASSWORD = getEnvVar("PASSWORD");
const BASE_URL = getEnvVar("BASE_URL");

export const CounterErrors = new Counter('Errors');
export const options = {
      setupTimeout: '100s',
      thresholds: {
           'Errors{type:SETUP}': [{
                   threshold: 'count<1', // string
                   abortOnFail: true, // boolean
                   delayAbortEval: '0s', // string
                 }],
           'Errors{type:TEST}': [{
                   threshold: 'count<5', // string
                   abortOnFail: true, // boolean
                   delayAbortEval: '0s', // string
                 }]


      },

    scenarios: {
//        no_cash_produce_kafka_metric: {
//            executor: 'shared-iterations',
//            exec: 'no_cash_produce_kafka_metric',
//            vus: 1,
//            iterations: 1,
//            maxDuration: '2s',
//        },
//        with_cash_produce_kafka_metric: {
//            executor: 'shared-iterations',
//            exec: 'with_cash_produce_kafka_metric',
//            vus: 1,
//            iterations: 1,
//            maxDuration: '2s',
//        },
//        main_load_with_cash_produce_kafka: {
//            executor: 'shared-iterations',
//            exec: 'main_load_with_cash_produce_kafka',
//            vus: 1,
//            iterations: 1,
//            maxDuration: '2s',
//        },




        no_cash_produce_kafka_metric: {
            executor: 'ramping-vus',
            exec: 'no_cash_produce_kafka_metric', //_close_profile
            startVUs: 0,
            stages: [
                    { duration: '60s', target: 5 },
                    { duration: '5000s', target: 5 },
            ],
            gracefulRampDown: '0s',
        },
        with_cash_produce_kafka_metric: {
            executor: 'ramping-vus',
            exec: 'with_cash_produce_kafka_metric',
            startVUs: 0,
            stages: [
                    { duration: '60s', target: 5 },
                    { duration: '5000s', target: 5 },
            ],
            gracefulRampDown: '0s',
        },


        main_load_with_cash_produce_kafka: {
            executor: 'ramping-vus', //_open_profile
            exec: 'main_load_with_cash_produce_kafka',
            startVUs: 0,
            stages: [
//                    { duration: '60s', target: 1 },
//                    { duration: '300s', target: 1 },


//                    { duration: '30s', target: 14 },
//                    { duration: '300s', target: 14 },
//                    { duration: '30s', target: 15 },
//                    { duration: '300s', target: 15 },
//                    { duration: '30s', target: 16 },
//                    { duration: '300s', target: 16 },
//                    { duration: '30s', target: 17 },
//                    { duration: '300s', target: 17 },
//                    { duration: '30s', target: 18 },
//                    { duration: '300s', target: 18 },
                    { duration: '60s', target: 19 },
                    { duration: '300s', target: 19 },

                    { duration: '30s', target: 20 },
                    { duration: '300s', target: 20 },
                    { duration: '30s', target: 21 },
                    { duration: '300s', target: 21 },
                    { duration: '30s', target: 22 },
                    { duration: '300s', target: 22 },
                    { duration: '30s', target: 23 },
                    { duration: '300s', target: 23 },
                    { duration: '30s', target: 24 },
                    { duration: '300s', target: 24 },

                    { duration: '30s', target: 25 },
                    { duration: '300s', target: 25 },
                    { duration: '30s', target: 26 },
                    { duration: '300s', target: 26 },
                    { duration: '30s', target: 27 },
                    { duration: '300s', target: 27 },
                    { duration: '30s', target: 28 },
                    { duration: '300s', target: 28 },
                    { duration: '30s', target: 0 },
            ],
        },
    }
}


const errorHandler = new ErrorHandler((error) => {
  console.error(error);
});
export function checkLogError(res) {
  if (DEBUG) {
    console.log(DEBUG);
    console.log("status code = " + res.status)
    let checkStatus = check(
      res,
      {
        "status is 200": (res) => res.status === 200,
      },
      { name: "main_calls_status_200" },
    );
  }
}


const myTrend = new Trend('my_trend');

let params = {
    headers: {
      Connection: 'close',
    }
  };
const brokers = ["localhost:9092"];
const topic = "DiscreteRuleValueChanged";

const writer = new Writer({
    brokers: brokers,
    topic: topic,
    autoCreateTopic: false,
});
const reader = new Reader({
    brokers: brokers,
    topic: topic,
});
const connection = new Connection({
    address: brokers[0],
});
const schemaRegistry = new SchemaRegistry();
const array_evants_main= new Array(10);
export function url_encoded(uri, params){
        const url = new URL(BASE_URL+uri);
        params.forEach((_p)=>{
            url.searchParams.append(_p[0], _p[1]);
        })
        return url.toString();
};
export function pacing(cycleTime, startTime) {
    let waitTime = 0;
    var endTime = Date.now();
    let duration = endTime - startTime;
    waitTime = cycleTime - duration;
    waitTime = waitTime / 1000;
    return waitTime;
}
export function randomItem(arrayOfItems){
return arrayOfItems[Math.floor(Math.random() * arrayOfItems.length)];
}
const object_ids=[
//    '08834d8d-edcf-4230-9761-fe4e58d46a7a',
//    'e1d8eac1-fbe9-4f70-8501-f30bf6aec782',
//    'cc09e226-ac2a-423b-88d0-5e27172cac2d',
//    '8a43bfc7-6eee-4020-84aa-a992a4352e9c',
//    '5cf3cca6-f87f-4e8b-b4ac-dac9b6f34c27',
//
//    '3fc74871-1cb4-4af1-963b-42feaf4baf44',
//    '4d2dfc36-55d4-45aa-bc5d-8a66efc73589',
//    '26a8ca2d-f8e8-4efd-a936-3a592ceff5fc',
//    'c157580b-0730-4e11-88b0-8bca9a25a38e',
//    '11f5ffd1-e5e9-4f10-98ea-e32d5bbc6fc9',
//
    '3c70dfa5-a9ac-4138-b3dd-326ff064a630',
    'aa00a5e8-c95d-4199-8765-5d1bf4189cbd',
    '8fecdd70-34ac-4374-9218-6fb0cf1020fd',
    '762665dd-b962-44ee-bae3-5c4d096cd505',
    '93be4f91-f388-4d4b-8fb7-542490fd0096',
    'e3346d04-3809-4755-9603-abba2e9b6820',
    'fde677a2-d38b-4a8d-8e2c-032745200703',
    'bac7f50d-8c67-47bd-9cb5-d891e285e1b8',

]



// Получение токена
// создание тестового набора для одного VU (набор событий, например 20 - 40 с разными [ObjectId. SourceId]
export function setup () {
        let resPost = http.post(BASE_URL+'/auth/realms/ziiot/protocol/openid-connect/token',
            { // body
                 client_id: CLIENT_ID,
                 client_secret: CLIENT_SECRET,
                 username: USERNAME,
                 password: PASSWORD,
                 grant_type: 'password',
                 scope: 'openid'
            },
            {
                headers:{'Connection': 'close'},
                tags: { type: 'TOKEN', name: 'get_token' }
            }// headers and params
            );
            checkLogError(resPost);

            const contentOK = resPost.status === 200;
            CounterErrors.add(!contentOK);
            if (resPost.status===200){
                var token = resPost.json().access_token
                params.headers['authorization'] = 'Bearer '+resPost.json().access_token;
                params.headers['Accept-Language'] = 'ru';
                params.headers['Accept-Encoding'] = 'gzip, deflate';
                params.headers['Cache-Control'] = 'no-cache';
            }
        let _b=0
        while(_b<10){
            let _objectId = randomItem(object_ids);
            let _sourceId = uuidv4();
            let _propertyId = uuidv4();
            let _eventId_1 = uuidv4();

            let _from = new Date().toISOString();
            let messages = [
              {
                // The data type of the value is JSON
                value: schemaRegistry.serialize({
                    data: {
                          IdempotenceKey: uuidv4(),
                          CreatedDate: new Date().toISOString(),
                          EventType: {
                            CurrentValueIsAbnormal: true,
                            ControlValue: "1.0",
                            CorrelationId: uuidv4(),
                            EventId: _eventId_1,
                            EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                            EventTypeCode: "C200",
                            ObjectId: _objectId,
                            ObjectType: "PUMPING_STATION",
                            PropertyId: _propertyId,
                            ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                            SourceId: _sourceId,
                            ObjectPath: null,
                            From: _from,
                            BaseName: "K6 event setup",
                            BaseDescription: "TDICT_ISOLATION_STATUS",
                            CreatedDate: new Date().toISOString(),
                            TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                            BusinessTask: "ALARM_MONITORING",
                            SourceSystem: "ZULU",
                            RootObjectId: "00000000-0000-0000-0000-000000000000",
                            RootObjectType: ""
                          }
                        },
                  schemaType: SCHEMA_TYPE_JSON,
                }),
                time: new Date(), // Will be converted to timestamp automatically
              },
            ];
            writer.produce({ messages: messages });

            let _success1 = group('kafka_no_cash_event_setup', ()=>{
                let i=0;
                params['tags']={name: 'get_no_cash_event'}
                let _getting = false;
                let resGet_event = null;
                while (i < 60) {
                    resGet_event = http.get(BASE_URL+'/zif-events/events/'+_eventId_1, params);
                    if (resGet_event.status===200){
                        if(resGet_event.json().id===_eventId_1){
                            _getting=true;
                            break;
                        }
                    }
                    sleep(0.5)
                    i++;
                }
                check(_getting, {'get_no_cash_event': _getting}, { get_event: _getting});
                if (_getting) {
                    exec.vu.tags['status']='ok'
                } else{
                    console.log(resGet_event.status);
                    console.log("no cash. open event: "+_eventId_1+" from: "+ _from);

                    exec.vu.tags['status']='ko'
                    exec.vu.tags['type']='SETUP'
                    CounterErrors.add(true);
                }
                return _getting;
            });
            sleep(5)

            let _eventId_2 = uuidv4();
            _from = new Date().toISOString();
            messages = [
              {
                // The data type of the value is JSON
                value: schemaRegistry.serialize({
                    data: {
                          IdempotenceKey: uuidv4(),
                          CreatedDate: new Date().toISOString(),
                          EventType: {
                            CurrentValueIsAbnormal: true,
                            ControlValue: "1.0",
                            CorrelationId: uuidv4(),
                            EventId: _eventId_2,
                            EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                            EventTypeCode: "C200",
                            ObjectId: _objectId,
                            ObjectType: "PUMPING_STATION",
                            PropertyId: _propertyId,
                            ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                            SourceId: _sourceId,
                            ObjectPath: null,
                            From: _from,
                            BaseName: "K6 event setup",
                            BaseDescription: "TDICT_ISOLATION_STATUS",
                            CreatedDate: new Date().toISOString(),
                            TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                            BusinessTask: "ALARM_MONITORING",
                            SourceSystem: "ZULU",
                            RootObjectId: "00000000-0000-0000-0000-000000000000",
                            RootObjectType: ""
                          }
                        },
                  schemaType: SCHEMA_TYPE_JSON,
                }),
                time: new Date(), // Will be converted to timestamp automatically
              },
            ];
            writer.produce({ messages: messages });

            let _success2 = group('kafka_with_cash_event_setup', ()=>{
                let i=0;
                params['tags']={name: 'get_with_cash_event'}
                let _getting = false;
                let resGet_event = null;
                while (i < 60) {
//                    console.log("/zif-events/events/          "+ i)
                    resGet_event = http.get(BASE_URL+'/zif-events/events/'+_eventId_1, params);
                    if (resGet_event.status===200){
//                        console.log(resGet_event.json().id+" "+_eventId_1+" "+resGet_event.json().to+" "+ _from)
                        if(resGet_event.json().id ===_eventId_1 && resGet_event.json().to ===_from){
                            _getting=true;
                            break;
                        }
                    }
                    sleep(0.5)
                    i++;
                }
                check(_getting, {'get_with_cash_event': _getting}, { get_event: _getting});
                if (_getting) {
                    exec.vu.tags['status']='ok'
                } else{
                    console.log(resGet_event.status);
                    console.log("with cash close event: "+_eventId_1+" open event: "+_eventId_2+" new time: "+ _from);

                    exec.vu.tags['status']='ko'
                    exec.vu.tags['type']='SETUP'
                    CounterErrors.add(true);
                }
                return _getting;
            });
            array_evants_main[_b]={objectId:_objectId, sourceId:_sourceId, propertyId:_propertyId}
            _b++;
        }

    return {params:params, events_main:array_evants_main};
};

export function no_cash_produce_kafka_metric(data){
//    console.log("номер итерации VU ", __ITER);
    let _objectId = randomItem(object_ids);
    var cycleTime = 60000;
    var startTime = Date.now();
    let _sourceId = uuidv4();
    let _propertyId = uuidv4();
    let _eventId_1 = uuidv4();

    let _from = new Date().toISOString();
    let messages = [
      {
        // The data type of the value is JSON
        value: schemaRegistry.serialize({
            data: {
                  IdempotenceKey: uuidv4(),
                  CreatedDate: new Date().toISOString(),
                  EventType: {
                    CurrentValueIsAbnormal: true,
                    ControlValue: "1.0",
                    CorrelationId: uuidv4(),
                    EventId: _eventId_1,
                    EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                    EventTypeCode: "C200",
                    ObjectId: _objectId,
                    ObjectType: "PUMPING_STATION",
                    PropertyId: _propertyId,
                    ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                    SourceId: _sourceId,
                    ObjectPath: null,
                    From: _from,
                    BaseName: "K6 event",
                    BaseDescription: "TDICT_ISOLATION_STATUS",
                    CreatedDate: new Date().toISOString(),
                    TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                    BusinessTask: "ALARM_MONITORING",
                    SourceSystem: "ZULU",
                    RootObjectId: "00000000-0000-0000-0000-000000000000",
                    RootObjectType: ""
                  }
                },
          schemaType: SCHEMA_TYPE_JSON,
        }),
        time: new Date(), // Will be converted to timestamp automatically
      },
    ];
    writer.produce({ messages: messages });

    let _success1 = group('kafka_no_cash_event_first', ()=>{
        let i=0;
        data.params['tags']={name: 'get_no_cash_event'}
        let _getting = false;
        let resGet_event = null;
        while (i < 150) {
            resGet_event = http.get(BASE_URL+'/zif-events/events/'+_eventId_1, data.params);
//            checkLogError(resGet_event);
            if (resGet_event.status===200){
                if(resGet_event.json().id===_eventId_1){
                    _getting=true;
                    break;
                }
            }
            sleep(0.2)
            i++;
        }
        check(_getting, {'get_no_cash_event': _getting}, { get_event: _getting});
        if (_getting) {
            exec.vu.tags['status']='ok'
        } else{
        //todo exec.instance.vusActive - для разделения по этапам теста (может быть,
        // использовать вместо exec.vu.tags['type']='TEST' Ронять тест не по общему числу ошибок, а по числу ошибок
        // на ступени
            console.log(resGet_event.status, exec.instance.vusActive);
            console.log("no cash: "+resGet_event.json().id+" "+_eventId_1);

            exec.vu.tags['status']='ko'
            exec.vu.tags['type']='TEST'
            CounterErrors.add(true);
        }
        return _getting;
    });
    sleep(pacing(cycleTime, startTime));
}

export function with_cash_produce_kafka_metric(data){
    // Создаю тестовые данные (событие) для данного VU (каждый VU работает со своим событием, помнит его данные и
    // временную метку, последнего)
    if(data.event_cash==undefined){
        let _a=0;
        let _objectId = randomItem(object_ids);
        let _sourceId = uuidv4();
        let _propertyId = uuidv4();
        let _eventId_1 = uuidv4();

        let _from = new Date().toISOString();
        let messages = [
          {
            // The data type of the value is JSON
            value: schemaRegistry.serialize({
                data: {
                      IdempotenceKey: uuidv4(),
                      CreatedDate: new Date().toISOString(),
                      EventType: {
                        CurrentValueIsAbnormal: true,
                        ControlValue: "1.0",
                        CorrelationId: uuidv4(),
                        EventId: _eventId_1,
                        EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                        EventTypeCode: "C200",
                        ObjectId: _objectId,
                        ObjectType: "PUMPING_STATION",
                        PropertyId: _propertyId,
                        ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                        SourceId: _sourceId,
                        ObjectPath: null,
                        From: _from,
                        BaseName: "K6 event setup",
                        BaseDescription: "TDICT_ISOLATION_STATUS",
                        CreatedDate: new Date().toISOString(),
                        TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                        BusinessTask: "ALARM_MONITORING",
                        SourceSystem: "ZULU",
                        RootObjectId: "00000000-0000-0000-0000-000000000000",
                        RootObjectType: ""
                      }
                    },
              schemaType: SCHEMA_TYPE_JSON,
            }),
            time: new Date(), // Will be converted to timestamp automatically
          },
        ];
        writer.produce({ messages: messages });

        let _success1 = group('kafka_no_cash_event_setup', ()=>{
            let i=0;
            data.params['tags']={name: 'get_no_cash_event'}
            let _getting = false;
            let resGet_event = null;
            while (i < 150) {
                resGet_event = http.get(BASE_URL+'/zif-events/events/'+_eventId_1, data.params);
                if (resGet_event.status===200){
                    if(resGet_event.json().id===_eventId_1){
                        _getting=true;
                        break;
                    }
                }
                sleep(0.2)
                i++;
            }
            check(_getting, {'get_no_cash_event': _getting}, { get_event: _getting});
            if (_getting) {
//                    console.log("ok")
                exec.vu.tags['status']='ok'
            } else{
//                    console.log("ko")
                exec.vu.tags['status']='ko'
//                exec.vu.tags['type']='TEST'
//                CounterErrors.add(true);
            }
            return _getting;
        });
        sleep(randomIntBetween(4.5, 5.5));
        let _eventId_2 = uuidv4();
        _from = new Date().toISOString();
        messages = [
          {
            // The data type of the value is JSON
            value: schemaRegistry.serialize({
                data: {
                      IdempotenceKey: uuidv4(),
                      CreatedDate: new Date().toISOString(),
                      EventType: {
                        CurrentValueIsAbnormal: true,
                        ControlValue: "1.0",
                        CorrelationId: uuidv4(),
                        EventId: _eventId_2,
                        EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                        EventTypeCode: "C200",
                        ObjectId: _objectId,
                        ObjectType: "PUMPING_STATION",
                        PropertyId: _propertyId,
                        ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                        SourceId: _sourceId,
                        ObjectPath: null,
                        From: _from,
                        BaseName: "K6 event setup",
                        BaseDescription: "TDICT_ISOLATION_STATUS",
                        CreatedDate: new Date().toISOString(),
                        TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                        BusinessTask: "ALARM_MONITORING",
                        SourceSystem: "ZULU",
                        RootObjectId: "00000000-0000-0000-0000-000000000000",
                        RootObjectType: ""
                      }
                    },
              schemaType: SCHEMA_TYPE_JSON,
            }),
            time: new Date(), // Will be converted to timestamp automatically
          },
        ];
        writer.produce({ messages: messages });
        let _success2 = group('kafka_with_cash_event_setup', ()=>{
        let i=0;
        data.params['tags']={name: 'get_with_cash_event'}
            let _getting = false;
            let resGet_event = null;
            while (i < 150) {
                resGet_event = http.get(BASE_URL+'/zif-events/events/'+_eventId_1, data.params);
//                    checkLogError(resGet_event);

                if (resGet_event.status===200){
                    if(resGet_event.json().id ===_eventId_1 && resGet_event.json().to ===_from){
                        _getting=true;
                        break;
                    }
                }
                sleep(0.2)
                i++;
            }
            check(_getting, {'get_with_cash_event': _getting}, { get_event: _getting});
            if (_getting) {
                exec.vu.tags['status']='ok'
            } else{
                exec.vu.tags['status']='ko'
//                exec.vu.tags['type']='TEST'
//                CounterErrors.add(true);
            }
            return _getting;
        });
        data.event_cash={objectId:_objectId, sourceId:_sourceId, propertyId:_propertyId, eventId:_eventId_2};
        sleep(randomIntBetween(4.5, 5.5));
    }

    const item=data.event_cash;
    var cycleTime = 60000;
    var startTime = Date.now();

    let _objectId = item.objectId;
    let _sourceId = item.sourceId;
    let _propertyId = item.propertyId;

    let _eventId = uuidv4();
    let _from = new Date().toISOString();
    let messages = [
      {
        // The data type of the value is JSON
        value: schemaRegistry.serialize({
            data: {
                  IdempotenceKey: uuidv4(),
                  CreatedDate: new Date().toISOString(),
                  EventType: {
                    CurrentValueIsAbnormal: true,
                    ControlValue: "1.0",
                    CorrelationId: uuidv4(),
                    EventId: _eventId,
                    EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                    EventTypeCode: "C200",
                    ObjectId: _objectId,
                    ObjectType: "PUMPING_STATION",
                    PropertyId: _propertyId,
                    ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                    SourceId: _sourceId,
                    ObjectPath: null,
                    From: _from,
                    BaseName: "K6 event",
                    BaseDescription: "TDICT_ISOLATION_STATUS",
                    CreatedDate: new Date().toISOString(),
                    TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                    BusinessTask: "ALARM_MONITORING",
                    SourceSystem: "ZULU",
                    RootObjectId: "00000000-0000-0000-0000-000000000000",
                    RootObjectType: ""
                  }
                },
          schemaType: SCHEMA_TYPE_JSON,
        }),
        time: new Date(), // Will be converted to timestamp automatically
      },
    ];
    writer.produce({ messages: messages });

    let _success2 = group('kafka_with_cash_event', ()=>{
        let i=0;
        data.params['tags']={name: 'get_with_cash_event'}
        let _getting = false;
        let resGet_event = null;
        while (i < 150) {
            resGet_event = http.get(BASE_URL+'/zif-events/events/'+data.event_cash.eventId, data.params);
            if (resGet_event.status===200){
                if(resGet_event.json().id ===data.event_cash.eventId && resGet_event.json().to ===_from){
                    _getting=true;
                    break;
                }
            }
            sleep(0.2)
            i++;
        }
        check(_getting, {'get_with_cash_event': _getting}, { get_event: _getting});
        if (_getting) {
            exec.vu.tags['status']='ok'
        } else{
            console.log(resGet_event.status, '${exec.instance.vusActive}');
            console.log("close event: "+data.event_cash.eventId+" open event: "+_eventId+" new time: "+ _from);
            exec.vu.tags['status']='ko'
            exec.vu.tags['type']='TEST'
            CounterErrors.add(true);
//            CounterErrors.add(true);
        }
        return _getting;
    });
    data.event_cash.eventId=_eventId;
    sleep(pacing(cycleTime, startTime));
    return data;
}

export function main_load_with_cash_produce_kafka(data){
    var cycleTime = 1000;
    var startTime = Date.now();

    const item=randomItem(data.events_main);
    let _objectId = item.objectId;
    let _sourceId = item.sourceId;
    let _propertyId = item.propertyId;
    let _eventId_1 = uuidv4();

    let _from = new Date().toISOString();
    let messages = [
      {
        // The data type of the value is JSON
        value: schemaRegistry.serialize({
            data: {
                  IdempotenceKey: uuidv4(),
                  CreatedDate: new Date().toISOString(),
                  EventType: {
                    CurrentValueIsAbnormal: true,
                    ControlValue: "1.0",
                    CorrelationId: uuidv4(),
                    EventId: _eventId_1,
                    EventTypeId: "78bca828-f90d-475e-ad81-3d5fa496c7cd",
                    EventTypeCode: "C200",
                    ObjectId: _objectId,
                    ObjectType: "PUMPING_STATION",
                    PropertyId: _propertyId,
                    ModelId: "f6b96afa-4b85-4606-a986-2f9cc634753e",
                    SourceId: _sourceId,
                    ObjectPath: null,
                    From: _from,
                    BaseName: "K6 event",
                    BaseDescription: "TDICT_ISOLATION_STATUS",
                    CreatedDate: new Date().toISOString(),
                    TechnologicalParameter: "TP_FLOOD_CONTROL_SIGNAL_0064",
                    BusinessTask: "ALARM_MONITORING",
                    SourceSystem: "ZULU",
                    RootObjectId: "00000000-0000-0000-0000-000000000000",
                    RootObjectType: ""
                  }
                },
          schemaType: SCHEMA_TYPE_JSON,
        }),
        time: new Date(), // Will be converted to timestamp automatically
      },
    ];
    let _success1 = group('kafka_main_load', ()=>{
        writer.produce({ messages: messages });
    });
    group('pacing_group', ()=>{
        sleep(pacing(cycleTime, startTime));
    });
//    sleep(randomIntBetween(1.0, 1.0));
}


export function teardown(data) {
  writer.close();
  reader.close();
  connection.close();
}
