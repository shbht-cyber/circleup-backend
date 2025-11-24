const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const app = express();

mongoose
  .connect(process.env.MONGODB_CONNECTION_URL)
  .then(() => console.log("database connected!"))
  .catch((err) => console.log("db cant be connected, Error:", err));

app.listen(process.env.PORT || 3001, () => {
  console.log("backend server is started at port", process.env.PORT);
});
