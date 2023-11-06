import mongoose from 'mongoose'

const connectDb=(uri)=>{
    // mongoose.set('strictQuery', true);  This is for valiadtion 
    return mongoose.connect(uri)
}

export default connectDb