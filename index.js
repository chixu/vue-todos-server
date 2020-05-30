const express = require("express");
const apiTodos = require('./api/todos')
var cookieParser = require('cookie-parser')
// var session = require('express-session');
var cors = require('cors')
const app = express();
app.use(cookieParser())

const PORT = process.env.PORT || 5000;

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(cors())
app.listen(PORT, () => console.log(`server started on port ${PORT}`));

app.use('/api/todos', apiTodos);