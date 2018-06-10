import * as moment from 'moment-timezone';
import * as express from "express";
// import * as crypto from 'crypto';
//import * as request from 'request';
import * as Nano from 'nano';
import * as async from 'async';
import * as uuidV4 from 'uuid';
import * as cors from 'cors';
import * as fs from 'fs';
import * as http from 'http';
import * as redis from 'redis';
///import * as __browser from 'detect-browser';
import * as path from 'path'
// import * as passwordValidator from 'password-validator';
// import * as passwordValidator from 'password-validator';
var passwordValidator = require('password-validator');
//import * as util from 'util';
import * as Q from 'q';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import * as WebSocket from 'ws';
//import { RequestHandlerParams } from 'express-serve-static-core';
import { Request, NextFunction, ErrorRequestHandler, Response } from "express";
// import { NextHandleFunction } from 'connect';

export interface gijuser {
    username: string;
    password: string;
    phonenumber: number;
    gui: string;
    createddate: Date;
    lastupdate: Date;
    isactive: boolean;
    parents: string[];
    roles: string[];
    logintoken: string;
    expirelogintoken: string;
    description: string;
    photo: string[];
    note: string;
    system: string[];
    gijvalue: number;
    totagij: number;
    totalgijspent: number;
}
export interface gij { // as gij stock
    gui: string;
    sn: string;
    value: number;
    createddate: Date;
    importeddate: Date;
    isused: boolean;
}
export interface usergij {
    usergui: string;
    sn: string;
    gijgui: string;
    gijvalue: number;
    usedtime: Date;
    ref: any[];
    owners: any[];
    gijpocketgui: string;
}
export interface gijpocket {
    gui: string;
    usergui: string;
    createddate: Date;
    totalvalue: number; // total value left
    totalspent: number; // total spent all time
    totalgij: number; // total gij left
    sumgij: number; // total gij consumed all time
}
export interface gijpayment {
    gui: string;
    usergui: string;
    paymenttime: string;
    paymentvalue: number;
    ref: string;
    sender: string;
    receiver: string;
    sendingvalue: number;
    receivingvalue: number;
    paymentype: string;
}
export interface serviceprovider {
    gui: string;
    servicename: string;
    description: string;
    discount: number;
}
export interface servicepackage {
    gui: string;
    packagename: string;
    packagevalue: number;
    description: string;
    createddate: Date;
    serviceprovider: any[];
    isactive: boolean;
}
export interface customers {
    gui: string;
    usergui: string;
    currentpackage: [{
        packagegui: string;
        starttime: Date;
        endtime: Date;
        paymentgui: string;
    }],
    createddate: string;
    lastupdate: string;
    isactive: boolean;

}
class App {
    
