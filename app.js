var express = require("express");

var app = express();

require("./config/database");
require("./middlewares/index.middleware")(app, express);

module.exports = app;