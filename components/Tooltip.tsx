"use client";
import { useState } from "react";

export function Tooltip({ id, content }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShow(!show)}
        className="text-brand hover:text-brand-deep ml-1"
        title="Help"
      >
        ℹ️
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-ink-deep text-white p-3 rounded-lg text-xs max-w-xs whitespace-normal">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-ink-deep"></div>
        </div>
      )}
    </div>
  );
}
