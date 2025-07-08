'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Keep if implementing mobile sidebar
import { Bell, Menu } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "./sidebar" // For mobile SheetContent if used
import { DarkModeToggle } from "../darkModeToggle" // Ensure correct relative path
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios' // Optional: If fetching admin data

// If using mobile sidebar, accept onOpenSidebar prop
export function Navbar(/* { onOpenSidebar } */) {
  const [adminName, setAdminName] = useState('Admin'); // Default or fetch later
  const [adminEmail, setAdminEmail] = useState(''); // Default or fetch later

  // Optional: Fetch admin details on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      const token = Cookies.get('AdminAccessToken');
      if (token) {
        try {
          // Create this API endpoint if you need admin details in navbar
          // const res = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/me`, {
          //    headers: { Authorization: `Bearer ${token}` }
          // });
          // setAdminName(res.data.name);
          // setAdminEmail(res.data.email);
        } catch (error) {
          console.error("Failed to fetch admin data for navbar", error);
          // Handle error, maybe redirect to login if token is invalid
        }
      }
    };
    fetchAdminData();
  }, []);

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center">
         {/* --- Mobile Sidebar Trigger --- */}
         {/* Remove or keep based on whether you need mobile nav */}
         {/* <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onOpenSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
             You'll need to pass an onClose handler here from layout if using Sheet
             <Sidebar isMobile={true} onClose={() => {}} />
          </SheetContent>
        </Sheet> */}
        {/* --- End Mobile Sidebar Trigger --- */}

        <h2 className="text-xl font-semibold text-gray-800 dark:text-white hidden md:block">Admin Dashboard</h2>
         {/* Simple Menu icon for mobile if no Sheet is used */}
         <Button variant="ghost" size="icon" className="md:hidden">
             <Menu className="h-6 w-6" />
         </Button>
      </div>
      <div className="flex items-center space-x-4">
        <DarkModeToggle />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" /> {/* Placeholder for notifications */}
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex items-center space-x-2">
          <Avatar>
            {/* Add admin avatar source if available e.g., <AvatarImage src={adminAvatarUrl} /> */}
            <AvatarFallback>{adminName?.charAt(0)?.toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{adminName}</p>
            {adminEmail && <p className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</p>}
          </div>
        </div>
      </div>
    </header>
  )
}