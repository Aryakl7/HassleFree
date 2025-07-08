// app/admin/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard"; // Import custom component
import { ErrorDisplay } from "@/components/shared/ErrorDisplay"; // Import custom component
import { Users, Bell, MessageSquare, Building } from "lucide-react";
import Link from 'next/link'; // For quick actions

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState(null); // Initialize as null
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token || !societyId) {
        setError("Admin token or Society ID missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Create this API endpoint
        // const response = await axios.get(`/api/admin/dashboard/stats?societyId=${societyId}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // setStats(response.data); // Assuming API returns { users: 150, pendingComplaints: 5, ... }

        // --- Mock Data for Testing ---
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setStats({
            totalResidents: 150,
            pendingComplaints: 5,
            amenitiesBookedToday: 12,
            recentAnnouncements: 3
        });
        // --- End Mock Data ---

      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError(err.response?.data?.message || "Could not load dashboard statistics.");
        setStats(null); // Clear stats on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token, societyId]); // Re-fetch if token/societyId changes

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      <ErrorDisplay message={error} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Residents"
          value={stats?.totalResidents}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        //   description="+5 since last month" // Optional
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Complaints"
          value={stats?.pendingComplaints}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          description="Requires attention"
          isLoading={isLoading}
        />
        <StatCard
          title="Amenities Booked Today"
          value={stats?.amenitiesBookedToday}
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        //   description="Today"
          isLoading={isLoading}
        />
         <StatCard
          title="Recent Announcements"
          value={stats?.recentAnnouncements}
          icon={<Bell className="h-4 w-4 text-muted-foreground" />}
          description="In the last 7 days"
          isLoading={isLoading}
        />
      </div>

      {/* Add more sections like recent activity, charts, quick links etc. */}
       <div className="grid gap-4 md:grid-cols-2">
         <Card>
             <CardHeader>
               <CardTitle>Quick Actions</CardTitle>
             </CardHeader>
             <CardContent className="space-y-2">
                <Link href="/admin/dashboard/users" className="text-primary hover:underline block">Manage Residents</Link>
                <Link href="/admin/dashboard/complaints" className="text-primary hover:underline block">View Complaints</Link>
                <Link href="/admin/dashboard/announcements" className="text-primary hover:underline block">Create Announcement</Link>
             </CardContent>
         </Card>
         <Card>
            <CardHeader>
               <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
             <CardContent>
               <p className="text-muted-foreground"> (Activity log feature coming soon...)</p>
             </CardContent>
         </Card>
       </div>
    </div>
  )
}