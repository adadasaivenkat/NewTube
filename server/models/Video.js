import mongoose from "mongoose";

const categories = [
  "All",
  "Music",
  "Gaming",
  "News",
  "Live",
  "Comedy",
  "Sports",
  "Technology",
  "Entertainment",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
  "Beauty",
];

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: [1, "Title cannot be empty"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    minlength: [1, "Description cannot be empty"],
  },
  filename: {
    type: String,
    required: [true, "Filename is required"],
  },
  thumbnail: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    default: "All",
    required: true,
    validate: {
      validator: (value) => categories.includes(value) || value === "Other",
      message: "Invalid category",
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Uploader ID is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

videoSchema.index({ title: "text", description: "text" });

export default mongoose.models.Video || mongoose.model("Video", videoSchema);
