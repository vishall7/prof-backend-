import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONOGO_URI}/${DB_NAME}`);
        console.log(`\n Database Connected !! DB_HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB Connection FAILED",error);
        process.exit(1);
    }
}

export default connectDB;