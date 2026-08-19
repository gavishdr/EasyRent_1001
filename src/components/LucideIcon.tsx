import React from 'react';
import * as Lucide from 'lucide-react';

interface LucideIconProps {
  name: string;
  size?: number;
  className?: string;
  id?: string;
  strokeWidth?: number;
}

export const LucideIcon: React.FC<LucideIconProps> = ({ name, size = 24, className, id, strokeWidth }) => {
  if (!name) return null;

  // Exact lookup
  let IconComponent = (Lucide as any)[name];

  if (!IconComponent) {
    // Normalizations and fallbacks
    const nameMap: Record<string, any> = {
      'Building2': Lucide.Building,
      'Building': Lucide.Building,
      'PieChart': (Lucide as any).PieChart || Lucide.BarChart || Lucide.Circle,
      'BarChart2': (Lucide as any).BarChart2 || Lucide.BarChart || Lucide.Circle,
      'BarChart': Lucide.BarChart || Lucide.Circle,
      'Brush': (Lucide as any).Paintbrush || (Lucide as any).Brush || Lucide.Wrench,
      'CircleEllipsis': (Lucide as any).MoreHorizontal || (Lucide as any).CircleEllipsis || Lucide.Circle,
      'ArrowUpDown': (Lucide as any).ArrowUpDown || (Lucide as any).ArrowDownUp || (Lucide as any).ChevronsUpDown || Lucide.ArrowDown,
      'CalendarDays': (Lucide as any).CalendarDays || Lucide.Calendar,
      'Coins': (Lucide as any).Coins || Lucide.DollarSign || Lucide.Circle,
      'Layers': (Lucide as any).Layers || Lucide.Grid || Lucide.Box,
      'Key': (Lucide as any).Key || Lucide.Lock || Lucide.KeyRound,
      'Landmark': (Lucide as any).Landmark || Lucide.Building || Lucide.Home,
      'Zap': (Lucide as any).Zap || Lucide.Activity,
      'Droplets': (Lucide as any).Droplets || (Lucide as any).Droplet || Lucide.Circle,
      'Flame': (Lucide as any).Flame || Lucide.Sun,
      'Users': Lucide.Users,
      'Shield': (Lucide as any).Shield || (Lucide as any).ShieldCheck,
      'Briefcase': (Lucide as any).Briefcase,
      'Leaf': (Lucide as any).Leaf || Lucide.Sun,
      'FileText': (Lucide as any).FileText || Lucide.File,
      'Receipt': (Lucide as any).Receipt || Lucide.FileText,
      'ShoppingBag': (Lucide as any).ShoppingBag || (Lucide as any).ShoppingBasket || Lucide.Box,
      'Handshake': Lucide.Users,
      'Layout': Lucide.LayoutDashboard,
      'Wind': Lucide.AirVent,
      'RotateCcw': (Lucide as any).RotateCcw || (Lucide as any).RefreshCw || Lucide.RotateCw,
      'Refrigerator': (Lucide as any).Archive || Lucide.Box,
    };

    IconComponent = nameMap[name] || Lucide.Circle;
  }

  if (!IconComponent) {
    return null;
  }

  try {
    return React.createElement(IconComponent, {
      size,
      className,
      id,
      strokeWidth
    });
  } catch (err) {
    console.error('Error rendering icon:', name, err);
    return null;
  }
};
export default LucideIcon;

