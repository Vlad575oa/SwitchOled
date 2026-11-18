import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/queries";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: { product: string; category: string };
}) {
  const product = await getProductBySlug(params.product);

  const name = product?.name ?? "Switch OLED";
  const price = product?.price
    ? `${(product.price / 100).toLocaleString("ru-RU")} ₽`
    : null;
  const imageUrl = product?.images?.[0] ?? null;
  const categoryName = product?.category?.name ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Red accent bar left */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 8,
            height: 630,
            background: "#111111",
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 48px 56px 64px",
            width: imageUrl ? 620 : 1136,
            flex: "none",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: "#111111",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: "#ffffff",
                  borderRadius: "50%",
                }}
              />
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: "#2d2d2d", letterSpacing: -0.5 }}>
              Switch OLED
            </span>
          </div>

          {/* Category + name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categoryName && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111111",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {categoryName}
              </span>
            )}
            <span
              style={{
                fontSize: name.length > 50 ? 32 : 40,
                fontWeight: 900,
                color: "#2d2d2d",
                lineHeight: 1.2,
              }}
            >
              {name}
            </span>
          </div>

          {/* Price + badge */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {price && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    color: "#111111",
                  }}
                >
                  {price}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  background: "#f5f5f5",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2d2d2d",
                }}
              >
                100% Оригинал
              </div>
              <div
                style={{
                  background: "#f5f5f5",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2d2d2d",
                }}
              >
                Гарантия 1 год
              </div>
              <div
                style={{
                  background: "#f5f5f5",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#2d2d2d",
                }}
              >
                Быстрая доставка
              </div>
            </div>
          </div>
        </div>

        {/* Right — product image */}
        {imageUrl && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f9f9f9",
              position: "relative",
            }}
          >
            {/* Decorative circle */}
            <div
              style={{
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: "50%",
                background: "#f0f0f0",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              style={{
                width: 460,
                height: 460,
                objectFit: "contain",
                position: "relative",
                zIndex: 1,
              }}
            />
          </div>
        )}

        {/* Bottom red line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1200,
            height: 4,
            background: "#111111",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
