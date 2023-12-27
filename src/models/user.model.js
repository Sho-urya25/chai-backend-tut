import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String, ///cloudinary service
      required: true,
    },
    coverImage: {
      type: String, ///cloudinary service
      required: true,
    },
    watchHistory: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Video",
        },
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

//! this code is used  to encript the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified()) return next();
  this.password = bcrypt.hash(this.password, 10);
  next();
});
//! this code is used to check the password if ists correct or not
userSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compare(password, this.password); //? return true or false
};

userSchema.methods.generateAccessToken = async function () {
  return  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.refreshAccessToken = async function () {
  return  jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.RFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
