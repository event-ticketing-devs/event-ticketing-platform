import express from "express";
import {
  getProfile,
  updateUser,
  deleteSelf,
  adminDeleteUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch("/update", protect, updateUser);
router.delete("/delete", protect, deleteSelf);
router.delete("/:id", protect, adminOnly, adminDeleteUser);

export default router;
