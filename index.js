const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");

dotenv.config();

const app = express();
app.use(cookieParser());

mongoose
  .connect(process.env.MONGODB_CONNECTION_URL)
  .then(() => console.log("database connected!"))
  .catch((err) => console.log("db cant be connected, Error:", err));

//middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);

app.listen(process.env.PORT || 3001, () => {
  console.log("backend server is started at port", process.env.PORT);
});
