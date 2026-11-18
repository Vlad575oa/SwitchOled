"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  HelpCircle,
  LogOut,
  ExternalLink,
  Layers,
  Menu,
  X,
  Scale,
  MessageSquare,
  Palette,
  BarChart3,
  Eye,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: boolean;
  badgeType?: "orders" | "chat";
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Продажи",
    items: [
      { label: "Дашборд", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Заказы", href: "/admin/orders", icon: ShoppingBag, badge: true, badgeType: "orders" },
      { label: "Заказы в 1 клик", href: "/admin/quick-orders", icon: PhoneCall },
      { label: "Аналитика", href: "/admin/analytics", icon: Eye },
    ],
  },
  {
    title: "Каталог",
    items: [
      { label: "Товары", href: "/admin/products", icon: Package },
      { label: "Цвета", href: "/admin/colors", icon: Palette },
      { label: "Сравнение цен", href: "/admin/price-compare", icon: BarChart3 },
    ],
  },
  {
    title: "Контент",
    items: [
      { label: "Блог", href: "/admin/posts", icon: FileText },
      { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
      { label: "Страницы", href: "/admin/pages", icon: Layers },
      { label: "Правовые", href: "/admin/legal", icon: Scale },
    ],
  },
  {
    title: "Клиенты",
    items: [{ label: "Поддержка", href: "/admin/chat", icon: MessageSquare, badge: true, badgeType: "chat" }],
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const playNotification = () => {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch(() => {
          // Silent catch for browser autoplay blocks
          console.log("Autoplay blocked - sound notification skipped");
        });
      } catch (err) {
        console.error("Failed to play notification sound:", err);
      }
    };

    const fetchCounts = async () => {
      try {
        // Chat
        const chatRes = await fetch("/api/admin/chat/sessions");
        if (chatRes.ok) {
          const data = await chatRes.json();
          const total = data.reduce((acc: number, s: { unreadCount: number }) => acc + s.unreadCount, 0);
          if (total > unreadChatCount && mounted) playNotification();
          setUnreadChatCount(total);
        }

        // Orders
        const ordersRes = await fetch("/api/admin/orders/count");
        if (ordersRes.ok) {
          const { count } = await ordersRes.json();
          if (count > pendingOrdersCount && mounted) playNotification();
          setPendingOrdersCount(count);
        }
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [unreadChatCount, pendingOrdersCount, mounted]);

  const nav = (
    <>
      <div className="px-5 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="w-[18px] h-[18px] rounded-full border-[4.5px] border-black" />
          <span className="text-[16px] font-semibold tracking-[-0.01em] text-black">Switch OLED</span>
          <span className="rounded-md bg-black/[0.06] px-1.5 py-0.5 text-[11px] text-black/55">admin</span>
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="lg:hidden text-black/60" aria-label="Закрыть меню">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[12px] text-black/40">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const count = item.badgeType === "chat" ? unreadChatCount : pendingOrdersCount;
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] transition-colors",
                      active ? "bg-black text-white" : "text-black/70 hover:text-black hover:bg-black/[0.05]"
                    )}
                  >
                    <item.icon size={17} strokeWidth={1.8} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {mounted && item.badge && count > 0 && (
                      <span
                        className={cn(
                          "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center",
                          active ? "bg-white text-black" : "bg-black text-white"
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-black/[0.07] space-y-0.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] text-black/70 hover:text-black hover:bg-black/[0.05] transition-colors"
        >
          <ExternalLink size={17} strokeWidth={1.8} />
          <span>Открыть сайт</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 h-10 px-3 rounded-xl text-[14px] text-black/70 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Выйти</span>
        </button>
      </div>
    </>
  );

  const total = (mounted ? pendingOrdersCount + unreadChatCount : 0);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur border-b border-black/[0.07] flex items-center justify-between px-4">
        <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 text-[15px] font-medium text-black" aria-label="Открыть меню">
          <Menu size={20} /> Меню
          {total > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-black text-white text-[11px] flex items-center justify-center">{total}</span>}
        </button>
        <span className="text-[15px] font-semibold text-black">Switch OLED</span>
      </div>
      <div className="lg:hidden h-14 shrink-0" />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-2xl">{nav}</aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[248px] h-screen sticky top-0 bg-white flex-col flex-shrink-0 border-r border-black/[0.06]">
        {nav}
      </aside>
    </>
  );
};
