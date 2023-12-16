import dotenv from "dotenv";
import connectDB from "./db/connect.js";

dotenv.config({
    path: "./env"
});

const port = process.env.PORT || 3000 

const start = async ()=>{
    try {
        await connectDB()
        app.on('error',(err)=>{
            console.log("ERROR: ",err)
        })
        app.listen(port,()=>{
            console.log(`server is connected to port: ${port}`)
        })
    } catch (error) {
       console.log("Some error is occured ",error) 
    }
}

start()