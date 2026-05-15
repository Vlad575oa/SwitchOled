"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Gamepad2, WifiOff, Vibrate, Info, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GPState {
  id: string;
  index: number;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
  connected: boolean;
}

type DriftPoint = { x: number; y: number; jump: boolean };

const DRIFT_THRESHOLD = 0.1;
const MAX_TRAIL = 400;

const BTN: Record<number, string> = {
  0:"A/×", 1:"B/○", 2:"X/□", 3:"Y/△",
  4:"LB", 5:"RB", 6:"LT", 7:"RT",
  8:"Sel", 9:"Sta", 10:"L3", 11:"R3",
  12:"↑", 13:"↓", 14:"←", 15:"→", 16:"⌂",
};

// Radial keyboard chars (36 sectors, 10° each)
const RADIAL_CHARS = [
  "а","б","в","г","д","е","ё","ж","з","и",
  "й","к","л","м","н","о","п","р","с","т",
  "у","ф","х","ц","ч","ш","щ","ъ","ы","ь",
  "э","ю","я"," ","←","⏎"
];

const EMPTY_GP: GPState = {
  id: "Не подключён",
  index: 0,
  connected: false,
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  axes: [0, 0, 0, 0],
};

// ── SVG Gamepad ───────────────────────────────────────────────────────────────

function GamepadSVG({ btns }: { btns: { pressed: boolean; value: number }[] }) {
  const pressed = (i: number) => btns[i]?.pressed ?? false;
  const c = (i: number) => pressed(i) ? "#e60012" : "#d1d5db";
  const ct = (i: number) => pressed(i) ? "white" : "#9ca3af";

  return (
    <svg viewBox="0 0 320 200" className="w-full max-w-[280px]" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Body */}
      <path d="M60 80 Q40 60 30 100 Q20 145 55 165 Q80 180 100 160 L120 140 H200 L220 160 Q240 180 265 165 Q300 145 290 100 Q280 60 260 80 Q240 60 200 55 H120 Q80 60 60 80Z"
        stroke="#9ca3af" strokeWidth="2" fill="#f9fafb"/>
      {/* Left bumper */}
      <path d="M62 78 Q75 60 100 58 L115 55 Q80 52 60 70Z" stroke={c(4)} strokeWidth="1.5" fill={pressed(4)?"#fecaca":"#f3f4f6"}/>
      {/* Right bumper */}
      <path d="M258 78 Q245 60 220 58 L205 55 Q240 52 260 70Z" stroke={c(5)} strokeWidth="1.5" fill={pressed(5)?"#fecaca":"#f3f4f6"}/>
      {/* Left trigger */}
      <path d="M58 74 Q50 55 45 40 Q55 30 75 35 Q90 50 90 58" stroke={c(6)} strokeWidth="1.5" fill={pressed(6)?"#fecaca":"#e5e7eb"}/>
      {/* Right trigger */}
      <path d="M262 74 Q270 55 275 40 Q265 30 245 35 Q230 50 230 58" stroke={c(7)} strokeWidth="1.5" fill={pressed(7)?"#fecaca":"#e5e7eb"}/>
      {/* Left stick */}
      <circle cx="105" cy="115" r="22" stroke="#9ca3af" strokeWidth="1.5" fill={pressed(10)?"#fee2e2":"white"}/>
      <circle cx="105" cy="115" r="10" stroke="#d1d5db" strokeWidth="1" fill="#f3f4f6"/>
      {/* Right stick */}
      <circle cx="195" cy="135" r="22" stroke="#9ca3af" strokeWidth="1.5" fill={pressed(11)?"#fee2e2":"white"}/>
      <circle cx="195" cy="135" r="10" stroke="#d1d5db" strokeWidth="1" fill="#f3f4f6"/>
      {/* D-pad */}
      <rect x="140" y="108" width="10" height="28" rx="2" stroke={c(12)} fill={pressed(12)||pressed(13)?"#fecaca":"#f3f4f6"}/>
      <rect x="128" y="120" width="10" height="10" rx="2" stroke={c(14)} fill={pressed(14)?"#fecaca":"#f3f4f6"}/>
      <rect x="152" y="120" width="10" height="10" rx="2" stroke={c(15)} fill={pressed(15)?"#fecaca":"#f3f4f6"}/>
      {/* ABXY */}
      <circle cx="238" cy="108" r="8" stroke={c(1)} fill={pressed(1)?"#fecaca":"#f3f4f6"}/>
      <text x="238" y="112" textAnchor="middle" fontSize="7" fill={ct(1)} fontWeight="bold">B</text>
      <circle cx="222" cy="100" r="8" stroke={c(2)} fill={pressed(2)?"#fecaca":"#f3f4f6"}/>
      <text x="222" y="104" textAnchor="middle" fontSize="7" fill={ct(2)} fontWeight="bold">X</text>
      <circle cx="254" cy="100" r="8" stroke={c(3)} fill={pressed(3)?"#fecaca":"#f3f4f6"}/>
      <text x="254" y="104" textAnchor="middle" fontSize="7" fill={ct(3)} fontWeight="bold">Y</text>
      <circle cx="238" cy="92" r="8" stroke={c(0)} fill={pressed(0)?"#fecaca":"#f3f4f6"}/>
      <text x="238" y="96" textAnchor="middle" fontSize="7" fill={ct(0)} fontWeight="bold">A</text>
      {/* Select/Start */}
      <rect x="143" y="93" width="12" height="7" rx="2" stroke={c(8)} fill={pressed(8)?"#fecaca":"#f3f4f6"}/>
      <rect x="165" y="93" width="12" height="7" rx="2" stroke={c(9)} fill={pressed(9)?"#fecaca":"#f3f4f6"}/>
      <text x="149" y="99" textAnchor="middle" fontSize="5" fill="#9ca3af">SEL</text>
      <text x="171" y="99" textAnchor="middle" fontSize="5" fill="#9ca3af">STA</text>
    </svg>
  );
}

