
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { configure } from "jwt-smith"

import userRouters from "./routes/user";
import authRouters from "./routes/auth";

dotenv.config({ path: path.join(__dirname, "..", ".env.development") });

const PORT = parseInt(process.env.APP_PORT || '3000', 10);
const HOST = process.env.APP_HOST || 'localhost';

// Create Express server
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

configure({
  signOptions: {
    algorithm: 'HS256'
  }
})

app.use("/user", userRouters);
app.use("/auth", authRouters);
/* Routes END */

/* Server start */
const server = app.listen(PORT, HOST);

server.on("listening", (error: unknown): void => {
  if (error) console.error("*** Server start failed! *** ", error);
  else console.info(`\n/------------/\nServer start running on http://${HOST}:${PORT}\n/------------/\n`);
});

server.on("error", (error: unknown): void => console.error("*** Server failing! *** ", error));