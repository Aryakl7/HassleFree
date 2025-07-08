// app/admin/dashboard/workers/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerForm } from '@/components/admin/WorkerForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ManageWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchWorkers = async () => {
    // ... (fetch logic - same as before, setFetchError) ...
    if (!token || !societyId) { setFetchError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    // TODO: Ensure GET /api/admin/workers?societyId=... API exists
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } });
        setWorkers(response.data.workers || []);
    } catch (err) { setFetchError(err.response?.data?.message || "Could not load workers."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleOpenForm = (worker = null) => {
    setEditingWorker(worker);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    // ... (delete logic - calls DELETE /api/admin/workers/{id}) ...
    if (!confirm("Delete worker?")) return;
    // TODO: Ensure DELETE /api/admin/workers/{id} API exists
    try {
        await axios.delete(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        toast({ title: "Success", description: "Worker deleted." });
        fetchWorkers();
    } catch (err) { toast({ title: "Error", description: "Could not delete.", variant: "destructive"}); }
  };

  const handleSubmit = async (formData) => {
    // ... (submit logic - sets formError, calls POST /api/admin/workers or PUT /api/admin/workers/{id}) ...
     setIsSubmitting(true); setFormError(null);
     const apiData = { ...formData, societyId: societyId };
     const url = editingWorker ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers/${editingWorker._id}` : `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers`;
     const method = editingWorker ? 'put' : 'post';
     // TODO: Ensure POST and PUT endpoints exist
     try {
        await axios[method](url, apiData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Success", description: `Worker ${editingWorker ? 'updated' : 'created'}.` });
        setIsFormOpen(false); setEditingWorker(null); fetchWorkers();
     } catch (err) {
        const errorMsg = err.response?.data?.message || "Could not save worker.";
        setFormError(errorMsg); toast({ title: "Error", description: errorMsg, variant: "destructive" });
     } finally { setIsSubmitting(false); }
  };

  // Skeleton Row
  const SkeletonRow = () => ( <TableRow>
    <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
    <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
</TableRow> );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Workers</h1>
        <Button onClick={() => handleOpenForm(null)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Worker
        </Button>
      </div>

       <ErrorDisplay title="Loading Error" message={fetchError} />

      {/* Add/Edit Worker Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setEditingWorker(null); setFormError(null); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingWorker ? 'Edit' : 'Add'} Worker</DialogTitle>
            <DialogDescription>
                {editingWorker ? 'Update worker details.' : 'Enter details for the new worker.'}
            </DialogDescription>
          </DialogHeader>
          {/* Use the custom form component */}
          <WorkerForm
            key={editingWorker?._id || 'new-worker'} // Re-mount on change
            initialData={editingWorker}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditing={!!editingWorker}
          />
           <ErrorDisplay title="Save Error" message={formError} className="mt-2" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            {/* Connect button to the form inside WorkerForm */}
            <Button type="submit" form="worker-form-id" disabled={isSubmitting}> {/* Ensure WorkerForm <form> has id="worker-form-id" */}
              {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null}
              {editingWorker ? 'Update Worker' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workers Table (Structure same as before) */}
       <div className="border rounded-md">
         <Table>
            {/* ... TableHeader ... */}
            <TableBody>
              {isLoading ? (
                 <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
              ) : workers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">No workers found.</TableCell></TableRow>
              ) : (
                workers.map((worker) => (
                  // ... TableRow structure same as before ...
                   <TableRow key={worker._id}>
                    <TableCell>
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={worker.photo?.url} alt={worker.name} />
                            <AvatarFallback>{worker.name?.charAt(0)?.toUpperCase() || 'W'}</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-mono">{worker.workerID}</TableCell>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell className="capitalize">{worker.department}</TableCell>
                    <TableCell>{worker.experience} yrs</TableCell>
                    <TableCell>{worker.rating?.toFixed(1) || 'N/A'} ★</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" title="Edit" onClick={() => handleOpenForm(worker)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" title="Delete" onClick={() => handleDelete(worker._id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}
