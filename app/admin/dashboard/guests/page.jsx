// FILE: app/admin/dashboard/guests/page.jsx (Refactored)
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
import { Check, X, Clock, LogIn, LogOut, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'; // Import spinner

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700", icon: Clock },
  approved: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700", icon: Check },
  rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700", icon: Ban },
  "checked-in": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700", icon: LogIn },
  "checked-out": { color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600", icon: LogOut },
};


export default function ManageGuestsPage() {
  const [allGuests, setAllGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // Track which guest is being updated
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // Default to pending
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchGuests = async () => {
    if (!token || !societyId) { setError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      // Fetch ALL guests for the society
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/guests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { societyId } // Send societyId
      });
      setAllGuests(response.data.guests || []);
    } catch (err) {
      console.error("Failed to fetch guests:", err);
      setError(err.response?.data?.message || "Could not load guests.");
      setAllGuests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter guests whenever allGuests or activeTab changes
  useEffect(() => {
    setError(null); // Clear error when changing tabs
    if (activeTab === 'all') {
      setFilteredGuests(allGuests);
    } else {
      setFilteredGuests(allGuests.filter(g => g.status === activeTab));
    }
  }, [allGuests, activeTab]);

  // Initial fetch
  useEffect(() => {
    fetchGuests();
  }, []); // Fetch only once on initial mount

  const updateGuestStatus = async (guestId, newStatus) => {
    setIsUpdating(guestId); // Set loading state for this specific guest
    setError(null);
    try {
      // Call the specific status update endpoint
      await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/guests/${guestId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Success", description: `Guest status updated.` });
      fetchGuests(); // Re-fetch all guests to get updated list
    } catch (err) {
      console.error("Failed to update guest status:", err);
       const errorMsg = err.response?.data?.message || "Could not update guest status.";
       setError(errorMsg); // Set error state
       toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsUpdating(null); // Clear loading state for this guest
    }
  };

   const SkeletonRow = () => ( <TableRow>
    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
    <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
  </TableRow> );

  const renderGuestTable = (guestList) => (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Resident</TableHead><TableHead>Date</TableHead>
            <TableHead>Status</TableHead><TableHead>Car No.</TableHead><TableHead>Valid Until</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? ( // Show skeleton only if the main fetch is loading
             <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
          ) : guestList.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center h-24">No guests found for this status.</TableCell></TableRow>
          ) : (
            guestList.map((guest) => {
               const config = statusConfig[guest.status] || statusConfig.pending;
               const Icon = config.icon;
               const updatingThisGuest = isUpdating === guest._id; // Check if this guest is being updated
               return (
                  <TableRow key={guest._id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    {/* Ensure userId is populated with name */}
                    <TableCell>{guest.userId?.name || guest.userId || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(guest.date), 'PP')}</TableCell>
                    <TableCell><Badge variant="outline" className={`${config.color} border-current`}><Icon className="h-3 w-3 mr-1" />{guest.status}</Badge></TableCell>
                    <TableCell>{guest.carNo || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(guest.validUntil), 'PP')}</TableCell>
                    <TableCell className="text-right space-x-2">
                        {guest.status === 'pending' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => updateGuestStatus(guest._id, 'approved')} disabled={updatingThisGuest}>
                                {updatingThisGuest ? <LoadingSpinner size={16}/> : <Check className="h-4 w-4 mr-1" />} Approve
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => updateGuestStatus(guest._id, 'rejected')} disabled={updatingThisGuest}>
                                 {updatingThisGuest ? <LoadingSpinner size={16}/> : <Ban className="h-4 w-4 mr-1" />} Reject
                            </Button>
                        </>
                        )}
                         {/* Optional manual check-in/out for approved guests */}
                         {guest.status === 'approved' && (
                             <Button variant="secondary" size="sm" onClick={() => updateGuestStatus(guest._id, 'checked-in')} disabled={updatingThisGuest}>
                                  {updatingThisGuest ? <LoadingSpinner size={16}/> : <LogIn className="h-4 w-4 mr-1"/>} Check-In
                            </Button>
                         )}
                         {/* Optional manual check-out for checked-in guests */}
                         {guest.status === 'checked-in' && (
                             <Button variant="secondary" size="sm" onClick={() => updateGuestStatus(guest._id, 'checked-out')} disabled={updatingThisGuest}>
                                  {updatingThisGuest ? <LoadingSpinner size={16}/> : <LogOut className="h-4 w-4 mr-1"/>} Check-Out
                            </Button>
                         )}
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
      <h1 className="text-3xl font-bold">Manage Guest Entries</h1>
      <ErrorDisplay title="Error" message={error} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="checked-in">Checked In</TabsTrigger>
          <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
          {/* <TabsTrigger value="rejected">Rejected</TabsTrigger> */}
        </TabsList>

        {/* Render table based on filteredGuests derived from allGuests */}
        <TabsContent value={activeTab}>
            {renderGuestTable(filteredGuests)}
        </TabsContent>

      </Tabs>
    </div>
  )
}
