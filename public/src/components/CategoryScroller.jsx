// src/components/CategoryScroller.jsx
import React, { useRef, useEffect, useState } from "react";

/**
 * FIXES ADDED:
 * ✔ Active border fully wraps image
 * ✔ No screen jump when selecting a category
 * ✔ Proper scroll-snap without vertical movement
 * ✔ Full image shown without cropping
 */

export default function CategoryScroller({
  categories = [],
  onSelect = () => {},
  initialActive = null,
}) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(initialActive || categories[0]?.id);

  // Smooth scroll to selected item without jumping screen
  useEffect(() => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current.querySelector(`[data-cat="${active}"]`);
    if (el) {
      const parent = scrollerRef.current;
      const offset = el.offsetLeft - parent.clientWidth / 2 + el.clientWidth / 2;
      parent.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [active]);

  function scroll(delta) {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  }

  function handleSelect(cat) {
    setActive(cat.id);
    onSelect(cat.id);
  }

  return (
    <div className="relative py-2">

      {/* Left Arrow */}
      <button
        onClick={() => scroll(-300)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full w-8 h-8 items-center justify-center z-10 hover:bg-gray-50"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5L6 11L12 17" />
        </svg>
      </button>

      {/* SCROLLER */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-2 scroll-smooth"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => handleSelect(cat)}
            className="flex flex-col items-center scroll-snap-align-start"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* WRAPPER BOX — border applied here */}
            <div
              className={`
                w-24 h-24 overflow-hidden 
                ${active === cat.id ? "ring-2 ring-brand-500 rounded-lg" : "rounded-lg"}
              `}
            >
              <img
                src={cat.iconUrl}
                alt={cat.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-xs mt-2 text-gray-700 leading-tight max-w-[80px] text-center">
              {cat.title}
            </div>
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll(300)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow rounded-full w-8 h-8 items-center justify-center z-10 hover:bg-gray-50"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 5L12 11L6 17" />
        </svg>
      </button>
    </div>
  );
}

