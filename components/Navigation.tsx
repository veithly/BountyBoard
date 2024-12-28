import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Navigation({ mobile, onClose }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: '/boards', label: 'All Boards' },
    { href: '/boards/joined', label: 'My Boards' },
    { href: '/boards/create', label: 'Create Board' },
  ];

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "relative px-3 py-2 transition-colors hover:text-purple-300",
          mobile ? "block w-full text-left text-base" : "text-sm",
          isActive
            ? "text-purple-300 font-medium"
            : "text-muted-foreground hover:text-purple-300"
        )}
      >
        {label}
        {isActive && (
          <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-purple-500/0 via-purple-500/70 to-purple-500/0" />
        )}
      </Link>
    );
  };

  return (
    <nav className={cn(
      "flex",
      mobile ? "flex-col space-y-2" : "items-center space-x-4"
    )}>
      {links.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}
