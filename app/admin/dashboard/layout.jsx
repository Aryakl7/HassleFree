'use client'

import { useState } from 'react'
import { Sidebar } from "@/components/admin/sidebar"
import { Navbar } from "@/components/admin/navbar"

export default function AdminDashboardLayout({ children }) {
  // You might want state for mobile sidebar toggling like the user layout
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar /> {/* Add mobile toggle if needed */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
