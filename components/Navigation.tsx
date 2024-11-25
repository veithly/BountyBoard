import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Public Boards', path: '/boards' },
  { name: 'Joined Boards', path: '/boards/joined' }
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-6 ml-8">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-all duration-300",
            "hover:text-purple-400",
            pathname === item.path ?
              "text-purple-400 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-purple-400 after:to-purple-600" :
              "text-gray-400"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}