import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try{
    const connectionIntense =  await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      console.log(`MongoDB Connected...!! DB HOST : ${connectionIntense.connection.host}`);
    }catch(error){
        console.log("MONGODB connection Failed" ,error)
        process.exit(1);
    }
}

export default connectDB