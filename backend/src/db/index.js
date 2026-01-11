import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
      {
        family: 4, // Force IPv4 to avoid Docker IPv6 DNS issues
        retryWrites: true,
        w: "majority",
      }
    );
    console.log(
      `\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection failed!", error);
    process.exit(1);
  }
};

export default connectDB;
