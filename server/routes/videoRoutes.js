import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Video from "../models/Video.js";
import ffmpeg from "fluent-ffmpeg";
import mongoose from "mongoose";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get("/videos", async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const matchStage = {};

    if (category && category !== "All") {
      matchStage.category = category;
    }

    if (search) {
      matchStage.$text = { $search: search };
    }

    let sortStage = { createdAt: -1 };
    if (sort === "popular") {
      sortStage = { views: -1 };
    }

    let videos = await Video.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "uploaderId",
          foreignField: "_id",
          as: "uploader",
        },
      },
      { $unwind: "$uploader" },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          filename: 1,
          thumbnail: 1,
          views: 1,
          createdAt: 1,
          uploaderId: 1,
          "uploader.name": 1,
          "uploader.photo": 1,
          likes: 1,
          comments: 1,
          dislikes: 1,
        },
      },
      { $sort: sortStage },
    ]);

    // Function to get video duration
    const getVideoDuration = (videoPath) => {
      return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err || !metadata.format || !metadata.format.duration) {
            console.error("Error fetching duration:", err);
            return resolve("0:00"); // Default duration
          }

          let totalSeconds = Math.round(metadata.format.duration);
          let hours = Math.floor(totalSeconds / 3600);
          let minutes = Math.floor((totalSeconds % 3600) / 60);
          let seconds = totalSeconds % 60;

          let durationString =
            hours > 0
              ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                  .toString()
                  .padStart(2, "0")}`
              : `${minutes}:${seconds.toString().padStart(2, "0")}`;

          resolve(durationString);
        });
      });
    };

    // Attach duration to each video using Promise.all()
    videos = await Promise.all(
      videos.map(async (video) => {
        const videoPath = path.join(__dirname, "../uploads", video.filename);

        // Check if file exists
        if (!fs.existsSync(videoPath)) {
          console.error("File not found:", videoPath);
          video.duration = "0:00"; // Default if file doesn't exist
        } else {
          console.log("Processing video:", videoPath);
          video.duration = await getVideoDuration(videoPath);
        }

        return video;
      })
    );

    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch videos", details: error.message });
  }
});

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
const uploadDir = path.join(process.cwd(), "uploads");
const thumbnailDir = path.join(uploadDir, "thumbnails");
const videoDir = path.join(uploadDir, "videos");

// Ensure directories exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(thumbnailDir))
  fs.mkdirSync(thumbnailDir, { recursive: true });
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, thumbnailDir);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, videoDir);
    } else {
      // Reject other file types or put in a fallback folder if you want
      cb(new Error("Unsupported file type"), null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB file size limit
});

// Upload video & thumbnail
router.post(
  "/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, category, uploaderId } = req.body;

      if (
        !title ||
        !description ||
        !req.files ||
        !req.files["video"] ||
        !uploaderId
      ) {
        console.error("Missing required fields");
        return res.status(400).json({
          error: "Title, description, video file, and uploaderId are required",
        });
      }

      const videoFilename = req.files["video"][0].filename;
      const thumbnailFilename = req.files["thumbnail"]
        ? req.files["thumbnail"][0].filename
        : null;
      const validCategory = categories.includes(category) ? category : "Other";

      const video = new Video({
        title,
        description,
        filename: videoFilename,
        thumbnail: thumbnailFilename,
        category: validCategory || "All",
        uploaderId,
      });

      const savedVideo = await video.save();
      res
        .status(201)
        .json({ message: "Video uploaded successfully", savedVideo });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  }
);

router.post("/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid video ID or user ID" });
    }

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Remove from dislikes if exists
    video.dislikes = video.dislikes.filter(
      (dislike) => dislike.toString() !== userId
    );

    const likeIndex = video.likes.indexOf(userId);
    if (likeIndex === -1) {
      video.likes.push(userId); // Add like
    } else {
      video.likes.splice(likeIndex, 1); // Remove like
    }

    await video.save();
    res.json({
      message: "Like updated",
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (error) {
    console.error("Error liking video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/dislike", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid video ID or user ID" });
    }

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    // Remove from likes if exists
    video.likes = video.likes.filter((like) => like.toString() !== userId);

    const dislikeIndex = video.dislikes.indexOf(userId);
    if (dislikeIndex === -1) {
      video.dislikes.push(userId); // Add dislike
    } else {
      video.dislikes.splice(dislikeIndex, 1); // Remove dislike
    }

    await video.save();
    res.json({
      message: "Dislike updated",
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (error) {
    console.error("Error disliking video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a comment
router.post("/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;
    if (!text)
      return res.status(400).json({ error: "Comment cannot be empty" });

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.comments.push({ userId, text, createdAt: new Date() });
    await video.save();

    res.json({ message: "Comment added", comments: video.comments });
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const filter = {
      $or: [
        { title: { $regex: q, $options: "i" } }, // Match title
        { description: { $regex: q, $options: "i" } }, // Match description
        { category: { $regex: q, $options: "i" } }, // Match category
      ],
    };

    let videos = await Video.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "uploaderId",
          foreignField: "_id",
          as: "uploader",
        },
      },
      { $unwind: "$uploader" },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          category: 1,
          filename: 1,
          thumbnail: 1,
          views: 1,
          createdAt: 1,
          uploaderId: 1,
          "uploader.name": 1,
          "uploader.photo": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    if (!videos.length) {
      return res.status(404).json({ message: "No videos found" });
    }

    // Function to get video duration
    const getVideoDuration = (videoPath) => {
      return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err || !metadata.format || !metadata.format.duration) {
            console.error("Error fetching duration:", err);
            return resolve("0:00"); // Default duration
          }

          let totalSeconds = Math.round(metadata.format.duration);
          let hours = Math.floor(totalSeconds / 3600);
          let minutes = Math.floor((totalSeconds % 3600) / 60);
          let seconds = totalSeconds % 60;

          let durationString =
            hours > 0
              ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                  .toString()
                  .padStart(2, "0")}`
              : `${minutes}:${seconds.toString().padStart(2, "0")}`;

          resolve(durationString);
        });
      });
    };

    // Attach duration to each video using Promise.all()
    videos = await Promise.all(
      videos.map(async (video) => {
        const videoPath = path.join(__dirname, "../uploads", video.filename);

        // Check if file exists
        if (!fs.existsSync(videoPath)) {
          console.error("File not found:", videoPath);
          video.duration = "0:00"; // Default if file doesn't exist
        } else {
          console.log("Processing video:", videoPath);
          video.duration = await getVideoDuration(videoPath);
        }

        return video;
      })
    );

    res.json(videos);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error searching videos", error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Get userId from query params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const video = await Video.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Join uploader details
      {
        $lookup: {
          from: "users",
          localField: "uploaderId",
          foreignField: "_id",
          as: "uploader",
        },
      },
      { $unwind: "$uploader" },

      // Join comments with user details
      {
        $lookup: {
          from: "users",
          localField: "comments.userId",
          foreignField: "_id",
          as: "commentUsers",
        },
      },

      // Count likes and dislikes correctly
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ["$likes", []] } }, // Count likes array
          dislikeCount: { $size: { $ifNull: ["$dislikes", []] } }, // Count dislikes array
          isLiked: {
            $in: [
              new mongoose.Types.ObjectId(userId),
              { $ifNull: ["$likes", []] },
            ],
          },
          isDisliked: {
            $in: [
              new mongoose.Types.ObjectId(userId),
              { $ifNull: ["$dislikes", []] },
            ],
          },
        },
      },

      // Restructure output
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          filename: 1,
          thumbnail: 1,
          category: 1,
          views: 1,
          createdAt: 1,
          likeCount: 1,
          dislikeCount: 1,
          isLiked: 1,
          isDisliked: 1,
          uploaderId: 1,
          uploader: {
            name: "$uploader.name",
            photo: "$uploader.photo",
            subscribers: "$uploader.subscribers", // directly project the number
          },
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                _id: "$$comment._id",
                text: "$$comment.text",
                createdAt: "$$comment.createdAt",
                userId: "$$comment.userId",
                userName: {
                  $let: {
                    vars: {
                      index: {
                        $indexOfArray: [
                          "$commentUsers._id",
                          "$$comment.userId",
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: { $gte: ["$$index", 0] },
                        then: {
                          $arrayElemAt: ["$commentUsers.name", "$$index"],
                        },
                        else: null,
                      },
                    },
                  },
                },
                userPic: {
                  $let: {
                    vars: {
                      index: {
                        $indexOfArray: [
                          "$commentUsers._id",
                          "$$comment.userId",
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: { $gte: ["$$index", 0] },
                        then: {
                          $arrayElemAt: ["$commentUsers.photo", "$$index"],
                        },
                        else: null,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    if (!video.length) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(video[0]);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

router.post("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    video.views += 1;
    await video.save();

    res.json({ message: "View count updated", views: video.views });
  } catch (error) {
    console.error("Error updating views:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/:id/count", async (req, res) => {
  try {
    const count = await Video.countDocuments({ uploaderId: req.params.id });
    res.json({ totalVideos: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user/:id/recent", async (req, res) => {
  try {
    let videos = await Video.find({ uploaderId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(3);

    // Function to get video duration
    const getVideoDuration = (videoPath) => {
      return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err || !metadata.format || !metadata.format.duration) {
            console.error("Error fetching duration:", err);
            return resolve("0:00");
          }

          let totalSeconds = Math.round(metadata.format.duration);
          let hours = Math.floor(totalSeconds / 3600);
          let minutes = Math.floor((totalSeconds % 3600) / 60);
          let seconds = totalSeconds % 60;

          let durationString =
            hours > 0
              ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                  .toString()
                  .padStart(2, "0")}`
              : `${minutes}:${seconds.toString().padStart(2, "0")}`;

          resolve(durationString);
        });
      });
    };

    // Add duration to each video
    videos = await Promise.all(
      videos.map(async (video) => {
        const videoPath = path.join(__dirname, "../uploads", video.filename);
        if (fs.existsSync(videoPath)) {
          video = video.toObject(); // convert mongoose doc to plain object to add fields
          video.duration = await getVideoDuration(videoPath);
        } else {
          video = video.toObject();
          video.duration = "0:00";
        }
        return video;
      })
    );

    res.json(videos);
  } catch (error) {
    console.error("Error fetching recent videos:", error);
    res.status(500).json({ error: "Failed to fetch recent videos" });
  }
});

router.get("/user/:id/videos", async (req, res) => {
  try {
    const userId = req.params.id;
    let videos = await Video.find({ uploaderId: userId })
      .populate("uploaderId", "name photo")
      .sort({ createdAt: -1 });

    // Function to get video duration
    const getVideoDuration = (videoPath) => {
      return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err || !metadata.format || !metadata.format.duration) {
            console.error("Error fetching duration:", err);
            return resolve("0:00");
          }

          const totalSeconds = Math.round(metadata.format.duration);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          const durationString =
            hours > 0
              ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                  .toString()
                  .padStart(2, "0")}`
              : `${minutes}:${seconds.toString().padStart(2, "0")}`;

          resolve(durationString);
        });
      });
    };

    // Add duration to each video
    videos = await Promise.all(
      videos.map(async (video) => {
        const videoPath = path.join(__dirname, "../uploads", video.filename);
        video = video.toObject();
        video.duration = fs.existsSync(videoPath)
          ? await getVideoDuration(videoPath)
          : "0:00";
        return video;
      })
    );

    res.json(videos);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
