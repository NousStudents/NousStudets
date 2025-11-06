import { Home, Calendar, BookOpen, MessageCircle } from "lucide-react";
import { NavLink } from "./NavLink";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Timetable", path: "/timetable" },
  { icon: BookOpen, label: "Exams", path: "/exams" },
  { icon: MessageCircle, label: "Social", path: "/social" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
