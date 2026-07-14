import { ImageResponse } from "next/og";

export const alt =
  "Vercel Analytics Digest — Vercel analytics delivered by email";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const routeRow = (route: string, views: string) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "9px 0",
      borderTop: "1px solid #eef1f5",
      color: "#7b8494",
      fontSize: 16,
    }}
  >
    <span style={{ fontFamily: "monospace", color: "#4e596d" }}>{route}</span>
    <span>{views}</span>
  </div>
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          overflow: "hidden",
          padding: "54px 64px",
          color: "#ffffff",
          backgroundColor: "#111b32",
          backgroundImage:
            "radial-gradient(circle at 76% 45%, rgba(58,111,250,.28), transparent 31%), linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "auto, 54px 54px, 54px 54px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 550,
            height: 550,
            right: -180,
            top: -300,
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 999,
            boxShadow:
              "0 0 0 70px rgba(255,255,255,.018), 0 0 0 140px rgba(255,255,255,.012)",
          }}
        />

        <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 20,
              borderBottom: "1px solid rgba(255,255,255,.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 13, fontSize: 19, fontWeight: 700 }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 3,
                  padding: "9px 8px",
                  borderRadius: 9,
                  background: "#246bfd",
                  boxShadow: "0 8px 24px rgba(36,107,253,.36)",
                }}
              >
                <i style={{ width: 4, height: 8, borderRadius: 2, background: "#fff", opacity: 0.65 }} />
                <i style={{ width: 4, height: 17, borderRadius: 2, background: "#fff" }} />
                <i style={{ width: 4, height: 13, borderRadius: 2, background: "#fff", opacity: 0.8 }} />
              </span>
              <span>Analytics Digest</span>
            </div>
            <span style={{ color: "#94a1b9", fontFamily: "monospace", fontSize: 14 }}>
              OPEN SOURCE / SELF-HOSTED
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 62 }}>
            <div style={{ width: 595, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,.16)",
                  borderRadius: 6,
                  color: "#c6d1e7",
                  background: "rgba(255,255,255,.04)",
                  fontFamily: "monospace",
                  fontSize: 14,
                  letterSpacing: 1.2,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 99,
                    background: "#baf35d",
                    boxShadow: "0 0 0 5px rgba(186,243,93,.12)",
                  }}
                />
                SIX-HOUR TRAFFIC DIGEST
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 25,
                  fontSize: 67,
                  lineHeight: 0.98,
                  letterSpacing: -4.4,
                  fontWeight: 750,
                }}
              >
                <span>Vercel analytics.</span>
                <span style={{ color: "#8ab0ff" }}>Delivered by email.</span>
              </div>
              <p style={{ width: 560, margin: "25px 0 0", color: "#b7c1d5", fontSize: 21, lineHeight: 1.55 }}>
                Pageviews, visitors, and top routes from every project—compared with the previous six hours.
              </p>
            </div>

            <div style={{ width: 390, display: "flex", position: "relative" }}>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.2)",
                  borderRadius: 14,
                  color: "#121a2b",
                  background: "#fff",
                  boxShadow: "0 28px 70px rgba(4,9,23,.46), 0 0 0 7px rgba(255,255,255,.025)",
                  transform: "rotate(-2deg)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", padding: "21px 24px 17px" }}>
                  <span style={{ display: "flex", alignItems: "center", color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>
                    <svg
                      width="11"
                      height="10"
                      viewBox="0 0 11 10"
                      style={{ marginRight: 7 }}
                    >
                      <path d="M5.5 0 11 10H0Z" fill="#111827" />
                    </svg>
                    VERCEL ANALYTICS
                  </span>
                  <strong style={{ marginTop: 7, fontSize: 23, letterSpacing: -0.7 }}>Six-hour traffic digest</strong>
                  <span style={{ marginTop: 5, color: "#9ca3af", fontFamily: "monospace", fontSize: 11 }}>
                    JUL 14 · 6:00 AM — 12:00 PM
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: "19px 24px 20px", color: "#fff", background: "#111827" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: 11, letterSpacing: 1.2 }}>
                    <span>TOTAL PAGEVIEWS</span><span>VS PRIOR 6H</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9 }}>
                    <strong style={{ fontSize: 42, letterSpacing: -1.5 }}>9,738</strong>
                    <strong style={{ color: "#4ade80", fontSize: 17 }}>+18%</strong>
                  </div>
                  <span style={{ marginTop: 5, color: "#9ca3af", fontSize: 13 }}>6,585 unique visitors · 2 projects</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: "18px 24px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 17 }}>keegan.codes</strong>
                    <strong style={{ color: "#16a34a", fontSize: 13 }}>+24%</strong>
                  </div>
                  <span style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>5,821 pageviews · 3,984 visitors</span>
                  <div style={{ width: "100%", height: 6, marginTop: 13, borderRadius: 5, background: "#2a78d6" }} />
                  <span style={{ marginTop: 15, color: "#9ca3af", fontSize: 10, letterSpacing: 1.2 }}>TOP PAGES · BY PAGEVIEWS</span>
                  {routeRow("/projects", "2,184")}
                  {routeRow("/blog", "1,406")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
