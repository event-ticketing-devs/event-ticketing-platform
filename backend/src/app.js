import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// import testRouter from "./routes/test.routes.js";

// app.use("/api/test", testRouter);

app.get("/", (req, res) => res.send("hello, world"));

app.use(notFound);
app.use(errorHandler);

export { app };