// ── Stick Circle ──────────────────────────────────────────────────────────────

function StickCircle({ x, y, label, ax, ay, points, showWorkArea }: {
  x: number; y: number; label: string; ax: number; ay: number;
  points: DriftPoint[];
  showWorkArea: boolean;
}) {
  const S = 170; const C = S / 2; const R = C - 12;
  const dx = C + x * R; const dy = C + y * R;
  const drift = Math.hypot(x, y) > DRIFT_THRESHOLD;
  const err = Math.max(Math.abs(x), Math.abs(y));
  const fillPath = showWorkArea && points.length > 2
    ? (() => {
        const bins = 120;
        const maxByAngle = new Array<number>(bins).fill(0);
        for (const p of points) {
          const r = Math.min(1, Math.hypot(p.x, p.y));
          const a = (Math.atan2(p.y, p.x) + Math.PI) / (2 * Math.PI);
          const idx = Math.max(0, Math.min(bins - 1, Math.floor(a * bins)));
          if (r > maxByAngle[idx]) maxByAngle[idx] = r;
        }
        let d = "";
        for (let i = 0; i < bins; i++) {
          const t = (i / bins) * Math.PI * 2 - Math.PI;
          const rr = maxByAngle[i] * R;
          const px = C + rr * Math.cos(t);
          const py = C + rr * Math.sin(t);
          d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
        }
        return `${d} Z`;
      })()
    : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={S} height={S}>
        {fillPath && (
          <path d={fillPath} fill="#bfdbfe" fillOpacity="0.45" />
        )}
        <circle cx={C} cy={C} r={R} stroke={drift?"#e60012":"#e5e7eb"} strokeWidth="1.5" fill="none"/>
        <circle cx={C} cy={C} r={R*DRIFT_THRESHOLD} stroke="#d1d5db" strokeWidth="1" strokeDasharray="2 2" fill="none"/>
        <line x1={C} y1={7} x2={C} y2={S-7} stroke="#f3f4f6" strokeWidth="1"/>
        <line x1={7} y1={C} x2={S-7} y2={C} stroke="#f3f4f6" strokeWidth="1"/>
        <circle cx={dx} cy={dy} r={7} fill={drift?"#e60012":"#1a1a1c"}/>
      </svg>
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
      <div className="text-[10px] tabular-nums text-neutral-500 space-y-0.5 text-center">
        <div>Г: <span className={Math.abs(ax)>DRIFT_THRESHOLD?"text-red-500":""}>{ax.toFixed(3)}</span></div>
        <div>В: <span className={Math.abs(ay)>DRIFT_THRESHOLD?"text-red-500":""}>{ay.toFixed(3)}</span></div>
        <div>Погрешн.: <span className={err>DRIFT_THRESHOLD?"text-red-500 font-bold":""}>{err.toFixed(3)}</span></div>
      </div>
    </div>
  );
}

