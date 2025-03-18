// require('dotenv').config({path:'./.env'});
import dotenv from "dotenv";
dotenv.config({path:'./.env'});
// import connectDB from "./db/configDb.js";
import connectDB from "./db/config.Db.js";
import app from "./app.js";

connectDB()     // it reuturns a promise
.then(()=>{
  app.listen(process.env.PORT || 5050,()=>{
    console.log(`Server running on port ${process.env.PORT}`);
  })
  // app.on("error", (err)=>{
  //   console.log(`Server connecting error: ${err}`);
  // })
})
.catch((err)=>{
  console.log(`Mongodb Connecting error: ${err}`);
})