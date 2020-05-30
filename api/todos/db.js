const sqlite3 = require('sqlite3').verbose();
const path = require('path')
const dateUtils = require('../../utils/date')
let db = new sqlite3.Database(path.join(__dirname, './db.db'), (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the db.');
});

function getUser(username, password) {
  return new Promise((resolve, reject) => {

    db.get(`SELECT * from user WHERE name = ?`, [username], function (err, data) {
      if (err) {
        return console.log(err.message);
      }
      resolve(data);
    });
    // resolve(1);
  });
}

function getUserData(user) {
  return new Promise(resolve => {
    db.all(`SELECT * from task where userid = ?`, [user.id], function (err, data) {
      console.log(err, data, user.id);
      resolve(data);
    });
  });
}

function doTask(userid, taskid) {
  let now = dateUtils.nowFullString()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * from task where userid = ? and id = ? and deleted = 0`, [userid, taskid], function (err, data) {
      // console.log(data);
      if (data.repeat) {
        console.log("data.repeat true")
        db.get(`REPLACE INTO dotask(taskid, date, donetime) VALUES(?, ?, ?)`, [taskid, now.substr(0, 8), now], function (err, data) {
          getTasks(userid).then(data => resolve(data))
        });
      } else {
        console.log("data.repeat false")
        db.run(`REPLACE INTO dotask(taskid, date, donetime) VALUES(?, ?, ?)`, [taskid, '0', now], function (err) {
          getTasks(userid).then(data => resolve(data))
        });
      }
    });
  });
}

function deleteTodo(userid, data) {
  let values = [data.id];
  return new Promise((resolve, reject) => {
    db.run(`update task set deleted = 1 where id = ?`, values, function (err, data) {
      console.log(err)
      getTasks(userid).then(data => resolve(data))
    });
  });
}

function updateTodo(userid, data) {
  console.log(data)
  let values = [data.id];
  let updates = [];
  for (let k in data) {
    if (k != 'id' && ["name"].indexOf(k) > -1) {
      updates.push("`" + k + "` = ? ");
      values.unshift(data[k]);
    }
  }
  return new Promise((resolve, reject) => {
    db.run(`update task set ${updates.join(',')} where id = ?`, values, function (err, data) {
      console.log(err)
      getTasks(userid).then(data => resolve(data))
    });
  });
}

function undoTask(userid, data) {
  console.log(data)
  return new Promise((resolve, reject) => {
    db.run(`DELETE from dotask where date = ? and taskid = ?`, [data.date, data.taskid], function (err, data) {
      console.log(err)
      getTasksDone(userid).then(data => resolve(data))
    });
  });
}

function getTasks(userid, data) {
  let _resolve;
  data = data || {};
  let now = dateUtils.nowDateString()
  let from = data.from || now;
  let to = data.to || now;
  console.log('getTasks', from, to)
  // let query = `SELECT task.* from task 
  // left join dotask
  // on task.id = dotask.taskid
  // where userid = ? and ifnull(repeat, '') = '' and donetime is NULL and \`to\` >= ? and \`from\` <= ?
  // UNION
  // SELECT * from task where userid = ? and ifnull(repeat, '') <> '' and id not in
  // (SELECT taskid from dotask where donetime is not NULL and date = ? and taskid in 
  // (SELECT id from task where  userid = ? and ifnull(repeat, '') <> ''))
  // `;
  // let values =  [userid, from, to, userid, now, userid];
  let query = `SELECT name, id, \`from\`, \`to\`, createddatetime, repeat from task 
    where userid = ? and deleted = 0 and 
    (
      (ifnull(repeat, '') = '' and \`to\` >= ? and \`from\` <= ?)
        or
      (ifnull(repeat, '') <> '' and substr(createddatetime, 0, 9) <= ?)
    )
    `;
  let values = [userid, from, to, to];
  db.all(query, values, function (err, todos) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    // resolve(data);
    getTasksDone(userid, data).then(todosdone => {
      _resolve({ todos, todosdone })
    })
  });
  return new Promise(resolve => _resolve = resolve);
}

// function getCalendar(userid, data) {
//   let _resolve;
//   console.log("getCalendar", data)
//   getTasks(userid, data).then(todos => {
//     getTasksDone(userid, data).then(todosdone => {
//       _resolve({ todos, todosdone })
//     })
//   })
//   return new Promise(resolve => _resolve = resolve);
// }

function getTasksDone(userid, data) {
  let now = dateUtils.nowDateString()
  let from = data.from || now;
  let to = data.to || now;
  console.log("getTasksDone", from, to)
  return new Promise(resolve => {
    db.all(`SELECT name, id, \`from\`, \`to\`, repeat, donetime, date from task 
    left join dotask
    on task.id = dotask.taskid
    where userid = ? and deleted = 0 and (
      (ifnull(repeat, '') <> '' and substr(donetime, 0, 9) >= ? and substr(donetime, 0, 9) <= ?)
      or
      (ifnull(repeat, '') = '' and donetime is not null and \`to\` >= ? and \`from\` <= ?)
    )

    `, [userid, from, to, from, to], function (err, data) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      resolve(data);
    });
  });
}

function addTask(userid, data) {
  let _resolve;
  let now = dateUtils.nowFullString()
  let names = 'userid, createddatetime';
  let values = '?,?';
  let valueArr = [userid, now];
  for (let k in data) {
    names += ",'" + k + "'";
    values += ",?";
    valueArr.push(data[k])
  }
  db.run(`INSERT INTO task (${names}) VALUES (${values})`, valueArr, function (err) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    getTasks(userid).then(data => _resolve(data));
  });
  return new Promise(resolve => _resolve = resolve);
}


module.exports = {
  addTask,
  getTasks,
  getUser,
  getUserData,
  getTasksDone,
  updateTodo,
  undoTask,
  deleteTodo,
  // getCalendar,
  doTask
}