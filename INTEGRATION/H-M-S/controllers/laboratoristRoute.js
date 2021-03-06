module.exports = function(app,db,currentTime,name,counts,chart,whoCurrentlyAdmitted,whoOPD,whoWARD,monthlyPatientCount,patientList,io){
var user, Aid;

  app.get('/laboratorist/dashboard', function(req, res){
    if(req.session.email && req.session.sino == 'laboratorist'){
      if(req.session.sino == 'laboratorist'){
        Aid = req.session.Aid;
        var diagnosisSQL      = 'SELECT * from lab_request where lab_status="pending";';
        var bloodChemistrySQL = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "bloodChemistry";';
        var hermatology       = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "hermatology";';
        var microscopy        = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "microscopy";';
        var parasitology      = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "parasitology";';
        var serology          = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "serotology";';
        var microbiology      = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "microbiology";';
        var xRay              = 'SELECT * from lab_request l inner join patient using(patient_id) where l.type = "xRay";';
        var todoList          = "SELECT * from todo_list where account_id = "+Aid+";";
        db.query(todoList + diagnosisSQL + bloodChemistrySQL + hermatology + microscopy + parasitology + serology + microbiology + xRay + monthlyPatientCount + name, Aid, function(err, rows){
          if (err) {
            console.log(err);
          } else {
            user = rows[10];
            res.render('laboratorist/dashboard', {todoList:rows[0],diagnosisSQL:rows[1],bloodChemistrySQL:rows[2],hermatology:rows[3],microscopy:rows[4],parasitology:rows[5],
                                                  serology:rows[6],microbiology:rows[7],xRay:rows[8],monthlyPatientCount:rows[9], username: user});
          }
        });
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
        res.redirect('../login');
    }
  });

  app.post('/laboratorist/dashboard', function(req, res){
    var data = req.body;
    if (req.session.email && req.session.sino == 'laboratorist') {
      if (req.session.sino == 'laboratorist') {
        if (data.sub == 'addTodo') {
          var splitDateNTime = data.dateNtime.split('T');
          var parseDate      = splitDateNTime[0];
          var parseTime      = splitDateNTime[1] + ':00';
          var parseDateNTime = parseDate+' '+parseTime;

          var addTodo  = 'INSERT into todo_list (description, date, account_id) VALUES("'+data.description+'","'+parseDateNTime+'",'+Aid+');';
          db.query(addTodo + 'INSERT into activity_logs(account_id, time, type, remarks) VALUES ('+Aid+',"'+currentTime+'", "todo", "Added to To Do List the following: '+data.description+'");', function(err){
            if (err) {
              console.log(err);
            }
          });
          res.redirect(req.get('referer'));
        }
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
      res.redirect('../login');
    }
  });

  //LAB REQUEST
  app.get('/laboratorist/labRequestManagement', function(req, res){
    if(req.session.email && req.session.sino == 'laboratorist'){
      if(req.session.sino == 'laboratorist'){
          var pendingLabRequestSQL = 'SELECT * from lab_request l inner join patient using(patient_id) where lab_status = "pending" ORDER BY timestamp desc;';
          var confirmedLabRequestSQL = 'SELECT * from lab_request l inner join patient using(patient_id) where lab_status = "confirmed" ORDER BY timestamp desc;';

          db.query(pendingLabRequestSQL + confirmedLabRequestSQL, function(err, rows){
            if (err) {
              console.log(err);
            } else {
              res.render('laboratorist/labRequestManagement', {pendingLabRequestSQL:rows[0],confirmedLabRequestSQL:rows[1], username: user});
            }
          });
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
        res.redirect('../login');
    }
  });
  app.post('/laboratorist/labRequestManagement', function(req, res){
    var data = req.body;
    if(req.session.email && req.session.sino == 'laboratorist'){
      if(req.session.sino == 'laboratorist') {
        if (data == 'confirm') {
          var confirmLabRequestSQL = 'UPDATE lab_request SET lab_status="confirmed" where request_id = '+req.query.requestId+' ORDER BY timestamp desc;';
          db.query(confirmLabRequestSQL + 'INSERT into activity_logs(account_id, time, type, remarks) VALUES ('+Aid+',"'+currentTime+'", "confirmedLabRequest", "Confirmed lab request for: '+req.query.labrequestPatientName+'");', function(err){
            if(err){
              console.log(err);
            } else {
              io.emit('type', {what:'confirmedLabRequest',message:'Confirmed Lab Request for <strong>'+req.query.labrequestPatientName+'</strong>'});
              res.redirect(req.get('referer'));
            }
          });
        } else {
          var cancelLabRequestSQL = 'DELETE FROM lab_request where request_id = '+req.query.requestId+';';
          db.query(cancelLabRequestSQL + 'INSERT into activity_logs(account_id, time, type, remarks) VALUES ('+Aid+',"'+currentTime+'", "cancelLabRequest", "Cancelled lab request for: '+req.query.labrequestPatientName+'");', function(err){
            if(err){
              console.log(err);
            } else {
              io.emit('type', {what:'cancelLabRequest',message:'Cancelled Lab Request for <strong>'+req.query.labrequestPatientName+'</strong>'});
              res.redirect(req.get('referer'));
            }
          });
        }
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
      res.redirect('../login');
    }
  });
  // PROFILE MANAGEMENT
  app.get('/laboratorist/profileManagement', function(req, res){
    if(req.session.email && req.session.sino == 'laboratorist'){
      if (req.session.sino == 'laboratorist') {
        var profileInfoSQL  = 'SELECT * from user_accounts where account_id = '+req.session.Aid+';';
        var activityLogsSQL = 'SELECT * from activity_logs where account_id = '+req.session.Aid+' ORDER by logs_id desc;';
        db.query(profileInfoSQL + activityLogsSQL, function(err, rows){
          if (err) {
            console.log(err);
          } else {
            res.render('laboratorist/profileManagement', {pInfo:rows[0], activityInfo: rows[1], username: user});
          }
        });
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
      res.redirect('../login')
    }
  });

  app.post('/laboratorist/profileManagement', function(req, res){
    var data = req.body;
    if (req.session.email && req.session.sino == 'laboratorist') {
      if (req.session.sino == 'laboratorist') {
        var updateProfileSQL = 'UPDATE user_accounts SET name = "'+data.name+'", age = '+data.age+', address = "'+data.address+'", phone = '+data.phone+' WHERE account_id = '+req.session.Aid+';';
        db.query(updateProfileSQL + 'INSERT into activity_logs(account_id, time, type, remarks) VALUES ('+Aid+',"'+currentTime+'", "settingsProfileManagement", "Edited personal info.");', function(err, rows){
          if (err) {
            console.log(err);
          } else {
            res.redirect(req.get('referer'));
          }
        });
      } else {
        res.redirect(req.session.sino+'/dashboard');
      }
    } else {
      res.redirect('../login');
    }
  });

  //PATIENT MANAGEMENT
  app.get('/laboratorist/patientManagement', function(req, res){
      if(req.session.email && req.session.sino == 'laboratorist'){
        if(req.session.sino == 'laboratorist'){
          var sql  = "SELECT patient_id,patient_type,name,age,sex,blood_type FROM patient";
          db.query(sql, function(err, rows){
            res.render('laboratorist/patientManagement', {p:rows, username:user});
          });
        } else {
          res.redirect(req.session.sino+'/dashboard');
        }
      } else {
          res.redirect('../login');
      }
    });


}
