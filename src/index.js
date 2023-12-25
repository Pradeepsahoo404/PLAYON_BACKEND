import connectDB from "./db/database.js";
// require('dotenv').config();
import dotenv from 'dotenv';

dotenv.config({
    path : './env'
})

connectDB()