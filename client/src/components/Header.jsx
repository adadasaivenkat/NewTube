import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiMic, FiUpload, FiUser, FiX } from "react-icons/fi";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import YouTubeLogo from "../assets/youtube-logo.jsx";

const Header = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const startVoiceRecording = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, user is not authenticated.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error(`Error ${response.status}: ${response.statusText}`);
          localStorage.removeItem("token");
          setCurrentUser(null);
          return;
        }

        const userData = await response.json();
        setCurrentUser({
          ...userData,
          displayName: userData.name,
          photoURL: userData.photo,
        });
      } catch (error) {
        console.error("Error fetching user:", error.message);
        setCurrentUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-light-bg dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800">
      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-light-bg dark:bg-dark-bg md:hidden">
          <div className="flex items-center h-16 px-4">
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2 mr-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover">
              <FiX className="text-xl" />
            </button>
            <form onSubmit={handleSearch} className="flex-1 flex">
              <div className="relative flex flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-full bg-white dark:bg-dark-bg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-light-sidebar dark:bg-dark-sidebar border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-light-hover dark:hover:bg-dark-hover">
                  <FiSearch className="text-xl" />
                </button>
              </div>
            </form>
            <button
              onClick={startVoiceRecording}
              className={`p-2 ml-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover ${
                isRecording ? "bg-red-500 text-white" : ""
              }`}
              aria-label="Search with voice">
              <FiMic
                className={`text-xl ${isRecording ? "animate-pulse" : ""}`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Content */}
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left section */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover"
            aria-label="Toggle sidebar">
            <FiMenu className="text-2xl" />
          </button>

          <Link to="/" className="flex items-center">
            <YouTubeLogo className="h-5 md:h-6" isDarkMode={theme === "dark"} />
          </Link>
        </div>

        {/* Middle section - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-2xl mx-4">
          <form onSubmit={handleSearch} className="flex w-full">
            <div className="relative flex flex-1">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-full bg-white dark:bg-dark-bg focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-light-sidebar dark:bg-dark-sidebar border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-light-hover dark:hover:bg-dark-hover">
                <FiSearch className="text-xl" />
              </button>
            </div>
          </form>
          <button
            onClick={startVoiceRecording}
            className={`p-2 ml-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover ${
              isRecording ? "bg-red-500 text-white" : ""
            }`}
            aria-label="Search with voice">
            <FiMic
              className={`text-xl ${isRecording ? "animate-pulse" : ""}`}
            />
          </button>
          {isRecording && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-dark-bg p-4 rounded-lg shadow-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Listening... Speak now
              </p>
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover">
            <FiSearch className="text-xl" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }>
            {theme === "dark" ? (
              <FaSun className="text-xl" />
            ) : (
              <FaMoon className="text-xl" />
            )}
          </button>

          {currentUser ? (
            <>
              <Link
                to="/upload"
                className="p-2 rounded-full hover:bg-light-hover dark:hover:bg-dark-hover"
                aria-label="Upload video">
                <FiUpload className="text-xl" />
              </Link>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden focus:outline-none">
                  <img
                    src={
                      currentUser.photo
                        ? currentUser.photo.startsWith("https:")
                          ? currentUser.photo
                          : `${API_URL}/uploads/profilepics/${currentUser.photo}`
                        : `${API_URL}/uploads/profilepics/default_image.png`
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
                    }}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-sidebar rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <Link
                      to={`/channel/${currentUser._id}`}
                      className="block px-4 py-2 hover:bg-light-hover dark:hover:bg-dark-hover">
                      Your channel
                    </Link>

                    <Link
                      to="/studio"
                      className="block px-4 py-2 hover:bg-light-hover dark:hover:bg-dark-hover">
                      YouTube Studio
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 hover:bg-light-hover dark:hover:bg-dark-hover text-red-600">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/signin"
              className="flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <FiUser className="mr-2" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
