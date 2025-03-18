import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import exec from 'k6/execution';
import { getEnvVar } from "./utils/utils.js";
import {Writer, Reader, Connection, SchemaRegistry, CODEC_SNAPPY, SCHEMA_TYPE_JSON} from "k6/x/kafka"; // import kafka extension
import { uuidv4,randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';


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
        event_create_with_metric_close_profile: {
            executor: 'ramping-vus',
            exec: 'metric_rest_create_and_wait_created_event_close_profile',
            startVUs: 0,
            stages: [
                    { duration: '60s', target: 5 },
                    { duration: '540s', target: 5 },
            ],
            gracefulRampDown: '0s',

        },
        event_create_main_close_profile: {
            executor: 'ramping-vus',
            exec: 'rest_main_create_event_close_profile',
            startVUs: 0,
            stages: [
                    { duration: '10s', target: 1 },
                    { duration: '60s', target: 1 },
                    { duration: '10s', target: 2 },
                    { duration: '60s', target: 2 },
                    { duration: '10s', target: 3 },
                    { duration: '60s', target: 3 },
                    { duration: '10s', target: 4 },
                    { duration: '60s', target: 4 },
                    { duration: '10s', target: 5 },
                    { duration: '60s', target: 5 },
                    { duration: '10s', target: 6 },
                    { duration: '60s', target: 6 },
                    { duration: '10s', target: 7 },
                    { duration: '60s', target: 7 },
                    { duration: '10s', target: 8 },
                    { duration: '60s', target: 8 },
                    { duration: '6s', target: 0 },
            ],
        },
    }
}
const myTrend = new Trend('my_trend');

let params = {
    headers: {
      Connection: 'close',
    },
  };

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

// Получение токена
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
            const contentOK = resPost.status === 200;
            CounterErrors.add(!contentOK);
            if (resPost.status===200){
                var token = resPost.json().access_token
                params.headers['authorization'] = 'Bearer '+resPost.json().access_token;
                params.headers['Accept-Language'] = 'ru';
                params.headers['Accept-Encoding'] = 'gzip, deflate';
                params.headers['Cache-Control'] = 'no-cache';
            }
    return params ;
};


export function metric_rest_create_and_wait_created_event_close_profile(params){
        params.headers['Content-Type'] ='application/json';
        params.headers['accept'] ='*/*';
//        const date = Date.now();
        const date = new Date();
        const dateString = new Date().toISOString();
        const _event_id=uuidv4()
        let event ={
                     "id": _event_id,
                     "eventTypeId": "4eb1230b-a616-4539-abfb-123456782222",
                     "from": new Date().toISOString(),
//                     "to": "",
                     "attributes": {},
                     "name": "K6",
                     "description": "K6 test",
//                     "parentId": "",
                     "elementId": uuidv4(),
                     "acknowledged": true,
                     "comment": "debug K6 test",
                     "eventStatusId": "0f838343-b18c-4681-b388-27142535f07e",
                     "eventStatus": {
                       "id": "0f838343-b18c-4681-b388-27142535f07e",
                       "code": "INPUT",
                       "name": "Входящее",
                       "description": null,
                       "order": 0,
                       "eventTypeId": "4eb1230b-a616-4539-abfb-123456782222"
                     }
                   }
        params['tags']={name: 'create_event'}
        let resPost = http.post(BASE_URL+'/zif-events/events', JSON.stringify(event), params);

        var cycleTime = 60000;
        var startTime = Date.now();

        let i=0;
        params['tags']={name: 'get_event'}
        const _success = group('get_event', ()=>{
            let _getting = false;
            let resGet_event = null;
            while (i < 500) {
                resGet_event = http.get(BASE_URL+'/zif-events/events/'+_event_id, params);
                if (resGet_event.status===200){
                    if(resGet_event.json().id===_event_id){
                        _getting=true;
                        break;
                    }
                }
                sleep(0.2)
                i++;
            }

            if (_getting) {
                exec.vu.tags['status']='ok'
            } else{
                exec.vu.tags['status']='ko'
            }
            return _getting;
        });
        group('pacing_group', ()=>{
            sleep(pacing(cycleTime, startTime));
        });
}

export function rest_main_create_event_close_profile(params){
        var cycleTime = 5000;
        var startTime = Date.now();
        params.headers['Content-Type'] ='application/json';
        params.headers['accept'] ='*/*';
        const date = new Date();
        const dateString = new Date().toISOString();
        const _event_id=uuidv4()
        let event ={
                     "id": _event_id,
                     "eventTypeId": "4eb1230b-a616-4539-abfb-123456782222",
                     "from": new Date().toISOString(),
//                     "to": "",
                     "attributes": {},
                     "name": "K6",
                     "description": "K6 test",
//                     "parentId": "",
                     "elementId": uuidv4(),
                     "acknowledged": true,
                     "comment": "debug K6 test",
                     "eventStatusId": "0f838343-b18c-4681-b388-27142535f07e",
                     "eventStatus": {
                       "id": "0f838343-b18c-4681-b388-27142535f07e",
                       "code": "INPUT",
                       "name": "Входящее",
                       "description": null,
                       "order": 0,
                       "eventTypeId": "4eb1230b-a616-4539-abfb-123456782222"
                     }
                   }
        params['tags']={name: 'create_event'}
        let resPost = http.post(BASE_URL+'/zif-events/events', JSON.stringify(event), params);
        console.log("resPost",resPost.status)
        group('pacing_group', ()=>{
            sleep(pacing(cycleTime, startTime));
        });
}

export function teardown(data) {
}
