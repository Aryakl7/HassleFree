// components/admin/sidebar.jsx
'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard, Users, Building, Bell, Briefcase, MessageSquare, UserCheck,
  ClipboardList, Settings, LogOut as LogoutIcon, Construction,
  CalendarCheck, // Added for Bookings
  Package,ShieldCheck  // Added for Deliveries
} from 'lucide-react' // Added new icons

export function Sidebar({ isMobile = false, onClose }) {
  const router = useRouter();

  const LogOut = () => {
    console.log("Admin logging out...");
    Cookies.remove('AdminAccessToken');
    Cookies.remove('SocietyId');
    router.push('/'); // Redirect to home page
  }

  // Updated Menu Items
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/admin/dashboard' },
    { icon: Users, label: 'Residents', href: '/admin/dashboard/users' },
    { icon: Bell, label: 'Announcements', href: '/admin/dashboard/announcements' },
    { icon: Briefcase, label: 'Amenities', href: '/admin/dashboard/amenities' },
    { icon: CalendarCheck, label: 'Bookings', href: '/admin/dashboard/bookings' }, // Added Bookings
    // { icon: Wrench, label: 'Equipment', href: '/admin/dashboard/equipment' }, // Removed Equipment
    { icon: Package, label: 'Deliveries', href: '/admin/dashboard/delivery' }, // Added Deliveries
    { icon: MessageSquare, label: 'Complaints', href: '/admin/dashboard/complaints' },
    { icon: UserCheck, label: 'Guests', href: '/admin/dashboard/guests' },
    { icon: Construction, label: 'Workers', href: '/admin/dashboard/workers' },
    { icon: ClipboardList, label: 'Logs', href: '/admin/dashboard/logs' }, // Kept Logs (can filter within)
    { icon: ShieldCheck, label: 'Gate Operations', href: '/admin/dashboard/gate-ops' },
    { icon: Building, label: 'Society Info', href: '/admin/dashboard/society' },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h1>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start"
              asChild
              onClick={isMobile ? onClose : undefined}
            >
              <Link href={item.href} className="flex items-center w-full">
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
         <Button variant="ghost" className="w-full justify-start" asChild>
           <Link href="/admin/dashboard/settings" className="flex items-center w-full">
             <Settings className="mr-2 h-4 w-4" />
             Settings
           </Link>
        </Button>
        <Button
          onClick={LogOut}
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
        >
          <LogoutIcon className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}