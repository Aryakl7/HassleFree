// FILE: app/admin/dashboard/complaints/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, CheckCheck, HardHat, Wrench as MaterialIcon, Clock, AlertCircle as PendingIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplaintDetailDialog } from '@/components/admin/ComplaintDetailDialog';
import { AssignWorkerDialog } from '@/components/admin/AssignWorkerDialog'; // This is the corrected component
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
  assigned: { icon: HardHat, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
  'in-progress': { icon: HardHat, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700" },
  material_needed: { icon: MaterialIcon, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
  resolved: { icon: CheckCheck, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700" },
  closed: { icon: CheckCheck, color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600" }
};

const priorityConfig = {
    low: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
    medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
    high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
    emergency: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700" },
};


export default function ManageComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [updateDialogError, setUpdateDialogError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

   const fetchData = async () => {
     if (!token || !societyId) { setFetchError("Authentication information or Society ID is missing."); setIsLoading(false); return; }
     setIsLoading(true); setFetchError(null);
     try {
        const [complaintsRes, workersRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/complaints?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setComplaints(complaintsRes.data || []);
        if (workersRes.data && Array.isArray(workersRes.data.workers)) {
            setWorkers(workersRes.data.workers);
        } else {
            console.warn("[ManageComplaintsPage] Workers data is not in expected format:", workersRes.data);
            setWorkers([]);
        }
     } catch (err) {
        console.error("Failed to fetch data:", err);
        setFetchError(err.response?.data?.message || "Could not load complaints or worker data.");
        setComplaints([]); setWorkers([]);
     } finally {
        setIsLoading(false);
     }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailDialogOpen(true);
  };

  const handleOpenAssignDialog = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateDialogError(null);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async (complaintId, updateData) => {
    setIsSubmittingUpdate(true);
    setUpdateDialogError(null);
    try {
        await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/complaints?id=${complaintId}`, updateData, {
             headers: { Authorization: `Bearer ${token}` }
         });
         toast({title: "Success", description: "Complaint updated successfully."});
         setIsAssignDialogOpen(false);
         setSelectedComplaint(null);
         fetchData();
    } catch (err) {
        const errorMsg = err.response?.data?.message || "Could not update complaint.";
        setUpdateDialogError(errorMsg);
        toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
    } finally {
        setIsSubmittingUpdate(false);
    }
};

   const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-3/5" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
      <TableCell className="text-right space-x-2">
          <Skeleton className="h-8 w-8 inline-block rounded-md" />
          <Skeleton className="h-8 w-8 inline-block rounded-md" />
      </TableCell>
    </TableRow>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Complaints</h1>
      <ErrorDisplay title="Loading Error" message={fetchError} />
      <ComplaintDetailDialog
        complaint={selectedComplaint}
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
       <AssignWorkerDialog
        complaint={selectedComplaint}
        workersList={workers}
        onSubmit={handleAssignSubmit}
        isOpen={isAssignDialogOpen}
        onOpenChange={(open) => {
            if (!open) { setSelectedComplaint(null); setUpdateDialogError(null); }
            setIsAssignDialogOpen(open);
        }}
        isSubmitting={isSubmittingUpdate}
        error={updateDialogError}
       />
       <div className="border rounded-md shadow-sm">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[30%]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Filed At</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <> <SkeletonRow /> <SkeletonRow /> <SkeletonRow /> <SkeletonRow /> </>
                ) : complaints.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No complaints found.</TableCell></TableRow>
                ) : (
                    complaints.map((comp) => {
                    const CurrentStatusIcon = statusConfig[comp.status]?.icon || PendingIcon;
                    const currentStatusColor = statusConfig[comp.status]?.color || statusConfig.pending.color;
                    const currentPriorityColor = priorityConfig[comp.priority]?.color || priorityConfig.medium.color;
                    return (
                        <TableRow key={comp._id}>
                            <TableCell className="font-medium max-w-xs truncate" title={comp.title}>{comp.title}</TableCell>
                            <TableCell className="capitalize">{comp.category?.replace('_', ' ')}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`${currentPriorityColor} border-current capitalize`}>{comp.priority}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`${currentStatusColor} border-none`}>
                                    <CurrentStatusIcon className="h-3 w-3 mr-1.5" /> {comp.status?.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(comp.createdAt), 'PP')}</TableCell>
                            <TableCell>{comp.assignedWorker?.name || <span className="text-xs text-muted-foreground">Unassigned</span>}</TableCell>
                            <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" title="View Details" onClick={() => handleOpenDetails(comp)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Update Status / Assign Worker" onClick={() => handleOpenAssignDialog(comp)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                    );
                    })
                )}
            </TableBody>
            </Table>
        </div>
    </div>
  )
}