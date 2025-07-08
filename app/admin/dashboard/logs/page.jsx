// FILE: app/admin/dashboard/logs/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Import Button
import { Label } from '@/components/ui/label'; // <<< --- IMPORT LABEL HERE ---
import { LogTable } from '@/components/admin/LogTable'; // Assuming you still use this
import { CalendarIcon, User, Car, Package, Building } from 'lucide-react';

const logSources = ['all', 'main_gate', 'amenity_checkin', 'delivery_point', 'manual_admin'];
const entryTypes = ['all', 'entry', 'exit'];

export default function UnifiedLogsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ source: 'all', type: 'all', date: null });
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchLogs = async () => {
    if (!token || !societyId) { setError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      // TODO: Create/verify GET /api/admin/logs/attendance API endpoint with filters
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/logs/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          societyId,
          source: filters.source === 'all' ? undefined : filters.source,
          type: filters.type === 'all' ? undefined : filters.type,
          date: filters.date ? format(filters.date, 'yyyy-MM-dd') : undefined,
          limit: 100
        }
      });
      // TODO: Ensure API populates necessary fields
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError(err.response?.data?.message || "Could not load logs.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchLogs();
  }, [filters.source, filters.type, filters.date]); // Refetch on filter changes (removed token/societyId as they shouldn't change)

   // Initial fetch
   useEffect(()=>{
     if (token && societyId){
       fetchLogs();
     } else {
       setError("Authentication details missing.");
       setIsLoading(false);
     }
   },[]) // Fetch once on mount

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Skeleton Row Component
  const SkeletonRow = () => (
    <TableRow>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    </TableRow>
    );

  // Get Icon based on source
  const getSourceIcon = (source) => { /* ... same as before ... */ };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Activity Log</h1>
      <ErrorDisplay title="Error" message={error} />

      {/* Filtering UI */}
      <div className="flex flex-wrap items-end gap-4 p-4 border rounded-md bg-card shadow-sm">
         <div className='space-y-1'>
            <Label htmlFor='filter-source' className='text-xs font-medium'>Source</Label> {/* Corrected import used */}
             <Select value={filters.source} onValueChange={(v) => handleFilterChange('source', v)} disabled={isLoading}>
                <SelectTrigger id="filter-source" className="w-[180px] h-9"> <SelectValue placeholder="Filter Source..." /> </SelectTrigger>
                <SelectContent>
                    {logSources.map(s => <SelectItem key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
             </Select>
         </div>
          <div className='space-y-1'>
            <Label htmlFor='filter-type' className='text-xs font-medium'>Type</Label> {/* Corrected import used */}
             <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)} disabled={isLoading}>
                <SelectTrigger id="filter-type" className="w-[120px] h-9"> <SelectValue placeholder="Filter Type..." /> </SelectTrigger>
                <SelectContent>
                    {entryTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
             </Select>
         </div>
          {/* TODO: Implement Date Picker Filter */}
         {/* <div className='space-y-1'> <Label htmlFor='filter-date' className='text-xs'>Date</Label> <Input id="filter-date" type="date" className="w-[180px] h-9"/></div> */}
         <div className='ml-auto'> {/* Push clear button to the right */}
            <Button variant="ghost" size="sm" onClick={() => setFilters({ source: 'all', type: 'all', date: null })} disabled={isLoading}>Clear Filters</Button>
         </div>
      </div>


      {/* Unified Log Table - Using LogTable component */}
      {isLoading ? (
         <div className="border rounded-md p-4 mt-4 space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
      ) : (
        <LogTable logs={logs} logType="attendance" /> // Pass logs and type
      )}
       {/* Or if you keep the table inline: */}
       {/* <div className="border rounded-md"> <Table> ... </Table> </div> */}

    </div>
  );
}