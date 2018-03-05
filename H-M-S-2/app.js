var db = require("./database/db.js");
var login = require('./controllers/routes');
var nurse = require('./controllers/nurseRoute');
var doctor = require('./controllers/doctorRoute');
var admin = require('./controllers/adminRoute');
var laboratorist = require('./controllers/laboratoristRoute');
var pharmacist = require('./controllers/pharmacistRoute');
var bodyParser = require('body-parser');
var session = require('express-session');
var express = require('express');
var moment = require('moment');
var helmet = require('helmet');
var bcrypt = require('bcryptjs');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var app = express();





app.locals.moment = require('moment');
app.set('view engine', 'ejs');
app.use(helmet.noCache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static('./public'));
app.use(session({secret: 'shhhhh', cookie: { maxAge: 3600000 }}));

// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});



//PARA sa DASHBOARD of all MODULES!!!
var name   = "SELECT name,account_type FROM user_accounts where account_id = ?;";
var counts = "SELECT (SELECT count(patient_id) From patient p inner join activity_logs a USING(patient_id) where a.type = 'initialAssessment') as OPD, "
            +"(SELECT count(patient_id) From patient p inner join activity_logs a USING(patient_id) where a.type = 'bed') as WARD,"
            +"(SELECT count(name) pCount FROM patient) as totalRegisteredPatients,"
            +"(SELECT count(patient_id) admitted FROM bed) as currentlyAdmitted;";
var chart  = "SELECT  (SELECT count(patient_id) from patient where patient_type = 'cadet') as cadet,"
            +"(SELECT count(patient_id) from patient where patient_type = 'military officer') as military_officer,"
            +"(SELECT count(patient_id) from patient where patient_type = 'military dependent') as military_dependent,"
            +"(SELECT count(patient_id) from patient where patient_type = 'civilian') as civilian,"
            +"(SELECT count(patient_id) from patient where patient_type = 'authorized civilian') as authorized_civilian;";
//COUNT
var whoOPD               = "SELECT p.name, a.time From patient p inner join activity_logs a USING(patient_id) where a.type = 'initialAssessment';";
var whoWARD              = "SELECT p.name, a.time From patient p inner join activity_logs a USING(patient_id) where a.type = 'bed';";
var whoCurrentlyAdmitted = "SELECT p.name, a.patient_id, a.bed_id FROM bed a INNER JOIN patient p USING(patient_id);";
// GRAPH
var monthlyPatientCount  = 'SELECT (SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-01-01 00:00:00" and "'+currentTime+'-02-01 00:00:00" and type = "add") as JAN,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-02-01 00:00:00" and "'+currentTime+'-03-01 00:00:00" and type = "add") as FEB,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-03-01 00:00:00" and "'+currentTime+'-04-01 00:00:00" and type = "add") as MARCH,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-04-01 00:00:00" and "'+currentTime+'-05-01 00:00:00" and type = "add") as APRIL,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-05-01 00:00:00" and "'+currentTime+'-06-01 00:00:00" and type = "add") as MAY,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-06-01 00:00:00" and "'+currentTime+'-07-01 00:00:00" and type = "add") as JUNE,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-07-01 00:00:00" and "'+currentTime+'-08-01 00:00:00" and type = "add") as JULY,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-08-01 00:00:00" and "'+currentTime+'-09-01 00:00:00" and type = "add") as AUGUST,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-09-01 00:00:00" and "'+currentTime+'-010-01 00:00:00" and type = "add") as SEPTEMBER,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-010-01 00:00:00" and "'+currentTime+'-011-01 00:00:00" and type = "add") as OCTOBER,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-011-01 00:00:00" and "'+currentTime+'-012-01 00:00:00" and type = "add") as NOVEMBER,'
                          +'(SELECT count(logs_id) from activity_logs WHERE time BETWEEN "'+currentTime+'-012-01 00:00:00" and "'+currentTime+'-001-01 00:00:00" and type = "add") as DECEMBER;';
//TO DO LIST
//OTHERS
var patientList          = "SELECT * from patient;";
var doctorList           = "SELECT * FROM user_accounts WHERE account_type = 'doctor';";
var availableBeds        = "SELECT b.bed_id, p.patient_type, p.name, b.status, b.allotment_timestamp from bed b LEFT JOIN patient p USING(patient_id) where b.status = 'Unoccupied';";

var currentTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
login (app,db,currentTime);
nurse (app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList,doctorList);
doctor(app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList,availableBeds);
admin (app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList,availableBeds,bcrypt);
pharmacist(app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList);
laboratorist(app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList);



//FOR AGE INCREMENT
var CronJob = require('cron').CronJob;
new CronJob('00 14 13 * * 1-7', function() {
  console.log('ano na !');
    var checkBD = 'SELECT patient_id, birth_date from patient';
    db.query(checkBD, function(err, rows){
      var resultDB = JSON.parse(JSON.stringify(rows));
      for (var i in resultDB) {
        if (moment(new Date()).format('MM-DD') == moment(resultDB[i].birth_date).format('MM-DD')) {
          db.query('UPDATE patient SET birth_date="'+ resultDB[i].birth_date+1 +'"where patient_id ='+resultDB[i].patient_id+';', function(err){
            if (err) {
              console.log(err);
            } else {
              console.log('gumagana');
            }
          });
        }
      }
    });
}, null, true);

// var CronJob = require('cron').CronJob;
// new CronJob('00 00 12 * * 1-7', function() {
//
//   },
//   null,
//   true
// );

//port
app.listen(3000);
console.log('hello !!');
