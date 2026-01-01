import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import venueReportRoutes from "./routes/venueReportRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import teamChatRoutes from "./routes/teamChatRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import venueOptionRoutes from "./routes/venueOptionRoutes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/venue-reports", venueReportRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/team-chat", teamChatRoutes);
app.use("/api", venueRoutes);
app.use("/api/venue-options", venueOptionRoutes);

app.get("/", (req, res) => res.send("hello, world"));

app.use(notFound);
app.use(errorHandler);

export { app };
