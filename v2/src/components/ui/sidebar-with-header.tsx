import { useState, type ReactNode } from 'react';
import { Menu, X, ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import Browser from 'webextension-polyfill';
import { cn } from '~/lib/utils';
import { Button } from './button';

export interface SideBarItem {
  label: string;
  icon: IconType | LucideIcon;
  href: string;
}

export interface HeadBarItem {
  label: string;
  subLabel?: string;
  children?: Array<HeadBarItem>;
  href?: string;
  icon: IconType | LucideIcon;
}

export default function SidebarWithHeader({
  children,
  title,
  headBarItems,
  sideBarItems,
}: {
  title?: string;
  sideBarItems: SideBarItem[];
  headBarItems: HeadBarItem[];
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100",
        isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-20 items-center justify-between px-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <nav className="mt-5 px-3">
            {sideBarItems.map((item) => (
              <NavItem 
                key={item.label} 
                icon={item.icon} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.label}
              </NavItem>
            ))}
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="mr-2 h-8 w-8 md:hidden"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <DesktopNav headBarItems={headBarItems} />
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[240px_1fr] h-[calc(100vh-4rem)]">
          <aside className="border-r bg-background">
            <nav className="grid gap-1 p-4">
              {sideBarItems.map((item) => (
                <NavItem 
                  key={item.label} 
                  icon={item.icon} 
                  href={item.href}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>
          </aside>
          <main className="overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile content */}
      <div className="md:hidden p-4">
        {children}
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: IconType | LucideIcon;
  href: string;
  children: string;
  onClick?: () => void;
}

function NavItem({ icon: Icon, href, children, onClick }: NavItemProps) {
  const isExternal = href.startsWith('http') || href.includes('.html');
  
  const handleClick = () => {
    if (isExternal) {
      void Browser.tabs.create({ url: href });
      onClick?.();
      return;
    }
    onClick?.();
  };

  return (
    <Link
      to={isExternal ? '#' : href}
      onClick={handleClick}
      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      {/* @ts-ignore - Using both react-icons and lucide-react icons */}
      <Icon className="mr-3 h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}

function DesktopNav({ headBarItems }: { headBarItems: HeadBarItem[] }) {
  return (
    <div className="hidden md:flex md:space-x-4">
      {headBarItems.map((navItem) => (
        <div key={navItem.label} className="relative group">
          <Button
            variant="ghost"
            className="flex items-center text-sm font-medium"
            onClick={() => {
              if (navItem.href) {
                if (navItem.href.startsWith('http') || navItem.href.includes('.html')) {
                  void Browser.tabs.create({ url: navItem.href });
                }
              }
            }}
          >
            {/* @ts-ignore - Using both react-icons and lucide-react icons */}
            <navItem.icon className="mr-2 h-4 w-4" />
            {navItem.label}
          </Button>
          {navItem.children && (
            <div className="absolute left-0 mt-2 w-60 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-1">
                {navItem.children.map((child) => (
                  <DesktopSubNav key={child.label} {...child} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DesktopSubNav({ label, href, subLabel }: HeadBarItem) {
  return (
    <Link
      to={href || '#'}
      onClick={() => {
        if (href && (href.startsWith('http') || href.includes('.html'))) {
          void Browser.tabs.create({ url: href });
        }
      }}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{label}</p>
          {subLabel && <p className="mt-1 text-xs text-gray-500">{subLabel}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </Link>
  );
}
