const express = require('express');
const router = express.Router();
const db = require('./db.js');
const { v4: uuidv4 } = require('uuid');
const users = {}
// router.get('/', (req, res) => {
//   res.send('todos root');
// });

function checkSignIn(req, res, next) {
  console.log("checkSignIn", req.body.token);
  if (req.body.token && users[req.body.token]) {
    console.log("logined");
    next();
  } else {
    sendError(res, "Not Logined")
  }
}

router.post('/addtodo', checkSignIn, (req, res) => {
  // console.log(req.body);
  let user = users[req.body.token];
  db.addTask(user.id, req.body.data).then(data => sendData(res, data));
});

router.post('/dotask', checkSignIn, (req, res) => {
  console.log("dotask", req.body)
  let user = users[req.body.token];
  let taskid = req.body.data.id
  db.doTask(user.id, taskid).then(data => sendData(res, data));
});

router.post('/updatetodo', checkSignIn, (req, res) => {
  let user = users[req.body.token];
  let taskData = req.body.data
  db.updateTodo(user.id, taskData).then(data => sendData(res, data));
});

router.post('/deletetodo', checkSignIn, (req, res) => {
  let user = users[req.body.token];
  let data = req.body.data
  db.deleteTodo(user.id, data).then(data => sendData(res, data));
});

router.post('/undotask', checkSignIn, (req, res) => {
  console.log("undotask", req.body)
  let user = users[req.body.token];
  let taskData = req.body.data
  db.undoTask(user.id, taskData).then(data => sendData(res, data));
});


router.post('/gettodos', checkSignIn, (req, res) => {
  let user = users[req.body.token];
  let data = req.body.data;
  db.getTasks(user.id, data).then(data => sendData(res, data));
});

router.post('/getcalendar', checkSignIn, (req, res) => {
  let user = users[req.body.token];
  let data = req.body.data;
  db.getTasks(user.id, data).then(data => sendData(res, data));
});

router.post('/gettodosdone', checkSignIn, (req, res) => {
  let user = users[req.body.token];
  let data = req.body.data || {};
  db.getTasksDone(user.id, data).then(data => sendData(res, data));
});

router.post('/logout', checkSignIn, (req, res) => {
  delete users[req.body.token];
  sendData(res, 1)
});

router.post('/login', (req, res) => {
  if (req.body.token && users[req.body.token]) {
    sendData(res, users[req.body.token])
  } else {
    let data = req.body.data;
    if (!data.username || !data.password) {
      sendError(res, "Please enter both id and password");
    } else {
      db.getUser(data.username, data.password).then(user => {
        // req.session.user = user
        let token = uuidv4();
        user.token = token;
        users[token] = user;
        sendData(res, user)
      }).catch(() => {
        sendError(res, "Invalid credentials!")
      })
    }
  }
});

router.get('/count', function (req, res) {
  console.log(req.cookies);
  console.log(req.session);
  res.cookie("userid", '1234')
  // if (req.session.page_views) {
  //   req.session.page_views++;
  //   res.send("You visited this page " + req.session.page_views + " times");
  // } else {
  //   req.session.page_views = 1;
  //   res.send("Welcome to this page for the first time!");
  // }
  res.send("Welcome to this page for the first time!");
});

router.post('/connect', function (req, res) {
  if (req.body.token && users[req.body.token]) {
    sendData(res, users[req.body.token])
  } else
    sendError(res, "logout");
});

function sendData(res, data) {
  res.send({ data });
}

function sendError(res, error) {
  res.send({ err: error });
}

module.exports = router;

// function init(app) {
//   app.get('/todos/gettodos', (req, res) => {
//     // let id = req.params.id;
//     res.send("gettodos");
//   });
// }

// module.exports = init;
