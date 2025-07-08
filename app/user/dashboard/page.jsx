// FILE: app/user/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'; // Assuming this exists
import { PackageCheck, Package, Clock, Calendar, MapPin } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Badge } from "@/components/ui/badge";

// --- Pending Delivery Notification Component ---
function PendingDeliveryAlert({ deliveryLog }) {
    const timeAgo = deliveryLog.timestamp ? formatDistanceToNowStrict(new Date(deliveryLog.timestamp), { addSuffix: true }) : 'recently';

    return (
        <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mb-4 shadow-sm">
             <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="font-semibold text-blue-800 dark:text-blue-300">Delivery Waiting!</AlertTitle>
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                {deliveryLog.personName || 'A delivery person'} arrived at {deliveryLog.location || 'the gate'} {timeAgo}.
                {deliveryLog.purpose && ` Purpose: ${deliveryLog.purpose}.`} Please collect your package.
            </AlertDescription>
        </Alert>
    );
}

// --- Skeleton for Delivery Alert ---
const DeliverySkeleton = () => (
    <Alert className="bg-muted mb-4">
         <Skeleton className="h-5 w-5 absolute left-4 top-4 rounded-full"/>
         <div className="ml-7 space-y-1">
            <Skeleton className="h-5 w-1/3" /> {/* Title */}
            <Skeleton className="h-4 w-full" /> {/* Description */}
            <Skeleton className="h-4 w-3/4" />
         </div>
    </Alert>
);

// --- Skeleton for Society Card ---
function SocietyInfoSkeleton() {
  return (
      <Card className="mx-auto overflow-hidden shadow-lg">
        <Skeleton className="h-48 sm:h-64 md:h-80 w-full" />
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/4 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>
  )
}

// --- Error State for Society Card ---
function SocietyInfoErrorState({ message }) {
  return (
      <Card className="max-w-md w-full mx-auto mt-10">
        <CardContent className="p-6 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-semibold mb-2 dark:text-white">Society Info Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{message || "We couldn't fetch the society details."}</p>
        </CardContent>
      </Card>
  )
}


