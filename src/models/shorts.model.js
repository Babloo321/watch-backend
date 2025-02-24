import mongoose, { Schema } from 'mongoose'

const shortsSchema = new Schema({
  videoFile:{
    type:String,
    required:true
  },
  thumbnail:{
    type:String,
    required:false
  },
  videoFileId:{
    type:String,
  },
  thumbnail:{
    type:String
  },
  owner:{
    type:new mongoose.Types.ObjectId(),
    ref:"User"
  }
})

const Short = mongoose.model("Short",shortsSchema);
export default Short;