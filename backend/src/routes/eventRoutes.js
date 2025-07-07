import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
} from "../controllers/eventController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createEvent); // Only logged-in organizers
router.get("/", getAllEvents); // Public
router.get("/:id", getEventById); // Public

export default router;
