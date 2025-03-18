import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
  {
  userName:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true    // if you want to make it optimized searchable
  },
  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },
  fullName:{
    type:String,
    required:true,
    trim:true,
    index:true
  },
  avatar:{
    type:String,    // cloudnary url
    required:true
  },
  coverImage:{type:String},
  watchHistory:[
    {
      type:Schema.Types.ObjectId,
      ref:"Video"
    }
  ],
  password:{
    type:String,
    required:[true,"Password is required"],
  },
  refreshToken:{type:String},
  avatarId:{type:String,required:true},
  coverImageId:{type:String},

}, {timestamps:true},

)


userSchema.pre("save",async function(next){
  if(!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password,salt);
})



userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
      {
          _id: this._id,
          email: this.email,
          username: this.username,
          fullName: this.fullName,
          avatar: this.avatar,
          coverImage: this.coverImage
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
  )
}
userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
      {
          _id: this._id,
          
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRTY
      }
  )
}
// create own method in mongoose useing current schema
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
}
const User = mongoose.model("User", userSchema);

export default User;