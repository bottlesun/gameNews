"use client";

import { NotionRenderer } from "react-notion-x";
import { ExtendedRecordMap } from "notion-types";

// Import react-notion-x styles
import "react-notion-x/src/styles.css";

interface NotionRendererClientProps {
  recordMap: ExtendedRecordMap;
}

export default function NotionRendererClient({
  recordMap,
}: NotionRendererClientProps) {
  return (
    <NotionRenderer
      recordMap={recordMap}
      fullPage={false}
      darkMode={false}
      components={
        {
          // Customize components if needed
        }
      }
    />
  );
}
