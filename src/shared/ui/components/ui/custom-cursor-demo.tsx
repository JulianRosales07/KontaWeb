"use client";

import {
  CustomCursor,
  CustomCursorTarget,
} from "./custom-cursor";

export default function CustomCursorDemo() {
  return (
    <CustomCursor className="w-full" color="#ff4c24" layout="demo">
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-muted-foreground">
          Move your pointer over the target
        </p>
        <CustomCursorTarget
          aria-label="Interactive target"
          className="rounded-2xl border bg-background text-foreground shadow-sm"
          size="lg"
        >
          <svg
            aria-hidden="true"
            className="size-7"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3v18M3 12h18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </CustomCursorTarget>
      </div>
    </CustomCursor>
  );
}
