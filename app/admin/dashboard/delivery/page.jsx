// FILE: app/admin/dashboard/delivery/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Keep for potential future actions
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { Input } from '@/components/ui/input'; // For filtering
import { Package, User, Home, Clock, Building, Car } from 'lucide-react'; // Icons

export default function ManageDeliveriesPage() {
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search
  const [filteredLogs, setFilteredLogs] = useState([]); // State for filtered results

  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchDeliveryLogs = async () => {
    if (!token || !societyId) { setError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      // Fetch AttendanceLog entries specifically marked as 'delivery_point' source
      // TODO: Create GET /api/admin/logs/delivery API endpoint (or use attendance with filter)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/logs/delivery`, { // Or /api/admin/logs/attendance?source=delivery_point
        headers: { Authorization: `Bearer ${token}` },
        params: { societyId, limit: 200 } // Fetch recent delivery logs
      });
      // TODO: Ensure API populates userId.name/.houseNo/.flatNo and verifiedBy.name
      setDeliveryLogs(response.data.logs || []);
      setFilteredLogs(response.data.logs || []); // Initialize filtered list
    } catch (err) {
      console.error("Failed to fetch delivery logs:", err);
      setError(err.response?.data?.message || "Could not load delivery logs.");
      setDeliveryLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryLogs();
  }, []); // Fetch on initial mount

  // Filtering logic based on search term
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    setFilteredLogs(
      deliveryLogs.filter(log =>
        log.personName?.toLowerCase().includes(lowerSearch) ||
        log.purpose?.toLowerCase().includes(lowerSearch) || // Search purpose (e.g., company name)
        log.userId?.name?.toLowerCase().includes(lowerSearch) || // Search resident name
        log.userId?.houseNo?.toLowerCase().includes(lowerSearch) ||
        log.userId?.flatNo?.toLowerCase().includes(lowerSearch) ||
        log.vehicleNumber?.toLowerCase().includes(lowerSearch)
      )
    );
  }, [searchTerm, deliveryLogs]);

  // Skeleton Row Component
  const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell> {/* Timestamp */}
        <TableCell><Skeleton className="h-5 w-28" /></TableCell> {/* Person Name */}
        <TableCell><Skeleton className="h-5 w-24" /></TableCell> {/* Purpose/Company */}
        <TableCell><Skeleton className="h-5 w-32" /></TableCell> {/* Resident */}
        <TableCell><Skeleton className="h-5 w-20" /></TableCell> {/* Address */}
        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell> {/* Type */}
        <TableCell><Skeleton className="h-5 w-20" /></TableCell> {/* Vehicle */}
        <TableCell><Skeleton className="h-5 w-24" /></TableCell> {/* Guard */}
        {/* Add Cell for Check-out Button Placeholder if needed */}
        {/* <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell> */}
    </TableRow>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center"><Package className='mr-2 h-7 w-7'/> Manage Deliveries</h1>
        <Input
            type="text"
            placeholder="Search deliveries (name, company, resident...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-full sm:max-w-sm"
        />
        {/* Optional: Add Button for "Manual Delivery Entry" if needed */}
      </div>

      <ErrorDisplay title="Loading Error" message={error} />

      {/* Delivery Log Table */}
      <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Clock className='inline-block h-4 w-4 mr-1'/> Timestamp</TableHead>
                <TableHead><User className='inline-block h-4 w-4 mr-1'/> Delivery Person</TableHead>
                <TableHead>Purpose / Company</TableHead>
                <TableHead><Home className='inline-block h-4 w-4 mr-1'/> To Resident</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead><Car className='inline-block h-4 w-4 mr-1'/> Vehicle</TableHead>
                <TableHead>Guard</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center h-24">No delivery logs found matching criteria.</TableCell></TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                    <TableCell className='font-medium'>{log.personName || 'N/A'}</TableCell>
                    <TableCell>{log.purpose || 'N/A'}</TableCell>
                    <TableCell>{log.userId?.name || 'N/A'}</TableCell> {/* Requires Population */}
                    <TableCell className='text-xs'>{log.userId ? `H:${log.userId.houseNo}, F:${log.userId.flatNo}`: 'N/A'}</TableCell> {/* Requires Population */}
                    <TableCell><Badge variant={log.type === 'entry' ? 'default' : 'secondary'}>{log.type}</Badge></TableCell>
                    <TableCell className='font-mono'>{log.vehicleNumber || '-'}</TableCell>
                    <TableCell>{log.verifiedBy?.name || '-'}</TableCell> {/* Requires Population */}
                    {/* Optional: Add Actions like "Mark Exited" if needed */}
                    {/* <TableCell className="text-right">
                        {log.type === 'entry' && !deliveryHasExited(log) && ( // Need logic to check exit
                             <Button size="sm" variant="outline" onClick={() => handleMarkExit(log._id)}>Mark Exit</Button>
                         )}
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}