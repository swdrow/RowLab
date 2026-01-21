import { NavLink } from 'react-router-dom';
import { House, Users, DotsThree, Boat } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

interface MobileDockProps {
  onMoreClick?: () => void;
}

interface NavItem {
  icon: Icon;
  path?: string;
  label: string;
  onClick?: () => void;
}

const navItems: NavItem[] = [
  { icon: House, path: '/app', label: 'Home' },
  { icon: Boat, path: '/app/lineup', label: 'Lineup' },
  { icon: Users, path: '/app/athletes', label: 'Athletes' },
];

export function MobileDock({ onMoreClick }: MobileDockProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-void-surface/90 backdrop-blur-xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path!}
            end={item.path === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-blade-blue' : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] uppercase tracking-wider font-medium">
              {item.label}
            </span>
          </NavLink>
        ))}

        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-text-muted hover:text-text-secondary transition-colors"
        >
          <DotsThree size={20} />
          <span className="text-[10px] uppercase tracking-wider font-medium">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}

export default MobileDock;
