import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";
import { getBlogImage } from "@/lib/blogImages";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const post = await prisma.post.findUnique({
    where: { slug },
  });

  const title = post?.title ?? "Блог Gameshop24";
  const category = post?.category ?? "Материал";
  const imageUrl = post ? getBlogImage(post) : null;
  const date = post?.createdAt
    ? new Date(post.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "#111827",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Image with Overlay */}
        {imageUrl && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: 1200,
                height: 630,
                objectFit: "cover",
                opacity: 0.4,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                background: "linear-gradient(to bottom, rgba(17, 24, 39, 0.4), rgba(17, 24, 39, 0.95))",
              }}
            />
          </div>
        )}

        {/* Content Overlay */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px 100px",
            height: "100%",
            width: "100%",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Top Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "#111111",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 20px rgba(17, 17, 17, 0.3)",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "#ffffff",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <span style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", letterSpacing: -1 }}>
                Gameshop24
              </span>
            </div>
            <div
              style={{
                background: "rgba(17, 17, 17, 0.1)",
                border: "1px solid rgba(17, 17, 17, 0.3)",
                padding: "8px 20px",
                borderRadius: 100,
                color: "#111111",
                fontSize: 16,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {category}
            </div>
          </div>

          {/* Title Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1
              style={{
                fontSize: title.length > 40 ? 48 : 64,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.1,
                margin: 0,
                padding: 0,
                textShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 16, height: 16, background: "#111111", borderRadius: "50%" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#9ca3af", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Опубликовано
                </span>
                <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 700 }}>
                  {date}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Branding accents */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1200,
            height: 6,
            background: "linear-gradient(to right, #111111, #bdbdbd)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
