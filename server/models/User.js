import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photo: {
    type: String,
    default: "/uploads/profilepics/default_image.png",
    required: true,
  },
  password: { type: String },
  subscribers: { type: Number, default: 0 }, // Store how many people subscribed
  subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Store subscribed creators
});

const User = model("User", UserSchema);
export default User;
