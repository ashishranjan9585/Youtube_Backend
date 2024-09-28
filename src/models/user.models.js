import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
         username :{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            index : true
         },
         email :{
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
             },
        fullname : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String, //cloudinary url
            required : true
        },
        coverImage : {
            type : String, //cloudinary url
        },
        watchHistory : [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password : {
            type : String,
            required : [true , "Password is required"]
        },
        refreshToken : {
             type : String
        }
},{timestamps : true});

userSchema.pre("save", async function(next) { //save se phle password ko encrypt krdo
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
//create custom methods to check password correct or not
  
userSchema.methods.isPasswordCorrect = async function(password){
     //check password by using bcrypt
    return  await bcrypt.compare(password, this.password);
    }

//JWT 
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,{
             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
        )
}

userSchema.methods.generateReferenceToken = function(){
    return jwt.sign(
        {
            _id: this._id,
         },
        process.env.REFRESH_TOKEN_SECRET,{
             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
        )
}

export const User = mongoose.model("User" , userSchema);

//mongoose -> middleware->  one method is (pre) -> that call one after another for example - i want to encrypt the password after going to another 