// --- Main Dashboard Page ---
export default function UserDashboardPage() {
    const [pendingDeliveries, setPendingDeliveries] = useState([]);
    const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
    const [deliveryFetchError, setDeliveryFetchError] = useState(null);
    const [societyDetails, setSocietyDetails] = useState(null); // Initialize as null
    const [isLoadingSociety, setIsLoadingSociety] = useState(true);
    const [societyFetchError, setSocietyFetchError] = useState(null);

    const accessToken = Cookies.get('UserAccessToken');
    const societyId = Cookies.get('SocietyId');

    // --- Fetch Pending Deliveries ---
    const fetchPendingDeliveries = async () => {
        if (!accessToken) { setIsLoadingDeliveries(false); return; }
        setIsLoadingDeliveries(true); setDeliveryFetchError(null);
         try {
            // TODO: Ensure GET /api/user/deliveries/pending API exists and works
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/user/deliveries/pending`, { headers: { Authorization: `Bearer ${accessToken}` } });
            setPendingDeliveries(response.data.pendingDeliveries || []);
         } catch (err) {
            console.error("Failed to fetch pending deliveries:", err);
            setDeliveryFetchError(err.response?.data?.error || "Could not check for pending deliveries.");
            setPendingDeliveries([]);
         } finally { setIsLoadingDeliveries(false); }
    };

    // --- Fetch Society Details ---
    const fetchSocietyDetails = async () => {
        // Check if we have the necessary info
        if (!accessToken || !societyId) {
            console.log("[Society Fetch] Missing token or societyId cookie.");
            setSocietyFetchError("Authentication or Society ID missing.");
            setIsLoadingSociety(false);
            return;
        }
        setIsLoadingSociety(true); setSocietyFetchError(null);
        try {
            console.log(`[Society Fetch] Fetching society info for ID: ${societyId}`);
            // Use the existing society endpoint, ensure it handles user auth
            const res = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/society?societyId=${societyId}`, {
                headers: { Authorization: `Bearer ${accessToken}` } // Send USER token
            });
            console.log("[Society Fetch] API Response:", res.data); // Log the response data
            if (res.data && typeof res.data === 'object') { // Check if data is a valid object
                 setSocietyDetails(res.data);
            } else {
                console.error("[Society Fetch] Invalid data format received:", res.data);
                 throw new Error("Received invalid data format for society details.");
            }
        } catch (error) {
            console.error("[Society Fetch] Error:", error.response?.data || error.message);
            setSocietyFetchError(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch society details');
             setSocietyDetails(null); // Clear details on error
        } finally {
            setIsLoadingSociety(false);
        }
    };

    useEffect(() => {
        // Only fetch if token and societyId are available
        if (accessToken && societyId) {
             console.log("[Dashboard Mount] Token and SocietyId found, fetching data...");
             fetchPendingDeliveries();
             fetchSocietyDetails();
        } else {
             console.log("[Dashboard Mount] Token or SocietyId missing on mount.");
             setIsLoadingDeliveries(false); // Stop loading indicators if not logged in
             setIsLoadingSociety(false);
              setSocietyFetchError("Please log in to view dashboard details."); // Optional message for user
        }
        // Optional: Setup polling for deliveries
        // const intervalId = setInterval(fetchPendingDeliveries, 60000);
        // return () => clearInterval(intervalId);
    }, [accessToken, societyId]); // Rerun if token or societyId changes

    return (
        <div className="space-y-6">
            {/* --- Pending Delivery Notifications Area --- */}
            <div className='mb-6'>
                {isLoadingDeliveries ? (
                    <DeliverySkeleton />
                ) : deliveryFetchError ? (
                    <ErrorDisplay title="Delivery Check Error" message={deliveryFetchError} />
                ) : pendingDeliveries.length > 0 ? (
                    <>
                         <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-400">Pending Deliveries at Gate</h2>
                        {pendingDeliveries.map(log => (
                            <PendingDeliveryAlert key={log._id} deliveryLog={log} />
                        ))}
                    </>
                ) : (
                   <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 shadow-sm">
                        <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400"/>
                       <AlertTitle className="font-semibold text-green-800 dark:text-green-300">All Clear!</AlertTitle>
                       <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                            No pending deliveries waiting for you at the gate currently.
                       </AlertDescription>
                   </Alert>
                )}
            </div>
             {/* --- End Pending Delivery Notifications Area --- */}


            <h1 className="text-3xl font-bold">Dashboard</h1>

             {/* --- Society Information Card --- */}
             <div className="mt-6">
                {isLoadingSociety ? (
                    <SocietyInfoSkeleton />
                ) : societyFetchError ? (
                    <SocietyInfoErrorState message={societyFetchError} />
                ) : societyDetails ? ( // Check if societyDetails is truthy
                     <Card className="mx-auto overflow-hidden shadow-lg max-w-4xl"> {/* Added max-w */}
                        <div className="relative h-48 sm:h-64 md:h-72"> {/* Adjusted Height */}
                        {societyDetails.photo ? (
                            <img src={societyDetails.photo} alt={societyDetails.name || 'Society Image'} className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                                <svg className="w-20 h-20 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                            <div className="p-4 sm:p-6">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">{societyDetails.name || 'Society Name'}</h2>
                            <Badge variant="secondary" className="text-xs sm:text-sm bg-white/20 text-white border-white/30 backdrop-blur-sm">Residential Society</Badge>
                            </div>
                        </div>
                        </div>
                        <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3 text-sm sm:text-base">
                                <MapPin className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                                <span className="dark:text-gray-300">{societyDetails.address ? `${societyDetails.address}, ${societyDetails.pincode}` : 'Address not available'}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm sm:text-base">
                                <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                <span className="dark:text-gray-300">Established: {societyDetails.createdAt ? format(new Date(societyDetails.createdAt), 'MMMM d, yyyy') : 'N/A'}</span>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                ) : (
                     // This case handles if not loading, no error, but data is still null/undefined
                     <p className="text-center text-muted-foreground">Society details could not be displayed.</p>
                )}
            </div>
             {/* --- End Society Information Card --- */}


             {/* --- Placeholder for other dashboard widgets --- */}
             <Card className="max-w-4xl mx-auto">
                <CardHeader><CardTitle>My Recent Activity</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">(Your recent bookings, complaints, etc. will show here)</p></CardContent>
            </Card>
        </div>
    );
}
