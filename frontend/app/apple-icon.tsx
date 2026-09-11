import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8D85C9 0%, #433C77 100%)",
        }}
      >
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c1 1 1.5 2.2 1.5 3.5A4.5 4.5 0 0 1 12 21a4.5 4.5 0 0 1-4.5-4.5C7.5 12 12 9 12 3Z"
            stroke="white"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
