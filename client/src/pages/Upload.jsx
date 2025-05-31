import { useState } from "react";
import { Image, Upload as UploadIcon, X } from "lucide-react";
import toast from "react-hot-toast";

function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [category, setCategory] = useState("");
  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Please select a valid video file.");
        return;
      }
      setFile(selectedFile);
      setVideoPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please select a valid image file for the thumbnail.");
        return;
      }
      setThumbnail(selectedFile);
      setThumbnailPreview(URL.createObjectURL(selectedFile));
    }
  };

  const removeVideo = () => {
    setFile(null);
    setVideoPreview(null);
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    if (
      !title.trim() ||
      !description.trim() ||
      !file ||
      !category.trim() ||
      !thumbnail
    ) {
      toast.error(
        "Title, description, category, video file, and thumbnail are required."
      );
      setUploading(false);
      return;
    }

    const uploaderId = localStorage.getItem("userId");
    if (!uploaderId) {
      toast.error("User authentication error. Please log in.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("video", file);
    formData.append("thumbnail", thumbnail);
    formData.append("uploaderId", uploaderId);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      toast.success("Video uploaded successfully!");
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setVideoPreview(null);
    } catch (error) {
      console.error("Upload Error:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Upload Video</h1>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-[#FFFFFF] bg-[#FF0000] hover:bg-[#FF0000]/80 focus:outline-none">
            <UploadIcon className="w-5 h-5 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-[#F2F2F2] dark:bg-[#212121] rounded-2xl p-6 shadow-lg">
            <div className="space-y-6">
              <div>
                <label className="text-lg font-medium block mb-4">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title that describes your video"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212121] focus:outline-none focus:ring-2 focus:ring-[#FF0000] dark:focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="text-lg font-medium block mb-4">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212121] focus:outline-none focus:ring-2 focus:ring-[#FF0000] dark:focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="text-lg font-medium block mb-4">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter a category"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#212121] focus:outline-none focus:ring-2 focus:ring-[#FF0000] dark:focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F2F2F2] dark:bg-[#212121] rounded-2xl p-6 shadow-lg">
            <label className="text-lg font-medium block mb-4">Video</label>
            {!file && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-[#FF0000] dark:hover:border-[#FF0000] transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer block">
                  <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-lg font-medium">Drop your video here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    MP4, WebM or OGG (max. 2GB)
                  </p>
                </label>
              </div>
            )}
            {videoPreview && (
              <div className="relative">
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-[#FF0000] text-white p-2 rounded-full hover:bg-red-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#F2F2F2] dark:bg-[#212121] rounded-2xl p-6 shadow-lg">
            <label className="text-lg font-medium block mb-4">Thumbnail</label>
            {!thumbnail && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-[#FF0000] dark:hover:border-[#FF0000] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  <Image className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-lg font-medium">
                    Click to upload thumbnail
                  </p>
                </label>
              </div>
            )}
            {thumbnailPreview && (
              <div className="relative">
                <div className="aspect-video rounded-xl overflow-hidden">
                  <img
                    src={thumbnailPreview}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={removeThumbnail}
                  className="absolute top-2 right-2 bg-[#FF0000] text-white p-2 rounded-full hover:bg-red-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Upload;
