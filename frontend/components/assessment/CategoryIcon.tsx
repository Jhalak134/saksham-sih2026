// components/assessment/CategoryIcon.tsx
// Pure mapping from Category string to a Lucide icon element.
// Zero business logic — just icon selection.
import React from 'react';
import {
  Milk,
  Scissors,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  Sprout,
  Paintbrush,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/lib/constants';

const ICON_MAP: Record<Category, LucideIcon> = {
  Dairy: Milk,
  Textiles: Scissors,
  Retail: ShoppingBag,
  'Food Processing': UtensilsCrossed,
  Logistics: Truck,
  Agriculture: Sprout,
  Handicrafts: Paintbrush,
  Education: BookOpen,
};

interface CategoryIconProps {
  category: Category;
  size?: number;
  className?: string;
}

export function CategoryIcon({
  category,
  size = 22,
  className,
}: CategoryIconProps): React.JSX.Element {
  const Icon = ICON_MAP[category];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" className={className} />;
}
