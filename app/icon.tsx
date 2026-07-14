import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          padding: "8px 7px",
          borderRadius: 7,
          background: "#246bfd",
        }}
      >
        <span style={{ width: 4, height: 8, borderRadius: 2, background: "#fff", opacity: 0.65 }} />
        <span style={{ width: 4, height: 16, borderRadius: 2, background: "#fff" }} />
        <span style={{ width: 4, height: 12, borderRadius: 2, background: "#fff", opacity: 0.8 }} />
      </div>
    ),
    size,
  );
}