// ── Drift Canvas ──────────────────────────────────────────────────────────────

function DriftCanvas({
  points, showWorkArea,
}: { points: DriftPoint[]; showWorkArea: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const cx = W / 2; const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 0.5;
    const step = W / 20;
    for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Axes
    ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();

    // Deadzone ring
    ctx.strokeStyle = "#d1fae5"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, (W/2)*DRIFT_THRESHOLD, 0, Math.PI*2); ctx.stroke();

    // Working area (max reach)
    if (showWorkArea && points.length > 0) {
      // Fill reached grid cells for visible work-area coverage
      const grid = 28;
      const cell = W / grid;
      const touched = new Set<string>();
      for (const p of points) {
        const gx = Math.max(0, Math.min(grid - 1, Math.floor(((p.x + 1) / 2) * grid)));
        const gy = Math.max(0, Math.min(grid - 1, Math.floor(((p.y + 1) / 2) * grid)));
        touched.add(`${gx}:${gy}`);
      }
      ctx.fillStyle = "rgba(147, 197, 253, 0.35)";
      for (const key of Array.from(touched)) {
        const [gx, gy] = key.split(":").map(Number);
        ctx.fillRect(gx * cell, gy * cell, cell, cell);
      }

      ctx.strokeStyle = "#bfdbfe"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      const maxR = points.reduce((m,p)=>Math.max(m, Math.hypot(p.x,p.y)),0);
      ctx.beginPath(); ctx.arc(cx, cy, maxR*(W/2), 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Trail
    for (let i = 1; i < points.length; i++) {
      const a = points[i-1]; const b = points[i];
      ctx.strokeStyle = b.jump ? "#e60012" : "#6366f1";
      ctx.lineWidth = b.jump ? 1.5 : 0.8;
      ctx.globalAlpha = 0.3 + (i/points.length)*0.7;
      ctx.beginPath();
      ctx.moveTo(cx + a.x*(W/2), cy + a.y*(H/2));
      ctx.lineTo(cx + b.x*(W/2), cy + b.y*(H/2));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Current dot
    if (points.length > 0) {
      const p = points[points.length-1];
      ctx.fillStyle = Math.hypot(p.x,p.y) > DRIFT_THRESHOLD ? "#e60012" : "#1a1a1c";
      ctx.beginPath(); ctx.arc(cx + p.x*(W/2), cy + p.y*(H/2), 5, 0, Math.PI*2); ctx.fill();
    }
  }, [points, showWorkArea]);

  return <canvas ref={ref} width={420} height={420} className="w-full max-w-[520px] h-auto rounded-xl border border-neutral-100"/>;
}

// ── Radial Keyboard ───────────────────────────────────────────────────────────

function RadialKeyboard({ axX, axY, onChar }: {
  axX: number; axY: number; onChar: (c: string) => void;
}) {
  const N = RADIAL_CHARS.length;
  const angle = (Math.atan2(axY, axX) * 180 / Math.PI + 360) % 360;
  const dist = Math.hypot(axX, axY);
  const activeIdx = dist > 0.3 ? Math.floor(angle / (360/N)) % N : -1;
  const R = 110; const CX = 120; const CY = 120; const iR = R * 0.45;

  const prevRef = useRef(-1);
  useEffect(() => {
    if (activeIdx !== prevRef.current) { prevRef.current = activeIdx; }
  }, [activeIdx]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={240} height={240} className="shrink-0">
        {RADIAL_CHARS.map((ch, i) => {
          const a0 = (i * 360/N - 90) * Math.PI/180;
          const a1 = ((i+1) * 360/N - 90) * Math.PI/180;
          const iR = R * 0.45;
          const x1=CX+R*Math.cos(a0), y1=CY+R*Math.sin(a0);
          const x2=CX+R*Math.cos(a1), y2=CY+R*Math.sin(a1);
          const ix1=CX+iR*Math.cos(a0), iy1=CY+iR*Math.sin(a0);
          const ix2=CX+iR*Math.cos(a1), iy2=CY+iR*Math.sin(a1);
          const isActive = i === activeIdx;
          const mid = (a0+a1)/2; const mr = (R+iR)/2;
          return (
            <g key={i} onClick={()=>onChar(ch)} style={{cursor:"pointer"}}>
              <path
                d={`M${ix1},${iy1} L${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2} L${ix2},${iy2} A${iR},${iR} 0 0,0 ${ix1},${iy1}Z`}
                fill={isActive?"#e60012":"#f9fafb"} stroke={isActive?"#e60012":"#e5e7eb"} strokeWidth="0.5"
              />
              <text
                x={CX+mr*Math.cos(mid)} y={CY+mr*Math.sin(mid)+4}
                textAnchor="middle" fontSize="8" fontWeight={isActive?"bold":"normal"}
                fill={isActive?"white":"#6b7280"}
              >{ch}</text>
            </g>
          );
        })}
        {/* Center */}
        <circle cx={CX} cy={CY} r={iR*0.45} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"/>
        {dist > 0.3 && <circle cx={CX} cy={CY} r={4} fill="#e60012"/>}
      </svg>
      <p className="text-[9px] text-neutral-400 font-medium text-center">
        Наклоняйте стик для выбора символа, нажмите L3 для ввода
      </p>
    </div>
  );

}

// ── Trigger Bar ───────────────────────────────────────────────────────────────

function TriggerBar({ value, label }: { value: number; label: string }) {
  const p = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
        <span className="text-[9px] tabular-nums text-neutral-400">{p}%</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-none"
          style={{width:`${p}%`, backgroundColor: p>0?"#e60012":"transparent"}}/>
      </div>
    </div>
  );
}

