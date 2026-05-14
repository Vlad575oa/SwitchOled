import dynamic from "next/dynamic";

const GamepadTestClient = dynamic(
  () => import("./GamepadTestClient").then((m) => ({ default: m.GamepadTestClient })),
  { ssr: false }
);

export default function GamepadTestPage() {
  return <GamepadTestClient />;
}
