import connectDB from "./db/database.js";
import app from "./app.js"
// require('dotenv').config();
import dotenv from 'dotenv';

dotenv.config({
    path : './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    app.on("error" ,(error)=>{
        console.log("error" ,error)
        throw error
    })
})
.catch((err)=>{
    console.log("MONGO DB connection failed" ,err)
})