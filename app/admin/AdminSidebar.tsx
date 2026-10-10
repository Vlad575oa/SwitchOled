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
  ChevronRight,
  Scale,
  MessageSquare,
  Palette,
  BarChart3,
  Eye,
  PhoneCall,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Дашборд", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Товары", href: "/admin/products", icon: Package },
  { label: "Заказы", href: "/admin/orders", icon: ShoppingBag, badge: true, badgeType: "orders" },
  { label: "Заказы в 1 клик", href: "/admin/quick-orders", icon: PhoneCall },
  { label: "Аналитика", href: "/admin/analytics", icon: Eye },
  { label: "Яндекс Директ", href: "/admin/yandex", icon: Target },
  { label: "Сравнение цен", href: "/admin/price-compare", icon: BarChart3 },
  { label: "Цвета", href: "/admin/colors", icon: Palette },
  { label: "Блог", href: "/admin/posts", icon: FileText },
  { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
  { label: "Поддержка", href: "/admin/chat", icon: MessageSquare, badge: true, badgeType: "chat" },
  { label: "Страницы", href: "/admin/pages", icon: Layers },
  { label: "Правовые", href: "/admin/legal", icon: Scale },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [mounted, setMounted] = useState(false);

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

  return (
    <aside className="w-[240px] min-h-screen bg-[#111827] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-black text-sm italic">N</span>
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight leading-none">Gameshop24</p>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 px-3 mb-3">Управление</p>
        {navItems.map((item) => {
          const count = item.badgeType === "chat" ? unreadChatCount : pendingOrdersCount;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
                isActive(item)
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  "flex-shrink-0 transition-colors",
                  isActive(item) ? "text-primary" : "text-neutral-500 group-hover:text-neutral-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {mounted && item.badge && count > 0 && (
                <span className={cn(
                  "w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center",
                  item.badgeType === "orders" ? "bg-orange-500 text-white" : "bg-primary text-white"
                )}>
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {isActive(item) && !(item.badge && count > 0) && <ChevronRight size={12} className="text-neutral-500" />}
            </Link>
          );
        })}
      </nav>


      {/* Bottom */}
      <div className="px-3 pb-5 space-y-1 border-t border-white/5 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink size={16} />
          <span>Открыть сайт</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={16} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
};
