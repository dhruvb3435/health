'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSubscription } from '@/hooks/use-subscription';
import {
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  UserSquare2,
  ClipboardList,
  Wallet,
  FlaskConical,
  Stethoscope,
  Clock,
  UserPlus,
  Package,
  Building2,
  Microscope,
  DollarSign,
  Shield,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'dashboard' },
  { href: '/patients', label: 'Patients', icon: Users, feature: 'patients' },
  { href: '/appointments', label: 'Appointments', icon: Calendar, feature: 'appointments' },
  { href: '/doctors', label: 'Doctors', icon: UserSquare2, feature: 'doctors' },
  { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList, feature: 'prescriptions' },
  { href: '/billing', label: 'Billing', icon: Wallet, feature: 'billing' },
  { href: '/laboratory', label: 'Laboratory', icon: FlaskConical, feature: 'laboratory' },
  { href: '/radiology', label: 'Radiology', icon: Microscope, feature: 'radiology' },
  { href: '/staff', label: 'Staff', icon: Stethoscope, feature: 'staff' },
  { href: '/opd-queue', label: 'OPD Queue', icon: Clock, feature: 'opd-queue' },
  { href: '/admissions', label: 'Admissions', icon: UserPlus, feature: 'admissions' },
  { href: '/inventory', label: 'Inventory', icon: Package, feature: 'inventory' },
  { href: '/wards', label: 'Wards', icon: Building2, feature: 'wards' },
  { href: '/operation-theater', label: 'Operation Theater', icon: Microscope, feature: 'operation-theater' },
  { href: '/accounts', label: 'Accounts', icon: DollarSign, feature: 'accounts' },
  { href: '/compliance', label: 'Compliance', icon: Shield, feature: 'compliance' },
  { href: '/notifications', label: 'Notifications', icon: Bell, feature: 'notifications' },
  { href: '/settings', label: 'Settings', icon: Settings, feature: 'settings' },
  { href: '/help', label: 'Help & Support', icon: HelpCircle, feature: 'help' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { hasFeature } = useSubscription();

  const filteredItems = NAV_ITEMS.filter((item) => hasFeature(item.feature));

  return (
    <nav className="space-y-1.5">
      {filteredItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1'
                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`}
              />
              <span>{item.label}</span>
            </div>
            {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
          </Link>
        );
      })}
    </nav>
  );
}
