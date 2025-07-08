// FILE: app/admin/dashboard/bookings/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
// Icons representing the *status*
import { CheckCheck, Clock, Ban, User as CheckedInIcon, CalendarDays as CheckedOutIcon, AlertCircle } from "lucide-react";
// Icons representing the *action*
import { LogIn as CheckInIcon, LogOut as CheckOutIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const statusConfig = {
  pending: { color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700", icon: CheckCheck },
  approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700", icon: CheckCheck },
  cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700", icon: Ban },
  'checked-in': { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700", icon: CheckedInIcon },
  'checked-out': { color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600", icon: CheckedOutIcon },
  completed: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700", icon: CheckCheck },
  no_show: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700", icon: Ban },
};

export default function ManageBookingsPage() {
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // Track which booking ID is being updated
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('confirmed'); // Default tab
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchBookings = async () => {
    // ... (Fetch logic using GET /api/admin/bookings - provided previously) ...
    if (!token || !societyId) { setError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/bookings`, {
            headers: { Authorization: `Bearer ${token}` }, params: { societyId }
        });
        setAllBookings(response.data.bookings || []);
    } catch (err) { setError(err.response?.data?.message || "Could not load bookings."); setAllBookings([]); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []); // Initial fetch

  useEffect(() => { // Client-side filtering
    setError(null);
    let listToShow = [];
    if (activeTab === 'all') {
        // 'All' could mean all *active/upcoming* non-historical ones
        listToShow = allBookings.filter(b => !['checked-out', 'completed', 'cancelled', 'no_show'].includes(b.status));
    } else if (activeTab === 'history') {
         listToShow = allBookings.filter(b => ['checked-out', 'completed', 'cancelled', 'no_show'].includes(b.status));
    } else {
        listToShow = allBookings.filter(b => b.status === activeTab);
    }
     // Optional: Sort by date/time
     listToShow.sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate) || a.startTime.localeCompare(b.startTime));
    setFilteredBookings(listToShow);
  }, [allBookings, activeTab]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    setIsUpdating(bookingId); setError(null);
    try {
      // Call the dedicated status update endpoint
      await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Success", description: `Booking status updated.` });
      fetchBookings(); // Re-fetch all bookings
    } catch (err) {
      console.error("Failed to update booking status:", err);
       const errorMsg = err.response?.data?.message || "Could not update booking status.";
       setError(errorMsg);
       toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

   const SkeletonRow = () => ( <TableRow>
    <TableCell><Skeleton className="h-5 w-24" /></TableCell> {/* Amenity Name */}
    <TableCell><Skeleton className="h-5 w-32" /></TableCell> {/* User Name */}
    <TableCell><Skeleton className="h-5 w-24" /></TableCell> {/* Date */}
    <TableCell><Skeleton className="h-5 w-28" /></TableCell> {/* Time */}
    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell> {/* Status Badge */}
    <TableCell className="text-right space-x-2">
        <Skeleton className="h-8 w-16 inline-block" /> {/* Action Buttons Placeholder */}
        {/* <Skeleton className="h-8 w-8 inline-block" />  If using icon buttons */}
    </TableCell>
 </TableRow> );

  const renderBookingTable = (bookingList) => (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amenity</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead>
            <TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && !bookingList.length ? (
             <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
          ) : bookingList.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center h-24">No bookings found for this status.</TableCell></TableRow>
          ) : (
            bookingList.map((booking) => {
               const config = statusConfig[booking.status] || statusConfig.pending;
               const Icon = config.icon;
               const canCheckIn = ['confirmed', 'approved'].includes(booking.status);
               const canCheckOut = booking.status === 'checked-in';
               const updatingThis = isUpdating === booking._id;
               return (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">{booking.amenityId?.name || booking.amenityId?.toString() || 'N/A'}</TableCell> {/* Requires population */}
                    <TableCell>{booking.userId?.name || booking.userId?.toString() || 'N/A'}</TableCell> {/* Requires population */}
                    <TableCell>{format(new Date(booking.bookingDate), 'PP')}</TableCell>
                    <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                    <TableCell><Badge variant="outline" className={`${config.color} border-current`}><Icon className="h-3 w-3 mr-1" />{booking.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                        {canCheckIn && ( // Show Check-In button if booking is confirmed/approved
                            <Button variant="outline" size="sm" onClick={() => updateBookingStatus(booking._id, 'checked-in')} disabled={updatingThis} title="Manual Check-In">
                                {updatingThis ? <LoadingSpinner size={16}/> : <CheckInIcon className="h-4 w-4" />}
                            </Button>
                        )}
                        {canCheckOut && ( // Show Check-Out button if checked-in
                             <Button variant="secondary" size="sm" onClick={() => updateBookingStatus(booking._id, 'checked-out')} disabled={updatingThis} title="Manual Check-Out">
                                 {updatingThis ? <LoadingSpinner size={16}/> : <CheckOutIcon className="h-4 w-4" />}
                             </Button>
                        )}
                        {/* Add other potential actions like Cancel or Mark No-Show */}
                         {/* {['pending', 'confirmed', 'approved'].includes(booking.status) && (
                            <Button variant="destructive" size="icon" onClick={() => updateBookingStatus(booking._id, 'cancelled')} disabled={updatingThis} title="Cancel Booking"> <Ban className="h-4 w-4"/> </Button>
                         )} */}
                    </TableCell>
                  </TableRow>
               );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Amenity Bookings</h1>
      <ErrorDisplay title="Error" message={error} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4"> {/* Adjust cols */}
          <TabsTrigger value="all">Upcoming</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger> {/* Or Approved */}
          <TabsTrigger value="checked-in">Checked In</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger> {/* Combined past statuses */}
        </TabsList>

        {/* Render table based on filtered list */}
        <TabsContent value={activeTab}>
            {renderBookingTable(filteredBookings)}
        </TabsContent>

      </Tabs>
    </div>
  )
}