// ── Button Grid ───────────────────────────────────────────────────────────────

function ButtonGrid({ buttons }: { buttons: { pressed: boolean; value: number }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 overflow-hidden">
      {buttons.map((b, i) => (
        <div key={i} className={`px-2 py-1 rounded-md text-[10px] font-black transition-all shrink-0 ${
          b.pressed ? "bg-primary text-white scale-95 shadow-md shadow-primary/30" : "bg-neutral-100 text-neutral-400"
        }`}>{BTN[i]??`B${i}`}</div>
      ))}
    </div>
  );
}

// ── Gamepad Slot ──────────────────────────────────────────────────────────────

function GamepadPanel({ gp, onVibrate }: { gp: GPState; onVibrate: () => void }) {
  const [leftTrail, setLeftTrail] = useState<DriftPoint[]>([]);
  const [rightTrail, setRightTrail] = useState<DriftPoint[]>([]);
  const [showWork, setShowWork] = useState(true);
  const [text, setText] = useState("");
  const prevLeft = useRef({ x: 0, y: 0 });
  const prevRight = useRef({ x: 0, y: 0 });
  const prevL3 = useRef(false);

  const lx = gp.axes[0] ?? 0, ly = gp.axes[1] ?? 0;
  const rx = gp.axes[2] ?? 0, ry = gp.axes[3] ?? 0;
  const lt = gp.buttons[6]?.value ?? 0;
  const rt = gp.buttons[7]?.value ?? 0;
  const l3 = gp.buttons[10]?.pressed ?? false;
  const l3Pressed = l3 && !prevL3.current;
  prevL3.current = l3;

  // Accumulate trails
  useEffect(() => {
    const prev = prevLeft.current;
    const jump = Math.hypot(lx - prev.x, ly - prev.y) > DRIFT_THRESHOLD && Math.hypot(prev.x, prev.y) < DRIFT_THRESHOLD;
    setLeftTrail(t => [...t.slice(-MAX_TRAIL), { x: lx, y: ly, jump }]);
    prevLeft.current = { x: lx, y: ly };
  }, [lx, ly]);

  useEffect(() => {
    const prev = prevRight.current;
    const jump = Math.hypot(rx - prev.x, ry - prev.y) > DRIFT_THRESHOLD && Math.hypot(prev.x, prev.y) < DRIFT_THRESHOLD;
    setRightTrail(t => [...t.slice(-MAX_TRAIL), { x: rx, y: ry, jump }]);
    prevRight.current = { x: rx, y: ry };
  }, [rx, ry]);

  // L3 = input char from radial
  useEffect(() => {
    if (!l3Pressed) return;
    const dist = Math.hypot(lx, ly);
    if (dist > 0.3) {
      const N = RADIAL_CHARS.length;
      const angle = (Math.atan2(ly, lx) * 180 / Math.PI + 360) % 360;
      const idx = Math.floor(angle / (360/N)) % N;
      const ch = RADIAL_CHARS[idx];
      if (ch === "←") setText(t => t.slice(0,-1));
      else if (ch === "⏎") setText(t => t + "\n");
      else setText(t => t + ch);
    }
  });

  return (
    <div className="space-y-8">
      {/* Row 1: SVG + Sticks */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6">
        {/* Left: gamepad illustration + sticks */}
        <div className="space-y-5 rounded-3xl border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white p-5 overflow-visible">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 md:p-4">
            <Image
              src="/images/gamepad-test/gameshop24-gamepad.jpg"
              alt="Геймпад gameshop24"
              width={960}
              height={716}
              className="mx-auto w-[70%] max-w-[686px] h-auto rounded-xl"
              priority
            />
          </div>
          <div className="flex gap-8 justify-center">
            <StickCircle x={lx} y={ly} label="Левый стик" ax={lx} ay={ly} points={leftTrail} showWorkArea={showWork} />
            <StickCircle x={rx} y={ry} label="Правый стик" ax={rx} ay={ry} points={rightTrail} showWorkArea={showWork} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <TriggerBar value={lt} label="LT" />
            <TriggerBar value={rt} label="RT" />
          </div>
        </div>

        {/* Right: Drift canvas */}
        <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-4">
          <div>
            <h3 className="text-base font-black text-secondary mb-1">Проверка на дрейф в области</h3>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-3">
              Нажмите стик и медленно перемещайте его. Быстрые скачки &gt;0,1 (10%) отмечаются красными линиями.
            </p>
          </div>

          {/* Tab: left/right stick selector */}
          <DriftTabs leftTrail={leftTrail} rightTrail={rightTrail}
            showWork={showWork}
            onClearLeft={() => setLeftTrail([])}
            onClearRight={() => setRightTrail([])}/>

          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium flex-wrap">
            <div className="w-3 h-1 rounded-full bg-indigo-400"/>
            <span>Трейл</span>
            <div className="w-3 h-1 rounded-full bg-red-500 ml-2"/>
            <span>Дрейф</span>
            {showWork && <><div className="w-4 h-px border-t border-dashed border-blue-300 ml-2"/><span>Рабочая зона</span></>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showWork} onChange={e=>setShowWork(e.target.checked)}
              className="w-3.5 h-3.5 accent-primary"/>
            <span className="text-xs font-medium text-neutral-600">
              Показывать рабочую область стиков (вращайте с максимальным отклонением)
            </span>
          </label>

          <p className="text-xs text-neutral-500 font-medium">
            Значения &gt;0,1 (10%) подсвечиваются красным цветом (для выявления дрейфа в центре)
          </p>
        </div>
      </div>

      {!gp.connected && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          Геймпад не подключён: показан демо-режим с нулевыми значениями. Подключите контроллер и нажмите любую кнопку.
        </div>
      )}

      {/* Row 2: Buttons */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300 mb-2">Кнопки</p>
        <ButtonGrid buttons={gp.buttons} />
      </div>

      {/* Row 3: Vibration */}
      <button onClick={onVibrate}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black text-neutral-500 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
        <Vibrate size={13} /> Тест вибрации
      </button>

      {/* Row 4: Text input */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="text-sm font-black text-secondary mb-1">Тест ввода текста</h3>
        <p className="text-xs text-neutral-400 font-medium mb-1">Левый стик: движение — выбор, нажатие (L3) — ввод</p>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              rows={3}
              placeholder="Набирайте текст стиком или введите с клавиатуры…"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-secondary resize-none focus:outline-none focus:border-primary/30"
            />
            <button onClick={()=>setText("")} className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 hover:text-primary transition-colors uppercase tracking-widest">
              <Trash2 size={11}/> Очистить
            </button>
          </div>
          <RadialKeyboard axX={lx} axY={ly} onChar={(ch)=>{
            if (ch==="←") setText(t=>t.slice(0,-1));
            else if (ch==="⏎") setText(t=>t+"\n");
            else setText(t=>t+ch);
          }}/>
        </div>
      </div>
    </div>
  );
}

// ── Drift Tabs (left / right stick) ──────────────────────────────────────────

function DriftTabs({ leftTrail, rightTrail, showWork, onClearLeft, onClearRight }: {
  leftTrail: DriftPoint[]; rightTrail: DriftPoint[];
  showWork: boolean;
  onClearLeft: () => void; onClearRight: () => void;
}) {
  const [tab, setTab] = useState<"left"|"right">("left");
  const trail = tab === "left" ? leftTrail : rightTrail;
  const onClear = tab === "left" ? onClearLeft : onClearRight;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {(["left","right"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              tab===t ? "bg-secondary text-white" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
            }`}>
            {t==="left" ? "Левый стик" : "Правый стик"}
          </button>
        ))}
        <button onClick={onClear} className="ml-auto flex items-center gap-1 text-[9px] font-black text-neutral-400 hover:text-primary transition-colors uppercase tracking-widest">
          <Trash2 size={10}/> Очистить
        </button>
      </div>
      <div className="flex justify-center">
        <DriftCanvas points={trail} showWorkArea={showWork}/>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GamepadTestClient() {
  const [gamepads, setGamepads] = useState<Record<number, GPState>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [supported, setSupported] = useState(true);
  const rafRef = useRef<number | null>(null);

  const poll = useCallback(() => {
    const raw = navigator.getGamepads();
    const next: Record<number, GPState> = {};
    for (const gp of raw) {
      if (!gp) continue;
      next[gp.index] = {
        id: gp.id, index: gp.index, connected: gp.connected,
        buttons: Array.from(gp.buttons).map(b => ({ pressed: b.pressed, value: b.value })),
        axes: Array.from(gp.axes),
      };
    }
    setGamepads(next);
    rafRef.current = requestAnimationFrame(poll);
  }, []);

  useEffect(() => {
    if (!("getGamepads" in navigator)) { setSupported(false); return; }
    rafRef.current = requestAnimationFrame(poll);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [poll]);

  const handleVibrate = (index: number) => {
    const raw = navigator.getGamepads()[index];
    if (!raw) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const act = (raw as any).vibrationActuator;
    act?.playEffect?.("dual-rumble", { startDelay:0, duration:500, weakMagnitude:0.5, strongMagnitude:1 });
  };

  if (!supported) return (
    <div className="bg-white min-h-screen pt-8 pb-24 flex items-center justify-center">
      <div className="text-center"><WifiOff size={40} className="text-neutral-300 mx-auto mb-4"/>
        <p className="text-xl font-black text-secondary mb-2">Gamepad API не поддерживается</p>
        <p className="text-sm text-neutral-400 font-medium">Используйте Chrome, Edge или Firefox последней версии</p>
      </div>
    </div>
  );

  const slots = [0, 1, 2, 3];
  const activeGP = gamepads[activeTab] ?? { ...EMPTY_GP, index: activeTab };

  return (
    <div className="bg-gradient-to-b from-[#f8fafc] to-[#f5f7fb] min-h-screen pt-6 pb-28">
      <div className="container max-w-6xl px-4">

        {/* Hero */}
        <div className="mb-6 space-y-3 rounded-3xl border border-neutral-200 bg-white/90 p-5 shadow-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-primary transition-colors">
            ← Главная
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                <Gamepad2 size={12}/> Диагностика контроллера
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-secondary uppercase leading-none">
                Тест геймпада
              </h1>
            </div>
          </div>
          <p className="text-sm text-neutral-500 font-medium max-w-3xl leading-relaxed">
            Подключите геймпад через USB/Bluetooth и нажмите любую кнопку на нём. Поддерживаются китайские геймпады (установите Motionjoy, драйвер, выберите Xbox 360 Emulator и нажмите Enable).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">1. Подключите геймпад по USB или Bluetooth</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">2. Нажмите любую кнопку для активации в браузере</div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">3. Проверьте стики, триггеры, кнопки и дрейф</div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50/70 border border-blue-100/70 rounded-2xl px-5 py-3 flex items-start gap-3 mb-5">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5"/>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            После подключения нажмите <strong>любую кнопку</strong> на геймпаде — браузер активирует его только после первого нажатия. До 4 контроллеров одновременно.
          </p>
        </div>

        {/* 4 Gamepad Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
          {slots.map(i => {
            const gp = gamepads[i];
            const isActive = i === activeTab;
            return (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`rounded-2xl px-3 py-3 text-left transition-all border ${
                  isActive
                    ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                    : gp?.connected
                    ? "bg-white border-green-200 text-secondary hover:border-green-400"
                    : "bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200"
                }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {gp?.connected
                    ? <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                    : <div className="w-1.5 h-1.5 rounded-full bg-neutral-300"/>
                  }
                  <span className="text-xs font-black uppercase tracking-wider">Геймпад {i+1}</span>
                </div>
                <p className={`text-[10px] font-medium truncate ${isActive ? "text-white/60" : "text-neutral-400"}`}>
                  {gp?.connected ? gp.id.split("(")[0].trim().slice(0,28) : "не определён"}
                </p>
                <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${isActive ? "text-white/70" : gp?.connected ? "text-green-600" : "text-neutral-300"}`}>
                  {gp?.connected ? "Подключен" : "Ожидание"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white border border-neutral-200 rounded-[32px] p-4 md:p-6 shadow-lg shadow-neutral-200/40">
          <GamepadPanel gp={activeGP} onVibrate={() => handleVibrate(activeTab)} />
        </div>

        <p className="text-[10px] text-neutral-300 font-bold text-center mt-8 uppercase tracking-widest">
          Gamepad API · Данные не передаются на сервер
        </p>
      </div>
    </div>
  );
}
