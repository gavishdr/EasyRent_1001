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
  // Map alternative names or handle safety fallback
  let IconComponent = (Lucide as any)[name];

  if (!IconComponent) {
    // Fallback normalizations
    if (name === 'Handshake') IconComponent = Lucide.Users;
    else if (name === 'Layout') IconComponent = Lucide.LayoutDashboard;
    else if (name === 'Wind') IconComponent = Lucide.AirVent;
    else if (name === 'Refrigerator') IconComponent = (Lucide as any).Archive || Lucide.Box;
    else IconComponent = Lucide.Circle;
  }

  return React.createElement(IconComponent, {
    size,
    className,
    id,
    strokeWidth
  });
};
export default LucideIcon;
