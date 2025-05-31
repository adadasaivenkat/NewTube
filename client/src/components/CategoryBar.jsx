import { useState, useRef, useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

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

const CategoryBar = ({ selectedCategory, setSelectedCategory }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  return (
    <div className="relative flex justify-center items-center mb-4 w-full overflow-hidden">
      {categories.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
          No categories available
        </p>
      ) : (
        <>
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-md rounded-full p-2 bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-[#212121] dark:hover:bg-[#303030] text-[#0F0F0F] dark:text-white"
              aria-label="Scroll categories left">
              <FiChevronLeft className="text-xl" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            tabIndex={0}
            role="list"
            className="flex overflow-x-auto py-2 px-2 scrollbar-hide justify-start w-full max-w-screen-lg"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {categories.map((category) => {
              const isSelected =
                selectedCategory === (category === "All" ? "" : category);
              return (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category === "All" ? "" : category)
                  }
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition mr-2 ${
                    isSelected
                      ? "bg-[#FF0000] text-white"
                      : "bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] dark:bg-[#212121] dark:hover:bg-[#303030] dark:text-white"
                  }`}
                  role="listitem">
                  {category}
                </button>
              );
            })}
          </div>

          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-md rounded-full p-2 bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-[#212121] dark:hover:bg-[#303030] text-[#0F0F0F] dark:text-white"
              aria-label="Scroll categories right">
              <FiChevronRight className="text-xl" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryBar;