    //*** DESIGN */
    private __design_serviceprovider = {
        "_id": "_design/objectList",
        "views": {
            "findByGUI": {
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,null);\r\n    }\r\n}"
            },
            "countByGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };
    private __design_package = {
        "_id": "_design/objectList",
        "views": {
            "findByGUI": {
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,null);\r\n    }\r\n}"
            },
            "countByGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };
    private __design_customer = {
        "_id": "_design/objectList",
        "views": {
            "findByUserGUI": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            },
            "countByUserGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };
    private __design_gij = {
        "_id": "_design/objectList",
        "views": {
            "findCreatedDate": {
                "map": "function(doc) {\r\n    if(doc.createddate) {\r\n        emit(doc.createddate,null);\r\n    }\r\n}"
            },
            "countByUserGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.gui) {\r\n        emit(doc.gui,null);\r\n    }\r\n}"
            },

            "findImportedDate": {
                "map": "function(doc) {\r\n    if(doc.importeddate) {\r\n        emit(doc.importeddate,null);\r\n    }\r\n}"
            },
            "countByImportedDate": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.importeddate) {\r\n        emit(doc.importeddate,null);\r\n    }\r\n}"
            },
            "findSN": {
                "map": "function(doc) {\r\n    if(doc.sn) {\r\n        emit(doc.sn,null);\r\n    }\r\n}"
            },
            "findIsUsed": {
                "map": "function(doc) {\r\n            emit(doc.isused,null);\r\n    }"
            },
            "countIsUsed": {
                "reduce": "_count",
                "map": "function(doc) {\r\n            emit(doc.isused,null);\r\n    }"
            },
        },
        "language": "javascript"
    };
    private __design_usergij = {
        "_id": "_design/objectList",
        "views": {
            "findPaymentRef": {
                "map": "function(doc) {\r\n    if(doc.ref) {\r\n        emit([doc.ref,doc.gui],null);\r\n    }\r\n}"
            },
            "findUsedTime": {
                "map": "function(doc) {\r\n   emit([doc.usedtime,doc.gui],null);\r\n    }"
            },
            "countUsedTime": {
                "reduce": "_count",
                "map": "function(doc) {\r\n   emit([doc.usedtime,doc.gui],null);\r\n    }"
            },
            "findAvailableGij": {
                "map": "function(doc) {\r\n   if(doc.usedtime&&doc.gui) emit(doc.gui,null);\r\n    }"
            },
            "countAvailableGij": {
                "reduce": "_count",
                "map": "function(doc) {\r\n   if(doc.usedtime&&doc.gui) emit(doc.gui,null);\r\n    }"
            },
            "findUsedGij": {
                "map": "function(doc) {\r\n   if(!doc.usedtime&&doc.gui) emit(doc.gui,null);\r\n    }"
            },
            "countUsedGij": {
                "reduce": "_count",
                "map": "function(doc) {\r\n   if(!doc.usedtime&&doc.gui) emit(doc.gui,null);\r\n    }"
            },
            "sumAllGij": {
                "reduce": "_sum",
                "map": "function(doc) {\r\n   emit(doc.pocketgui,doc.gijvalue);\r\n    }"
            },
            "sumSpent": {
                "reduce": "_sum",
                "map": "function(doc) {\r\n  if(doc.usedtime) emit(doc.pocketgui,doc.gijvalue);\r\n    }"
            },
            "findByUserGUI": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            },
            "countByUserGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            },
            "findByPocketGUI": {
                "map": "function(doc) {\r\n    if(doc.pocketgui) {\r\n        emit(doc.pocketgui,null);\r\n    }\r\n}"
            },
            "countByPocketGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.pocketgui) {\r\n        emit(doc.pocketgui,null);\r\n    }\r\n}"
            },
            "findSN": {
                "map": "function(doc) {\r\n    if(doc.sn) {\r\n        emit(doc.sn,null);\r\n    }\r\n}"
            },
            "findByGIJGUI": {
                "map": "function(doc) {\r\n    if(doc.gijgui) {\r\n        emit(doc.gijgui,null);\r\n    }\r\n}"
            },
            "countByGIJGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.gijgui) {\r\n        emit(doc.gijgui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };
    private __design_gijpocket = {
        "_id": "_design/objectList",
        "views": {
            "findByUserGUI": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            },
            "countByUserGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };
    private __design_gijpayment = {

        "_id": "_design/objectList",
        "views": {
            "findPaymentRef": {
                "map": "function(doc) {\r\n    if(doc.ref) {\r\n        emit([doc.ref],null);\r\n    }\r\n}"
            },
            "findPaymentTime": {
                "map": `(doc) {
                    var d = new Date(doc.paymenttime);
                                 if (d != null) {
                                     var key = [d.getFullYear(),
                                                (d.getMonth()+1),
                                                d.getDate()];
                                                
                                         emit(key, null);
                                 }
                                 
                                 //emit(null,d.getMonth());
                 }`
            },
            "countPaymenTime": {
                "reduce": "_count",
                "map": "function(doc) {\r\n   emit([doc.paymenttime],null);\r\n    }"
            },
            "findByUserGUI": {
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            },
            "countByUserGUI": {
                "reduce": "_count",
                "map": "function(doc) {\r\n    if(doc.usergui) {\r\n        emit(doc.usergui,null);\r\n    }\r\n}"
            }
        },
        "language": "javascript"
    };

    private ws_client: WebSocket;
    private wsoption: WebSocket.ServerOptions;
    private wss: WebSocket.Server;

    private _current_system = 'gij';
    private _client_prefix = ['ice-maker', 'gij', 'web-post', 'user-management', 'default'];
    private _system_prefix = ['ice-maker', 'gij', 'web-post', 'user-management'];
    private http = require('http');
    public server: http.Server;
    private _usermanager_host: string;
    private _usermanager_ws: string;
    private app: express.Application = express();
    private nano: any;
    private r_client: redis.RedisClient;
    private passValidator: any;
    private userValidator: any;
    private phoneValidator: any;
    private config(): void {
        this.app.set('trust proxy', true);
        this.app.use(methodOverride());
        this.app.use(cors());
        this.app.use(bodyParser.json());
        // this.app.use(bodyParser.urlencoded({ extended: false }));
        this.server = http.createServer(this.app);
        this.routes();


        /// WEBSOCKET
        this.wsoption = {};
        this.wsoption.server = this.server;
        this.wsoption.perMessageDeflate = false;
        this.wss = new WebSocket.Server(this.wsoption);

    }
    clog(f: string, ...p) {
        console.log(f, p.length ? p : '');
    }
    private routes(): void {
        const router = express.Router();
        this.app.use('/public', express.static(__dirname + '../../../public'));
        this.app.use(this.errorHandler);
        let parent = this;
        router.all('/', (req: Request, res: Response) => {
            parent.clog('OK Test');
            res.sendFile(path.join(__dirname + '../../../index.html'));
        });
        this.app.use('/', router);

        // this.app.all('/', (req: Request, res: Response) => {
        //     this.clog('OK Test');
        //     res.sendFile(path.join(__dirname + '../../../index.html'));
        // });
    }
    initWebsocket(): any {
        let parent = this;
        this.ws_client = new WebSocket(this._usermanager_ws); // user-management        
        this.wss.on('connection', function connection(ws, req) {
            const ip = req.connection.remoteAddress;
            console.log('connection from ' + ip);
            //const ip = req.headers['x-forwarded-for'];
            ws['isAlive'] = true;
            ws.binaryType = 'arraybuffer';
            ws['client'] = {};
            ws['client'].auth = {};
            ws['gui'] = '';
            ws['lastupdate'];

            ws.on('pong', () => {
                // if (!ws['lastupdate'] && !ws['gui']) {
                //     ws['isAlive'] = false;
                // }
                // let startDate = moment(ws['lastupdate'])
                // let endDate = moment(parent.convertTZ(new Date()));
                // const timeout = endDate.diff(startDate, 'seconds');
                // if (timeout > 60 * 3)
                //     ws['isAlive'] = false;
                // else
                //     ws['isAlive'] = true;

                // console.log('HEART BEAT:' + ws['gui'] + " is alive:" + ws['isAlive'] + " " + ws['lastupdate'] + " timeout" + timeout);
                // //this.send(this.client);
            });
            ws.on('error', function (err) {
                //js.client.data.message=JSON.stringify(err);
                var l = {
                    log: err,
                    logdate: parent.convertTZ(new Date()),
                    type: "error",
                    gui: uuidV4()
                };
                parent.errorLogging(l);
            })
            ws.on('message', function incoming(data) {
                let js = {};
                try {
                    js['client'] = JSON.parse(parent.ab2str(data));
                    js['ws'] = ws;
                    ws['lastupdate'] = parent.convertTZ(new Date());
                    ws['isAlive'] = true;
                    ws['gui'] = js['client'].gui;
                    js['client'].auth = {};
                    ws['client'] = js['client'];
                    //console.log(ws['client']);
                    parent.commandReader(js).then(res => {
                        js = res;
                        ws['gui'] = js['client'].gui;
                        ws['client'] = js['client'];
                        ws['lastupdate'] = parent.convertTZ(new Date());

                        if (res['client'].data.command === 'logout') {
                            ws['gui'] = '';
                            ws['client'] = '';
                            ws['lastupdate'] = '';
                        }
                        delete js['client'].auth;
                        parent.filterObject(js['client'].data);
                        console.log('sending');
                        //console.log(js['client']);
                        let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                        ws.send((JSON.stringify(b)), {
                            binary: true
                        });
                    }).catch(err => {
                        js = err;
                        var l = {
                            log: js['client'].data.message,
                            logdate: parent.convertTZ(new Date()),
                            type: "error",
                            gui: uuidV4()
                        };
                        //console.log(err);
                        parent.errorLogging(l);
                        console.log('ws sending');
                        ws['client'] = js['client'];
                        ws['lastupdate'] = parent.convertTZ(new Date());
                        js['client'].data.message = js['client'].data.message.message;
                        parent.filterObject(js['client'].auth);
                        let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                        ws.send((JSON.stringify(b)), {
                            binary: true
                        });
                    });
                } catch (error) {
                    js['client'].data.message = error.message;
                    ws['client'] = js['client'];
                    ws['lastupdate'] = parent.convertTZ(new Date());
                    parent.filterObject(js['client'].auth);
                    let b = Buffer.from(JSON.stringify(js['client'])).toString('base64');
                    ws.send((JSON.stringify(b)), {
                        binary: true
                    });
                }

            });

        });
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                try {
                    if (ws['isAlive'] === false) return ws.terminate();
                    console.log('TIME INTERVAL');
                    ws['isAlive'] = false;
                    ws.ping(() => { });
                } catch (error) {
                    console.log(error);
                }
            });
        }, 60000); // set 60 seconds 

    }
    monitor_redis(time: any, args: any, raw_reply: any): redis.Callback<undefined> {
        //console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
        let parent = this;
        //console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
        args = args.toString();
        if (args.indexOf('set') != 0) //capture the set command only
            return;
        //args=args.replace('\\','');
        let js = JSON.parse(args.substring(args.indexOf('{'), args.lastIndexOf('}') + 1));
        let arr = args.split(',');
        //console.log(arr);
        let command = arr[0];
        let key = arr[1];
        let mode = '';
        let timeout = 0;
        if (arr[arr.length - 1].indexOf('}') < 0) {
            mode = arr[arr.length - 2];
            timeout = arr[arr.length - 1]
        }
        //let clients = this.wss.clients;
        if (command == "set") {
            this.wss.clients.forEach((ws) => {
                const element = ws;
                //console.log(element);
                if (this._current_system + "_client_" + element['gui'] == key) {
                    console.log('client-changed');
                    let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                    element.send((JSON.stringify(b)), {
                        binary: true
                    });
                }
                if (this._current_system + "_error_" + element['gui'] == key) {
                    console.log('error-changed');
                    let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                    element.send((JSON.stringify(b)), {
                        binary: true
                    });
                    var l = {
                        log: JSON.stringify(js),
                        logdate: this.convertTZ(new Date()),
                        type: "error",
                        gui: uuidV4()
                    };
                    this.errorLogging(l);
                }
                if (element['client'] !== undefined) {
                    if (this._current_system + "_login_" + element['client'].logintoken == key) {
                        console.log('login-changed');
                        let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                        element.send((JSON.stringify(b)), {
                            binary: true
                        });
                    }
                    if (this._current_system + "_usergui_" + element['client'].logintoken == key) {

                        console.log('gui-changed');
                        if (this._system_prefix.indexOf(element['client'].prefix) > -1) {
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });
                        }


                    }

                    if (this._current_system + "_message_" + element['client'].logintoken == key) {

                        console.log('message-changed');
                        if (this._system_prefix.indexOf(element['client'].prefix) > -1) {
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });
                        }
                    }
                    if (this._current_system + "_notification_" + element['client'].logintoken == key) {

                        console.log('notification-changed');
                        if (this._system_prefix.indexOf(element['client'].prefix) > -1) {
                            let b = Buffer.from(JSON.stringify(element['client'])).toString('base64');
                            element.send((JSON.stringify(b)), {
                                binary: true
                            });
                        }
                    }
                }

            });
        }


    }
    constructor() {

        this._current_system = 'ice-maker';





        this._usermanager_host = 'http://nonav.net:6688';
        // this._usermanager_ws = 'ws://nonav.net:6688';
        this._usermanager_ws = 'ws://localhost:6688';

        this.nano = Nano('http://admin:admin@localhost:5984');

        this.r_client = redis.createClient();


        this.config();

        this.initWebsocket();
        this.r_client.monitor((err: any, res: any): any => {
            console.log("Entering monitoring mode.");
        })
        this.r_client.on('monitor', this.monitor_redis.bind(this));

        this.passValidator = new passwordValidator();
        this.passValidator.is().min(6) // Minimum length 8 
            .is().max(100) // Maximum length 100 
            //.has().uppercase()                              // Must have uppercase letters 
            .has().lowercase() // Must have lowercase letters 
            .has().digits() // Must have digits 
            .has().not().spaces()


        this.userValidator = new passwordValidator();
        this.userValidator.is().min(3)
            .is().max(12)
            .has().digits()
            .has().lowercase()
            .has().not().spaces();
        this.phoneValidator = new passwordValidator();
        this.phoneValidator.is().min(9)
            .has().digits()
            .has().not().spaces();



        this.initDB();
    }

    initDB() {
        this.init_db('gij', this.__design_gij);
        this.init_db('usergij', this.__design_usergij);
        this.init_db('gijpocket', this.__design_gijpocket);
        this.init_db('gijpayment', this.__design_gijpayment);
        this.init_db('gijserviceprovider', this.__design_serviceprovider);
        this.init_db('gijpackage', this.__design_package);
        this.init_db('gijcustomer', this.__design_customer);
        //init_db('users', __design_users);
    }

    init_db(dbname, design) {
        // create a new database
        let db;
        let parent = this;
        async.eachSeries([
            db = parent.create_db(dbname),
            db = this.nano.use(dbname),
            db.insert(design, (err, res) => {
                if (err) {
                    db.get('_design/objectList', (err, res) => {
                        if (err) console.log('could not find design ' + err.message);
                        else {
                            if (res) {
                                var d = res;
                                //console.log("d:"+JSON.stringify(d));
                                db.destroy('_design/objectList', d._rev, (err, res) => {
                                    if (err) console.log(err);
                                    else {
                                        //console.log(res);
                                        db.insert(design, "_design/objectList", (err, res) => {
                                            if (err) console.log('err insert new design ' + dbname);
                                            else {
                                                //console.log('insert design completed ' + dbname);
                                            }
                                        });
                                    }
                                });
                            } else {
                                // console.log("could not find design");
                            }
                        }
                    });
                } else {
                    //console.log('created design ' + dbname);
                }

            })
        ], (err) => {
            console.log('exist ' + dbname);
        });
        //db = nano.use(dbname);
        //return db;
    }

    init_redis() {
        this.r_client.flushdb((err, succeeded) => {
            console.log(succeeded); // will be true if successfull
        });
    }

    create_db(dbname) {
        let db;
        this.nano.db.create(dbname, (err, body) => {
            // specify the database we are going to use    
            if (!err) {
                console.log('database ' + dbname + ' created!');
            } else
                console.log(dbname + " could not be created!");
        });
        db = this.nano.use(dbname);
        return db;
    };




    // const bodyParser = require('body-parser');
    // var methodOverride = require('method-override');
    // app.use(bodyParser.json());
    // app.use(methodOverride());
    // app.use(cors());
    // app.use(errorHandler);
    __design_view = "objectList";

    convertTZ(fromTZ) {
        return moment.tz(fromTZ, "Asia/Vientiane").toDate();
    }
    errorLogging(log) {
        var db = this.create_db("errorlogs");
        console.log(log);
        db.insert(log, log.gui, (err, body) => {
            if (err) console.log(err);
            else {
                console.log("log oK ");
            }
        });
    }
    errorHandler(err, req, res, next) {
        console.log(err);
        var l = {
            log: err,
            logdate: this.convertTZ(new Date()),
            type: "error",
            gui: uuidV4()
        };
        this.errorLogging(l);
        if (res.headersSent) {
            return next(err);
        }
        res.status(500);
        res.render('error', {
            error: err
        });
    }


    // private _usermanager_host:string= 'http://localhost:6688';

    // r_client.monitor((err, res) =>{
    //     console.log("Entering monitoring mode.");
    // });
    // r_client.on("monitor", (time, args, raw_reply) =>{
    //     //console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
    //     args = args.toString();
    //     if (args.indexOf('set') != 0) //capture the set command only
    //         return;
    //     //args=args.replace('\\','');
    //     let js = JSON.parse(args.substring(args.indexOf('{'), args.lastIndexOf('}') + 1));
    //     let arr = args.split(',');
    //     //console.log(arr);
    //     let command = arr[0];
    //     let key = arr[1];
    //     let mode = '';
    //     let timout = 0;
    //     if (arr[arr.length - 1].indexOf('}') < 0) {
    //         mode = arr[arr.length - 2];
    //         timeout = arr[arr.length - 1]
    //     }
    //     let clients = wss.clients;
    //     if (command == "set")
    //         wss.clients.forEach(each(ws) {
    //             const element = ws;
    //             //console.log(element);
    //             if(this._current_system + "_client_" + element.gui == key) {
    //         console.log('client-changed');
    //         element.send(Buffer.from(JSON.stringify(js.client)), {
    //             binary: true
    //         });
    //     }
    //     if (this._current_system + "_error_" + element.gui == key) {
    //         console.log('error-changed');
    //         element.send(Buffer.from(JSON.stringify(js.client)), {
    //             binary: true
    //         });
    //         var l = {
    //             log: JSON.stringify(js),
    //             logdate: this.convertTZ(new Date()),
    //             type: "error",
    //             gui: uuidV4()
    //         };
    //         errorLogging(l);
    //     }
    //     if (element['client'] !== undefined) {
    //         if (this._current_system + "_login_" + element.client.logintoken == key) {
    //             console.log('login-changed');
    //             element.send(Buffer.from(JSON.stringify(js.client)), {
    //                 binary: true
    //             });
    //         }
    //         if (this._current_system + "_usergui_" + element.client.logintoken == key) {

    //             console.log('gui-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //         if (this._current_system + "_forgot_" + element.client.logintoken == key) {

    //             console.log('forgot-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //         if (this._current_system + "_phone_" + element.client.logintoken == key) {

    //             console.log('phone-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //         if (this._current_system + "_secret_" + element.client.logintoken == key) {

    //             console.log('secret-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //         if (this._current_system + "_message_" + element.client.logintoken == key) {

    //             console.log('message-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //         if (this._current_system + "_notification_" + element.client.logintoken == key) {

    //             console.log('notification-changed');
    //             if (_system_prefix.indexOf(element.client.prefix) > -1)
    //                 element.send(Buffer.from(JSON.stringify(js.client)), {
    //                     binary: true
    //                 });
    //         }
    //     }
    // });
    // });

    setPhoneStatus(client, secret) {
        this.r_client.set(this._current_system + '_phone_' + client.gui, JSON.stringify({
            command: 'phone-changed',
            secret: secret
        }), 'EX', 60 * 3);
    }

    setUserGUIStatus(client, gui) {
        this.r_client.set(this._current_system + '_usergui_' + client.logintoken, JSON.stringify({
            command: 'usergui-changed',
            gui: gui
        }), 'EX', 60 * 5);
    }

    setLoginStatus(client) {
        this.r_client.set(this._current_system + '_login_' + client.logintoken, JSON.stringify({
            command: 'login-changed',
            client: client
        }), 'EX', 60 * 5);
    }


    setClientStatus(client) {
        this.r_client.set(this._current_system + '_client_' + client.gui, JSON.stringify({
            command: 'client-changed',
            client: client
        }), 'EX', 60 * 5);
    }

    setOnlineStatus(client) {
        try {
            let parent = this;
            this.r_client.get('_online_' + client.username, (err, res) => {
                if (err) {
                    client.data.message = err;
                    parent.setErrorStatus(client);
                } else {
                    let arr = [{
                        logintoken: client.logintoken,
                        loginip: client.loginip,
                        clientip: client.clientip,
                        gui: client.gui
                    }];
                    if (res) {
                        res = JSON.parse(res);
                        if (res['client'].login !== undefined) {
                            // res.client.login.push(arr[0]);
                            // arr=res.login;
                            let exist = false;
                            for (let index = 0; index < res['client'].login.length; index++) {
                                const element = res['client'].login[index];
                                if (element.gui === client.gui && element.clientip === client.clientip && element.loginip === client.loginip) {
                                    exist = true;
                                    console.log('exist');
                                    break;
                                }
                            }
                            if (!exist) {
                                arr = res['client'].login.concat(arr);
                            }
                        }
                    }
                    this.r_client.set('_online_' + client.username, JSON.stringify({
                        command: 'online-changed',
                        client: {
                            username: client.username,
                            onlinetime: this.convertTZ(new Date()),
                            system: this._current_system,
                            login: arr,
                        }
                    }), 'EX', 60 * 5);
                }
            });
        } catch (error) {
            console.log(error);
            client.data.message = error;
            this.setErrorStatus(client);
        }
    }

    setErrorStatus(client) {
        this.r_client.set(this._current_system + '_error_' + client.logintoken, JSON.stringify({
            command: 'error-changed',
            client: client
        }), 'EX', 60 * 5);
    }

    setNotificationStatus(client) {
        this.r_client.set(this._current_system + '_notification_' + client.logintoken, JSON.stringify({
            command: 'notification-changed',
            client: client
        }), 'EX', 60 * 5); // client side could not see this , the other server as a client can see this .
    }

    LTCserviceSMS(c) {
        let client: any;
        try {
            client = JSON.parse(JSON.stringify(c));
            client.data.command = 'send-sms'
            client.prefix = 'gij';
            let ws_client = new WebSocket('ws://nonav.net:8081/'); //ltcservice
            ws_client.binaryType = 'arraybuffer';
            let parent = this;
            ws_client.on('open', () => {
                let b = Buffer.from(JSON.stringify(client)).toString('base64');
                //console.log(b);
                let a = Buffer.from(b);
                ws_client.send(JSON.stringify(b), { binary: true }, (err) => {
                    if (err) {
                        client.data.message = err;
                        client.data.sms.content = '';
                        parent.setErrorStatus(client);
                    }
                    console.log('socket open...');

                });
            });

            ws_client.on('message', (data) => {
                console.log("RECIEVED  FROM SMS : ");
                let b = parent.ab2str(data); let s = Buffer.from(b, 'base64').toString(); client = JSON.parse(s);
                //console.log(client);
                client.data.sms.content = '';
                client.data['notification'] = 'SMS has been sent out';
                client.prefix = '';

                parent.setNotificationStatus(client);
                //setOnlineStatus(client);

            });
            ws_client.on("error", (err) => {
                client.data.message = err;
                parent.setErrorStatus(client);
            });
        } catch (error) {
            client.data.message = error;
            this.setErrorStatus(client);
        }

    }

    commandReader(js) {
        const deferred = Q.defer();
        // const isValid=validateTopup(js.client);
        // if(!isValid.length)
        this.getUserInfoByLoginToken(js).then(res => {
            if (res) {
                switch (js.client.data.command) {
                    case 'register-gij':
                        this.register_gij_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'sum-gij':
                        this.sum_gij_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-gij':
                        this.check_gij_ws(js).then(res => {
                            deferred.resolve(res);
                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'check-pocket':
                        this.check_pocket_ws(js).then(res => {
                            deferred.resolve(res);

                        }).catch(err => {
                            deferred.reject(err);
                        });
                        break;
                    case 'transfer-gij':
                        this.transfer_gij_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);

                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'get-payment-list':
                        this.get_payment_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    // case 'topup-gij-request':
                    //     topup_gij_ws(js).then(res => {
                    //         deferred.resolve(res);
                    //         //console.log(res);

                    //     }).catch(err => {
                    //         //console.log(err);
                    //         deferred.reject(err);
                    //     });
                    //     break;
                    // case 'list-topup-gij-request':
                    //     list_topup_gij_ws(js).then(res => {
                    //         deferred.resolve(res);
                    //         //console.log(res);

                    //     }).catch(err => {
                    //         //console.log(err);
                    //         deferred.reject(err);
                    //     });
                    //     break;
                    
                    case 'check-gij-stock': // ADMiN ONLY
                        this.check_gij_stock_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);

                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'import-gij-stock': // ADMiN ONLY
                        this.import_gij_stock_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);

                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'generate-gij-stock': // ADMiN ONLY
                    this.generate_gij_stock_ws(js).then(res => {
                        deferred.resolve(res);
                        //console.log(res);

                    }).catch(err => {
                        //console.log(err);
                        deferred.reject(err);
                    });
                        break;
                    case 'topup-gij': // ADMiN ONLY
                        this.topup_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);

                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'approve-topup-gij-request': // ADMiN ONLY
                        this.approve_topup_gij_ws(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'approve-list-topup-gij-request': // ADMiN ONLY
                        this.approve_list_topup_gij_request(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    // case 'system-prefix':
                    //     deferred.resolve(get_system_prefix());
                    // break;
                    case 'pay-gijservice':
                        this.pay_gijservice(js).then(res => { // pay for service such as : topup
                            deferred.resolve(res);
                            //console.log(res);
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    case 'get-gijpackage':
                        this.getGijPackages(js).then(res => {
                            deferred.resolve(res);
                            //console.log(res);
                        }).catch(err => {
                            //console.log(err);
                            deferred.reject(err);
                        });
                        break;
                    default:
                        break;
                }
            } else {
                js.client.data.message = new Error('ERROR not found the key');
                deferred.reject(js);
            }
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    getUserInfoByLoginToken(js) {
        let deferred = Q.defer();
        let client: any;
        try {
            client = js.client;
            client.data.command = 'get-user-gui';
            client.prefix = 'gij';
            let ws_client = new WebSocket('ws://nonav.net:6688/'); // user-management
            ws_client.binaryType = 'arraybuffer';
            let parent = this;
            ws_client.on('open', () => {
                let b = Buffer.from(JSON.stringify(client)).toString('base64');
                //console.log(b);
                let a = Buffer.from(b);
                ws_client.send(JSON.stringify(b), { binary: true }, (err) => {
                    if (err) {
                        this.setErrorStatus(client);
                        deferred.reject(err);
                    }
                });
            });

            ws_client.on('message', (data) => {
                let b = parent.ab2str(data); let s = Buffer.from(b, 'base64').toString(); client = JSON.parse(s);
                delete data['prefix'];
                //delete data.res.SendSMSResult.user_id;
                //js.client=data;
                parent.setUserGUIStatus(client, data['data'].user.gui);
                if (data['data'].user.gui) {
                    data['data'].command = js.client.data.command;
                    js.client = data;
                    deferred.resolve(js);
                } else {
                    deferred.reject(new Error('Error user not login'))
                }

            });
            ws_client.on("error", (err) => {
                //js.client.data.message=err;
                this.setErrorStatus(client);
                deferred.reject(err);

            });
        } catch (error) {
            console.log(error);
            //js.client.data.message=error;
            this.setErrorStatus(client);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    register_gij_ws(js) {
        let deferred = Q.defer();
        let parent = this;
        try {
            this.findGijPocketByGUI(js.client.data.auth.gui).then(res => {
                if (res) {
                    js.client.data.message = new Error('Error pocket exist');
                    deferred.reject(js);
                } else {
                    let db = this.create_db('gijpocket');
                    const p = {
                        gui: uuidV4(),
                        usergui: js.client.data.auth.gui,
                        createddate: this.convertTZ(new Date()),
                        totalvalue: 0,
                        totalspent: 0,
                    };
                    db.insert(p, p.gui, (err, res) => {
                        if (err) {
                            js.client.data.message = err;
                            deferred.reject(js);
                        } else {
                            js.client.data.message = 'OK register';
                            parent.filterObject(js.client.data);
                            deferred.resolve(js);
                        }
                    });
                }
            }).catch(err => {
                js.client.data.message = err;
                deferred.reject(js);
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }

        return deferred.promise;
    }

    findGijPocketByGUI(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijpocket');
        db.view(this.__design_view, 'findByPocketGUI', {
            key: gui + '',
            limit: 1,
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                if (res.rows.length) {
                    deferred.resolve(res.rows[0].doc);
                } else {
                    deferred.reject('');
                }
            }
        });
        return deferred.promise;
    }

    getPocketByUserGUI(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijpocket');
        db.view(this.__design_view, 'findByUserGUI', {
            key: gui + '',
            limit: 1,
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                if (res.rows.length) {
                    deferred.resolve(res.rows[0].doc);
                } else {
                    deferred.reject('');
                }
            }
        });
        return deferred.promise;
    }

    check_pocket_ws(js) {
        let deferred = Q.defer();
        try {
            this.getPocketByUserGUI(js.client.data.auth.gui).then(res => {
                if (res) {
                    js.client.data.message = 'OK'
                    js.client.data.gijpocket = res;
                    this.filterObject(js.client.data);
                    deferred.resolve(js);
                } else {
                    js.client.data.message = new Error('Error no pocket');
                    deferred.reject(js);
                }
            }).catch(err => {
                js.client.data.message = err;
                deferred.reject(js);
            });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }

        return deferred.promise;
    }

    check_exist_pocket(gui) {
        let deferred = Q.defer();
        this.findGijPocketByGUI(gui).then(res => {
            let arr = [];
            for (let index = 0; index < res['rows'].length; index++) {
                const element = res['rows'][index].doc;
                arr.push(element);
            }
            deferred.resolve({ arr: arr });
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    getCountGij(pgui) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        try {
            db.view(this.__design_view, 'countByPocketGUI', {
                key: pgui + ''
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    if (res.rows.length) {
                        deferred.resolve(res.rows[0].doc);
                    } else {
                        deferred.reject(new Error('ERROR no gij found'));
                    }
                }
            });
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    getGijList(pgui, page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        try {
            this.getCountGij(pgui).then(res => {
                let count = res;
                if (!maxpage || maxpage === undefined || maxpage > 100)
                    maxpage = 10;
                if (!page || page === undefined)
                    page = 1;
                db.view(this.__design_view, 'findByPocketGUI', {
                    key: pgui + '',
                    limit: maxpage,
                    skip: page,
                    descending: true,
                    include_docs: true
                }, (err, res) => {
                    if (err) deferred.reject(err);
                    else {
                        let arr = [];
                        for (let index = 0; index < res.rows.length; index++) {
                            const element = res.rows[index].doc;
                            arr.push(element)
                        }
                        deferred.resolve({
                            arr: arr,
                            count: count
                        })
                    }
                });
            }).catch(err => {
                deferred.reject(err);
            });
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    check_gij_ws(js) {
        let deferred = Q.defer();
        try {
            this.check_exist_pocket(js.client.data.auth.gui).then(res => {
                if (res['arr'].length) {
                    let p = res[0];
                    this.getGijList(p.gijpocketgui, js.client.data.page, js.client.data.maxpage).then(g => {
                        js.client.data.gijs = g;
                        js.client.data.gijpocket = p;
                        this.filterObject(js.client.data);
                        deferred.resolve(js);
                    }).catch(err => {
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                } else {
                    js.client.data.message = new Error('ERROR pocket not found');
                    deferred.reject(js);
                }
            }).catch(err => {
                js.client.data.message = err;
                deferred.reject(js);
            });
        } catch (error) {
            js.client.data.message = error
            deferred.reject(js);
        }

        return deferred.promise;
    }

    getSumPocketFromGij(js) {
        let deferred = Q.defer();
        try {
            var usergij = {
                usergui: '',
                sn: '',
                gijgui: '',
                gijvalue: 0,
                usedtime: '',
                ref: [],
                gijpocketgui: '',
            }
            let db = this.create_db('usergij');
            db.view(this.__design_view, 'sumAllGij', {
                key: js.client.data.gijpocket.gui + '',
                include_docs: true
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    const sumAll = res.rows[0].doc;
                    db.view(this.__design_view, 'sumSpent', {
                        key: js.client.data.gijpocket.gui + '',
                        include_docs: true
                    }, (err, res) => {
                        if (err) deferred.reject(err);
                        else {
                            const sumSpent = res.rows[0].doc;
                            deferred.resolve({
                                total: sumAll,
                                spent: sumSpent
                            });
                        }
                    });
                }
            });
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    }

    updateUser(js) {
        let deferred = Q.defer();
        let client = js.client;
        client.prefix = 'gij';
        client.data.command = 'edit-profile';
        let ws_client = new WebSocket('ws://nonav.net:6688/'); // user-management
        ws_client.binaryType = 'arraybuffer';
        let parent = this;
        ws_client.on('open', () => {
            let b = Buffer.from(JSON.stringify(client)).toString('base64');
            //console.log(b);
            let a = Buffer.from(b);
            ws_client.send(JSON.stringify(b), { binary: true }, (err) => {
                if (err) {
                    parent.setErrorStatus(client);
                    deferred.reject(err);
                }

            });
        });
        ws_client.on('message', (data) => {
            let b = parent.ab2str(data); let s = Buffer.from(b, 'base64').toString(); client = JSON.parse(s);
            delete data['prefix'];
            //delete data.res.SendSMSResult.user_id;
            parent.setNotificationStatus(client);
            parent.setOnlineStatus(client);
            deferred.resolve(data);
        });
        ws_client.on("error", (err) => {
            parent.setErrorStatus(client);
            deferred.reject(err);
        });
        return deferred.promise;
    }

    updateGijPocket(gp) {
        let deferred = Q.defer();
        try {
            let db = this.create_db('gijpocket');
            console.log(gp);
            db.insert(gp, gp._id, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    deferred.resolve('OK ' + JSON.stringify(res));
                }
            });
        } catch (error) {
            deferred.reject(error)
        }

        return deferred.promise;
    }

    sum_gij_ws(js) {
        let deferred = Q.defer();
        try {
            this.check_exist_pocket(js.client.data.auth.gui).then(res => {
                if (res['arr'].length) {
                    let p = res[0];
                    js.client.data.gijpocket = p;
                    this.getSumPocketFromGij(js).then(sum => {
                        if (sum) {
                            this.findUserByGUI(js).then(res => {
                                js.client.data.message = 'OK gij sum';
                                res['totalgij'] = sum['sumAll'];
                                res['totalgijspent'] = sum['sumSpent'];
                                res['gijvalue'] = res['totalgij'] - res['totalgijspent'];

                                p.totalvalue = res['gijvalue'];
                                p.totalgij = res['totalgij'];
                                p.totalgijspent = res['totalgijspent'];

                                js.client.data.gijpocket = p;
                                js.client.data.user = res;
                                this.updateUser(js).then(res => {
                                    js.client.data.message = 'OK gij sum Ok update user';
                                    deferred.resolve(js);
                                    this.updateGijPocket(p).then(res => {
                                        js.client.data.message = 'OK gij sum Ok update user OK Update gijpocket';
                                        this.filterObject(js.client.data);
                                        deferred.resolve(js);
                                    }).catch(err => {
                                        js.client.data.message = err;
                                        deferred.reject(js);
                                    });
                                }).catch(err => {
                                    js.client.data.message = err;
                                    deferred.reject(js);
                                });
                            }).catch(err => {
                                js.client.data.message = err;
                                deferred.reject(js);
                            });
                        } else {
                            js.client.data.message = 'ERROR could not sum gij';
                            deferred.reject(js);
                        }
                    }).catch(err => {
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                } else {
                    js.client.data.message = new Error('ERROR pocket not found');
                    deferred.reject(js);
                }
            }).catch(err => {
                js.client.data.message = err;
                deferred.reject(js);
            });
        } catch (error) {
            js.client.data.message = error
            deferred.reject(js);
        }
        return deferred.promise;
    }

    checkUserName() {

    }

    checkPhonenumber() {

    }

    updateGijServiceProvider(doc) {
        let deferred = Q.defer();
        let db = this.create_db('gijserviceprovider');
        if (!doc._rev) {
            doc.gui = uuidV4();
        }
        db.insert(doc, doc.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(res);
            }
        });
        return deferred.promise;
    }

    getGijServiceProviders(page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('gijserviceprovider');
        db.list({
            include_docs: true,
            limit: maxpage,
            skip: page
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index].doc;
                    arr.push(arr);
                }
                deferred.resolve({ arr: arr });
            }
        });
        return deferred.promise;
    }
    approve_list_topup_gij_request(js){
        let deferred = Q.defer();

        return deferred.promise;
    }
    approve_topup_gij_ws(js){
        let deferred = Q.defer();

        return deferred.promise;
    }
    topup_ws(js): any {       
        let deferred = Q.defer();

        return deferred.promise;
    }
    generate_gij_stock_ws(js){
        
        let deferred = Q.defer();

        return deferred.promise;
    }
    import_gij_stock_ws(js){
        let deferred = Q.defer();

        return deferred.promise;
    }
    countGijStock(){
        let deferred = Q.defer();
        let db=this.create_db('gij');
        db.view(this.__design_view,'countIsUsed',{key:true,include_docs:true},(err,res)=>{
            if(err){
                console.log(err);
                deferred.reject(err);
            }else{
                if(res){
                    let arr=[];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].value;
                        arr.push(element);
                    }
                    deferred.resolve(arr[0]);
                }
            }
        });

        return deferred.promise;

    }
    getAvailableGijStock(page,maxpage){
        
        let deferred = Q.defer();
        let db=this.create_db('gij');
        db.view(this.__design_view,'findIsUsed',{key:true,include_docs:true,limit:maxpage,skip:page},(err,res)=>{
            if(err){
                console.log(err);
                deferred.reject(err);
            }else{
                if(res){
                    let arr=[];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].doc;
                        arr.push(element);
                    }
                    deferred.resolve(arr);
                }
            }
        });

        return deferred.promise;
    }
    check_gij_stock_ws(js) {
        let deferred = Q.defer();
        this.countGijStock().then(res=>{
            let count=res;
            let page=js.client.data.page;
            let maxpage=js.client.data.maxpage;
            this.getAvailableGijStock(page,maxpage).then(res=>{
                deferred.resolve({count:count,arr:res});
            }).catch(err=>{
                console.log(err);
                deferred.reject(err);
            });
        }).catch(err=>{
            console.log(err);
            deferred.reject(err);
        });

        return deferred.promise;
    }

    getGijPackages(js) {
        let deferred = Q.defer();
        let db = this.create_db('gijpackage');
        db.list({
            include_docs: true,
            limit: js.client.data.maxpage,
            skip: js.client.data.page
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }

    getGijPackageByGui(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijpackage');
        db.view(this.__design_view, 'findByGUI', {
            key: gui,
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr[0]);
            }
        });
        return deferred.promise;
    }

    updateGijPackage(doc) {
        let deferred = Q.defer();
        let db = this.create_db('gijpackage');
        if (!doc._rev) {
            doc.gui = uuidV4();
        }
        db.insert(doc, doc.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(res);
            }
        });
        return deferred.promise;
    }

    getGijCustomers(page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('gijcustomer');
        db.list({
            include_docs: true,
            limit: maxpage,
            skip: page
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }

    getGijCustomerByUserGui(gui) {
        let deferred = Q.defer();
        let db = this.create_db('gijcustomer');
        db.view(this.__design_view, 'findByUserGUI', {
            key: gui,
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < arr.length; index++) {
                    const element = arr[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr[0]);
            }
        });
        return deferred.promise;
    }

    updateGijCustomer(doc) {
        let deferred = Q.defer();
        let db = this.create_db('gijcustomer');
        if (!doc._rev) {
            doc.gui = uuidV4();
        }
        db.insert(doc, doc.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(res);
            }
        });
        return deferred.promise;
    }

    deductGij(array, v, ref) {
        let sum = 0;
        let left = 0;
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            if (index * element.gijvalue <= v) {
                element.usedtime = this.convertTZ(new Date());
                element.ref.push(ref);
                sum += element.gijvalue
            } else {
                left += element.gijvalue;
            }

        }
        return sum + left - v;
    }

    pay_gijservice(js) {
        const deferred = Q.defer();
        const db = this.create_db('gijpayment');
        js.client.data.gijpayment.paymentype = 'pay-package';
        js.client.data.gijpayment.gui = uuidV4();
        js.client.data.gijpayment.usergui = js.client.data.auth.gui;
        js.client.data.gijpayment.sender = js.client.username;
        js.client.data.gijpayment.receiver = '@service-provider@';
        this.getGijPackageByGui(js.client.data.gijpayment.ref + '').then(res => {
            if (res) {
                this.getGijCustomerByUserGui(js.client.data.auth.gui).then(res => {
                    if (res) {
                    } else {
                        let c = {
                            gui: uuidV4(),
                            usergui: js.client.data.auth.gui,
                            currentpackage: [{
                                packagegui: res['gui'],
                                starttime: this.convertTZ(new Date()),
                                endtime: moment(new Date()).add(1, 'months').format(),
                                paymentgui: ''
                            }],
                            createddate: this.convertTZ(new Date()),
                            lastupdate: this.convertTZ(new Date()),
                            isactive: true,

                        };
                        this.updateGijCustomer(js);
                    }
                });
                let p = <servicepackage>res;
                if (Number.parseInt(p.packagevalue + '') === Number.parseInt(js.client.data.gijpayment.paymentvalue + '')) {
                    this.getPocketByUserGUI(js.client.data.auth.gui).then(res => {
                        let p_sender = <gijpocket>res;
                        this.findAvailableGij(p_sender.gui).then(res => {
                            if (res) {
                                let a_gij = res;
                                if (p_sender.totalvalue >= js.client.data.gijpayment.paymentvalue) {
                                    let left = this.deductGij(a_gij, js.client.data.gijpayment.paymentvalue, js.client.data.gijpayment.gui);
                                    left >= 0 ? p_sender.totalvalue = left : p_sender.totalvalue -= js.client.data.gijpayment.paymentvalue;
                                    p_sender.totalspent += js.client.data.gijpayment.paymentvalue;
                                    this.updateGijPayment(js.client.data.gijpayment).then(res => {
                                        this.updateUserGij(a_gij).then(res => {
                                            this.updateGijPocket(p_sender).then(res => {
                                                this.findUserByGUI(js).then(res => {
                                                    let u = <gijuser>res;
                                                    u.gijvalue = p_sender.totalvalue;
                                                    u.totalgijspent = p_sender.totalspent;
                                                    js.client.data.user = u;
                                                    this.updateUser(js).then(res => {

                                                        // filterObject(js.client);
                                                        // setNotificationStatus(js.client);
                                                        this.getGijServiceProviders(30, 0).then(res => {
                                                            let str = '';
                                                            let arr = res['arr'];
                                                            for (let index = 0; index < arr.length; index++) {
                                                                const element = res[index];
                                                                if (p.serviceprovider.indexOf(element.gui)) {
                                                                    str = `${element.servicename},${element.discount},
                                                                ${element.description}
                                                                `;
                                                                }
                                                            }
                                                            deferred.resolve(`OK pay service
                                                            ${p.packagename}, value: ${p.packagevalue},
                                                            (${p.description}),
                                                            ${str}`);
                                                        });
                                                    });
                                                });

                                            });
                                        });
                                    });
                                } else {
                                    throw new Error('ERROR insufficient value ');
                                }
                            } else {
                                throw new Error('Error no availalbe gij');
                            }
                        })
                        // let c_js=JSON.parse(JSON.stringify(js));
                        // c_js.client.data.user.username=js.client.data.gijpayment.receiver;
                        // findUserByUsername(c_js).then(res=>{
                        //     let receiver=res;
                        //     getPocketByUserGUI(receiver.gui).then(res=>{
                        //         let p_receiver=res;

                        //     }).catch(err=>{
                        //         js.client.data.message=err;
                        //         deferred.reject(js);
                        //     });
                        // }).catch(err=>{
                        //     js.client.data.message=err;
                        //     deferred.reject(js);
                        // });        
                    });
                } else {
                    throw new Error('ERROR please check package value');
                }

            } else {
                throw new Error('ERROR no package found');
            }
        }).catch(err => {
            js.client.data.message = err;
            deferred.reject(js);
        });

        return deferred.promise;
    }

    get_payment_ws(js) {
        let deferred = Q.defer();
        let db = this.create_db('gijpayment');
        try {
            db.view(this.__design_view, 'findPaymentTime', {
                key: {
                    year: js.client.data.paymentlist.year,
                    month: js.client.data.paymentlist.month,
                    date: js.client.data.paymentlist.date
                },
                descending: true,
                include_docs: true
            },
                (err, res) => {
                    if (err) {
                        js.client.data.message = err;
                        deferred.reject(js);
                    } else {
                        let arr = [];
                        for (let index = 0; index < res.rows.length; index++) {
                            const element = res.rows[index].doc;
                            this.filterObject(element);
                            arr.push(element);
                        }
                        deferred.resolve(arr);
                    }
                });
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }

        return deferred.promise;
    }

    check_payment_ws(js) {
        let deferred = Q.defer();

        return deferred.promise;
    }

    findUserByGUI(js) {
        let deferred = Q.defer();
        let client = js.client;
        client.prefix = 'gij';
        client.data.command = 'get-user-info';
        let ws_client = new WebSocket('ws://localhost:6688/'); // user-management
        ws_client.binaryType = 'arraybuffer';
        let parent = this;
        ws_client.on('open', () => {
            let b = Buffer.from(JSON.stringify(client)).toString('base64');
            //console.log(b);
            let a = Buffer.from(b);
            ws_client.send(JSON.stringify(b), { binary: true }, (err) => {
                if (err) {
                    this.setErrorStatus(client);
                    js.client.data.message = err;
                    deferred.reject(js);
                }
            });
        });
        ws_client.on('message', (data) => {
            let b = parent.ab2str(data); let s = Buffer.from(b, 'base64').toString(); client = JSON.parse(s);
            delete client.prefix;
            //delete data.res.SendSMSResult.user_id;
            parent.setNotificationStatus(client);
            parent.setOnlineStatus(client);
            js.client = client;
            deferred.resolve(js)
        });
        ws_client.on("error", (err) => {
            this.setErrorStatus(client);
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    findUserByUsername(js) {
        let deferred = Q.defer();
        let client = js.client;
        client.data.command = 'find-by-username';
        client.prefix = 'gij';
        let parent = this;
        let ws_client = new WebSocket(this._usermanager_host);
        ws_client.on('open', () => {
            let b = Buffer.from(JSON.stringify(client)).toString('base64');
            //console.log(b);
            let a = Buffer.from(b);
            ws_client.send(JSON.stringify(a), { binary: true }, (err) => {
                if (err) {
                    this.setErrorStatus(client);
                    js.client.data.message = err;
                    deferred.reject(js);
                }
            });
        });
        ws_client.on('message', (data) => {
            let b = parent.ab2str(data); let s = Buffer.from(b, 'base64').toString(); client = JSON.parse(s);
            delete data['prefix'];
            //delete data.res.SendSMSResult.user_id;
            parent.setNotificationStatus(client);
            parent.setOnlineStatus(client);
            js.client = client;
            deferred.resolve(js)
        });
        ws_client.on("error", (err) => {
            this.setErrorStatus(client);
            js.client.data.message = err;
            deferred.reject(js);
        });
        return deferred.promise;
    }

    countAvailableGij(pgui) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        db.view(this.__design_view, 'countAvailableGij', {
            key: pgui + '',
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr[0]);
            }
        });
        return deferred.promise;
    }

    findAvailableGij(pgui) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        db.view(this.__design_view, 'findAvailableGij', {
            key: pgui + '',
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].doc;
                    arr.push(arr);
                }
                deferred.resolve({ arr: arr });
            }
        });
        return deferred.promise;
    }

    getAvailableGij(pgui, page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        this.countAvailableGij(pgui).then(res => {
            let count = res;
            db.view(this.__design_view, 'findAvailableGij', {
                key: pgui + '',
                limit: maxpage,
                skip: page,
                include_docs: true
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    let arr = [];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].doc;
                        arr.push(arr);
                    }
                    deferred.resolve({
                        arr: arr,
                        count: count
                    });
                }
            });
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    countUsedGij(pgui) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        db.view(this.__design_view, 'countUsedGij', {
            key: pgui + '',
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr[0]);
            }
        });
        return deferred.promise;
    }

    findUsedGij(pgui) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        db.view(this.__design_view, 'findUsedGij', {
            key: pgui + '',
            include_docs: true
        }, (err, res) => {
            if (err) deferred.reject(err);
            else {
                let arr = [];
                for (let index = 0; index < res.rows.length; index++) {
                    const element = res.rows[index].doc;
                    arr.push(arr);
                }
                deferred.resolve(arr);
            }
        });
        return deferred.promise;
    }

    getUsedGij(pgui, page, maxpage) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        this.countUsedGij(pgui).then(res => {
            let count = res;
            db.view(this.__design_view, 'findUsedGij', {
                key: pgui + '',
                limit: maxpage,
                skip: page,
                include_docs: true
            }, (err, res) => {
                if (err) deferred.reject(err);
                else {
                    let arr = [];
                    for (let index = 0; index < res.rows.length; index++) {
                        const element = res.rows[index].doc;
                        arr.push(arr);
                    }
                    deferred.resolve({
                        arr: arr,
                        count: count
                    });
                }
            });
        }).catch(err => {
            deferred.reject(err);
        });
        return deferred.promise;
    }

    sumArray(arr, prop, isaverage?) {
        let sum = 0;
        try {
            for (let index = 0; index < arr.length; index++) {
                sum += Number.parseInt(arr[index][prop] + '');
            }
        } catch (error) {
            throw error;
        }
        return isaverage || isaverage !== undefined ? sum / arr.length : sum;
    }

    updateUserGij(g) {
        let deferred = Q.defer();
        let db = this.create_db('usergij');
        if (g._rev)
            g.gui = uuidV4();
        db.insert(g, g.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(res);
            }
        });
        return deferred.promise;
    }

    updateGijPayment(t) {
        let deferred = Q.defer();
        let db = this.create_db('gijpayment');
        if (!t._rev)
            t.gui = uuidV4();
        db.insert(t, t.gui, (err, res) => {
            if (err) deferred.reject(err);
            else {
                deferred.resolve('OK');
            }
        });
        return deferred.promise;
    }

    transfer_gij_ws(js) {
        let deferred = Q.defer();
        let sendGij = js.client.data.payment.sendingvalue;
        let receiveGij = js.client.data.payment.receivingvalue;
        js.client.data.payment.transactiontime = this.convertTZ(new Date());
        js.client.data.payment.gui = uuidV4();
        js.client.data.payment.sender = js.client.username;
        //js.client.data.gijtransaction.ref=
        let parent = this;
        try {
            if (sendGij == receiveGij) {
                let c_js = JSON.parse(JSON.stringify(js));
                this.findUserByGUI(c_js).then(res => {
                    let sender = <gijuser>res;
                    c_js.client.data.user = {};
                    c_js.client.data.user.username = js.client.data.payment.receiver;
                    this.findUserByUsername(c_js).then(res => {
                        if (res) {
                            let reciver = res;
                            this.getPocketByUserGUI(sender.gui).then(res => {
                                if (res) {
                                    let senderpocket = <gijpocket>res;
                                    this.getPocketByUserGUI(sender.gui).then(res => {
                                        if (res) {
                                            let recieverpocket = <gijpocket>res;
                                            this.findAvailableGij(senderpocket.gui).then(res => {
                                                let s_a_gij = res['arr'] as usergij[];
                                                this.findUsedGij(recieverpocket.gui).then(res => {
                                                    let s_u_gij = res;
                                                    this.findAvailableGij(recieverpocket.gui).then(res => {
                                                        let r_a_gij = <usergij>res['arr'];
                                                        this.findUsedGij(recieverpocket.gui).then(res => {
                                                            let r_u_gij = <gijuser>res;
                                                            // check gij and pocket  for both  sender and receiver
                                                            //check usued
                                                            //check available
                                                            const rsumu = parent.sumArray(r_u_gij, 'gijvalue');
                                                            const rsuma = parent.sumArray(r_a_gij, 'gijvalue');
                                                            const ssumu = parent.sumArray(s_a_gij, 'gijvalue');
                                                            const ssuma = parent.sumArray(s_u_gij, 'gijvalue');
                                                            // check with gij pocket
                                                            if (recieverpocket.totalgij === (rsuma + rsumu)) {
                                                                if (recieverpocket.totalspent <= rsumu) {
                                                                    if (recieverpocket.totalvalue <= rsuma) {
                                                                        if (senderpocket.totalgij === (ssuma + ssumu)) {
                                                                            if (senderpocket.totalspent <= ssumu) {
                                                                                if (senderpocket.totalvalue <= ssuma) {
                                                                                    // move gij from sender to reciever
                                                                                    let gijpayment = {
                                                                                        gui: uuidV4(),
                                                                                        usergui: js.client.data.auth.gui,
                                                                                        paymenttime: this.convertTZ(new Date()),
                                                                                        paymentvalue: Number.parseInt(js.client.data.payment.sendGij + ''),
                                                                                        ref: uuidV4(),
                                                                                        sender: js.client.data.payment.sender,
                                                                                        receiver: js.client.data.payment.receiver,
                                                                                        paymentype: 'transfer',
                                                                                        sendingvalue: Number.parseInt(js.client.data.payment.sendingvalue + ''),
                                                                                        receivingvalue: Number.parseInt(js.client.data.payment.receivingvalue + ''),
                                                                                    }
                                                                                    if (sendGij < ssuma) {
                                                                                        let aver = ssumu / s_a_gij.length;
                                                                                        if (sendGij / aver < 1) {
                                                                                            js.client.data.message = new Error('ERROR the value is lower than individual gij');
                                                                                            deferred.reject(js);
                                                                                        } else {
                                                                                            this.updateGijPayment(gijpayment).then(res => {
                                                                                                // transfer gijs from current user to target user and sum all 
                                                                                                for (let index = 0; index < s_a_gij.length; index++) {
                                                                                                    const element = s_a_gij[index];
                                                                                                    if (element.gijvalue * index <= sendGij) {
                                                                                                        //element.usedtime=this.convertTZ(new Date());
                                                                                                        element.usergui = recieverpocket.usergui;
                                                                                                        element.gijpocketgui = recieverpocket.gui;
                                                                                                        if (Array.isArray(element.owners)) {
                                                                                                            element.owners.push(recieverpocket.usergui);
                                                                                                        }

                                                                                                        if (Array.isArray(element.ref)) {
                                                                                                            element.ref.push('transfer');
                                                                                                        }

                                                                                                        element.ref.push(gijpayment.gui);
                                                                                                    } else
                                                                                                        break;
                                                                                                }
                                                                                                this.updateUserGij(s_a_gij).then(res => {
                                                                                                    // update gij pocket  
                                                                                                    recieverpocket.totalgij += sendGij
                                                                                                    recieverpocket.totalvalue += sendGij;
                                                                                                    recieverpocket.sumgij + sendGij;
                                                                                                    this.updateGijPocket(recieverpocket).then(res => {
                                                                                                        //updateUserGij(s_a_gij).then(res=>{                                                                                                
                                                                                                        senderpocket.totalgij -= sendGij;
                                                                                                        senderpocket.totalspent += sendGij;
                                                                                                        //senderpocket.sumgij+=send;
                                                                                                        this.updateGijPocket(senderpocket).then(res => {
                                                                                                            js.client.data.message = 'OK transfered :' + sendGij;
                                                                                                            deferred.resolve(js);
                                                                                                        }).catch(err => {
                                                                                                            js.client.data.message = err;
                                                                                                            deferred.reject(js);
                                                                                                        });
                                                                                                    }).catch(err => {
                                                                                                        js.client.data.message = err;
                                                                                                        deferred.reject(js);
                                                                                                    });
                                                                                                }).catch(err => {
                                                                                                    js.client.data.message = err;
                                                                                                    deferred.reject(js);
                                                                                                });
                                                                                            }).catch(err => {
                                                                                                js.client.data.message = err;
                                                                                                deferred.reject(js);
                                                                                            });
                                                                                        }
                                                                                    } else {
                                                                                        js.client.data.message = new Error('ERROR unsufficience fund');
                                                                                        deferred.reject(js);
                                                                                    }

                                                                                } else {
                                                                                    js.client.data.message = new Error('Error sender has wrong  gij value');
                                                                                    deferred.reject(js);
                                                                                }
                                                                            } else {
                                                                                js.client.data.message = new Error('Error sender has wrong spent gij value');
                                                                                deferred.reject(js);
                                                                            }
                                                                        } else {
                                                                            js.client.data.message = new Error('Error sender has wrong total gij value');
                                                                            deferred.reject(js);
                                                                        }
                                                                    } else {
                                                                        js.client.data.message = new Error('Error receiver has wrong gij value');
                                                                        deferred.reject(js);
                                                                    }
                                                                } else {
                                                                    js.client.data.message = new Error('Error receiver has wrong spent gij value');
                                                                    deferred.reject(js);
                                                                }
                                                            } else {
                                                                js.client.data.message = new Error('Error receiver has wrong total gij value');
                                                                deferred.reject(js);
                                                            }
                                                        }).catch(err => {
                                                            js.client.data.message = err;
                                                            deferred.reject(js);
                                                        });
                                                    }).catch(err => {
                                                        js.client.data.message = err;
                                                        deferred.reject(js);
                                                    });
                                                }).catch(err => {
                                                    js.client.data.message = err;
                                                    deferred.reject(js);
                                                });
                                            }).catch(err => {
                                                js.client.data.message = err;
                                                deferred.reject(js);
                                            });
                                        } else {
                                            js.client.data.message = new Error('ERROR has no pocket');
                                            deferred.reject(js);
                                        }
                                    }).catch(err => {
                                        js.client.data.message = err;
                                        deferred.reject(js);
                                    });
                                } else {
                                    js.client.data.message = new Error('ERROR has no pocket');
                                    deferred.reject(js);
                                }
                            }).catch(err => {
                                js.client.data.message = err;
                                deferred.reject(js);
                            });
                        } else {
                            js.client.data.message = new Error('ERROR target user not found');
                            deferred.reject(js);
                        }
                    }).catch(err => {
                        js.client.data.message = err;
                        deferred.reject(js);
                    });
                }).catch(err => {
                    js.client.data.message = err;
                    deferred.reject(js);
                });
            }
        } catch (error) {
            js.client.data.message = error;
            deferred.reject(js);
        }
        return deferred.promise;
    }


    submit_topup_gij_request(js) {
        let deferred = Q.defer();

        return deferred.promise;
    }

    list_topup_gij_request(js) {
        let deferred = Q.defer();

        return deferred.promise;
    }

    update_topup_gij_request(js) {
        let deferred = Q.defer();

        return deferred.promise;
    }

    filterObject(obj) {
        var need = ['gui', '_rev', '_id', 'password', 'oldphone', 'system', 'parents', 'roles', 'isActive'];
        //console.log(key);
        for (var i in obj) {
            //if(i==='password')
            //console.log(obj[i]);
            for (let x = 0; x < need.length; x++) {
                let key = need[x];
                if (!obj.hasOwnProperty(i)) { } else if (Array.isArray(obj[i])) {
                    if (i.toLowerCase().indexOf(key) > -1)
                        obj[i] = [];
                } else if (typeof obj[i] === 'object') {
                    this.filterObject(obj[i]);
                } else if (i.indexOf(key) > -1) {
                    obj[i] = '';
                }
            }
        }
        return obj;
    }

    ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }

    str2ab(str) {
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    heartbeat() {
        // if (!this['lastupdate'] && !this['gui']) {
        //     console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " logout");
        //     this.isAlive = false;
        // }
        // let startDate = moment(this.lastupdate)
        // let endDate = moment(this.convertTZ(new Date()));

        // const timeout = endDate.diff(startDate, 'seconds');
        // // if(this.gui!=this.gui){
        // //     this.isAlive=false;
        // //     console.log('HEART BEAT:'+this.gui+" is alive:"+this.isAlive+" "+this.lastupdate+" timeout"+timeout);
        // //     return;
        // // }
        // if (timeout > 60 * 3)
        //     this.isAlive = false;
        // else
        //     this.isAlive = true;

        // console.log('HEART BEAT:' + this.gui + " is alive:" + this.isAlive + " " + this.lastupdate + " timeout" + timeout);
        // //this.send(this.client);
    }
    // set 60 seconds 
    // server.listen(8888, "0.0.0.0", () {
    //     console.log('Example app listening on port 8888!')
    // });
}
export default new App().server;