import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilepics");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("NewTube backend is running!");
});

// Signup Route with File Upload
app.post("/api/signup", upload.single("profilePic"), async (req, res) => {
  const { name, email, password } = req.body;
  const profilePic = req.file ? `${req.file.filename}` : "";

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      photo: profilePic,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      profilePic: `${req.protocol}://${req.get("host")}${profilePic}`,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user._id,
      profilePic: user.photo,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Sign-In
app.post("/api/google-login", async (req, res) => {
  const { email, name, photo } = req.body;
  if (!email || !name || !photo) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email, name, photo });

    console.log("User found/created:", user);

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Google sign-in successful", token, userId: user._id });
  } catch (error) {
    console.error("Error in Google login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const cleanToken = token.replace("Bearer ", "");
    const verified = jwt.verify(cleanToken, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// Get Logged-in User Route
app.get("/api/user", authenticate, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Password Reset Route
app.post("/api/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ message: "Email and new password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/:id/subscribe", async (req, res) => {
  try {
    const { id } = req.params; // The creator's ID (channel owner)
    const { userId } = req.body; // The user who is subscribing
    if (id === userId) {
      return res
        .status(400)
        .json({ error: "You cannot subscribe to your own channel." });
    }
    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find creator and user
    const creator = await User.findById(id);
    const user = await User.findById(userId);

    if (!creator || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already subscribed
    const isSubscribed = user.subscribedTo.includes(id);

    if (isSubscribed) {
      // Unsubscribe
      user.subscribedTo = user.subscribedTo.filter(
        (sub) => sub.toString() !== id
      );
      creator.subscribers = Math.max(0, creator.subscribers - 1);
      await user.save();
      await creator.save();
      return res.json({
        message: "Unsubscribed successfully",
        subscribers: creator.subscribers,
      });
    } else {
      // Subscribe
      user.subscribedTo.push(id);
      creator.subscribers += 1;
      await user.save();
      await creator.save();
      return res.json({
        message: "Subscribed successfully",
        subscribers: creator.subscribers,
      });
    }
  } catch (error) {
    console.error("Error subscribing:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/:userId/isSubscribed/:uploaderId", async (req, res) => {
  try {
    const { userId, uploaderId } = req.params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(uploaderId)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is subscribed to the uploader
    const isSubscribed = user.subscribedTo.includes(uploaderId);

    res.json({ isSubscribed });
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId); // or however you fetch user
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users/:userId/subscriptions", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await User.findById(userId).populate(
      "subscribedTo",
      "name photo"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Build full URL for each subscribed channel's photo
    const subscriptionsWithFullPhoto = user.subscribedTo.map((sub) => ({
      _id: sub._id,
      name: sub.name,
      photo: sub.photo.startsWith("http")
        ? sub.photo // if already full URL (like Google photo), use as is
        : `${req.protocol}://${req.get("host")}/uploads/profilepics/${
            sub.photo
          }`,
    }));

    res.json(subscriptionsWithFullPhoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Video upload route
app.use("/api", videoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
