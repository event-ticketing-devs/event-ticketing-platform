import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
