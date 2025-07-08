// app/admin/dashboard/announcements/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Bell, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const priorityConfig = {
  low: { icon: Info, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700" },
  medium: { icon: Bell, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700" },
  high: { icon: AlertTriangle, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700" },
  urgent: { icon: AlertCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700" },
};

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchAnnouncements = async () => {
    if (!token || !societyId) { setFetchError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/announcement?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAnnouncements(response.data.announcements || []);
    } catch (err) { setFetchError(err.response?.data?.message || "Could not load announcements."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []); // Fetch on initial load only

  const handleOpenForm = (announcement = null) => {
    console.log("[Page] Opening form for:", announcement ? `Edit (${announcement._id})` : "Create");
    setEditingAnnouncement(announcement);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
     if (!confirm("Are you sure you want to delete this announcement?")) return;
     console.log(`[Page] Attempting to delete announcement: ${id}`);
    // TODO: Ensure DELETE /api/announcement/{id} or ?id={id} API exists and works
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_SITE_URL}/api/announcement/${id}`, { // Using path param example
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Success", description: "Announcement deleted." });
      fetchAnnouncements(); // Refresh list
    } catch (err) {
      console.error("Delete announcement error:", err);
      toast({ title: "Error", description: "Could not delete announcement.", variant: "destructive" });
    }
  };

  // This function is passed to AnnouncementForm's onSubmit prop
  const handleSubmit = async (formDataFromComponent) => {
    setIsSubmitting(true);
    setFormError(null);
    const apiData = { ...formDataFromComponent, societyId: societyId };

    const url = editingAnnouncement
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/announcement/${editingAnnouncement._id}` // PUT endpoint example
        : `${process.env.NEXT_PUBLIC_SITE_URL}/api/announcement`; // POST endpoint
    const method = editingAnnouncement ? 'put' : 'post';

    console.log(`[Page handleSubmit] Submitting ${method.toUpperCase()} to ${url} with data:`, apiData); // Debug log

    // TODO: Ensure POST/PUT /api/announcement endpoints exist and work
    try {
      await axios[method](url, apiData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Success", description: `Announcement ${editingAnnouncement ? 'updated' : 'created'}.` });
      setIsFormOpen(false);
      setEditingAnnouncement(null);
      fetchAnnouncements(); // Refresh list
    } catch (err) {
      console.error("Failed to save announcement:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || "Could not save announcement.";
      setFormError(errorMsg); // Set error for display in the dialog
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

   // Skeleton Row Component
   const SkeletonRow = () => ( <TableRow> {/* ... same as before ... */} </TableRow> );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Announcements</h1>
        {/* Use DialogTrigger directly if preferred, or manage open state manually like here */}
        <Button onClick={() => handleOpenForm(null)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Announcement
        </Button>
      </div>

      <ErrorDisplay title="Loading Error" message={fetchError} />

      {/* Add/Edit Announcement Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setEditingAnnouncement(null); setFormError(null); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update the details below.' : 'Fill in the details for the announcement.'}
            </DialogDescription>
          </DialogHeader>
          {/* Render the custom form component, passing the handleSubmit from *this* page */}
          <AnnouncementForm
              key={editingAnnouncement?._id || 'new-announcement'} // Force re-render with new initialData
              initialData={editingAnnouncement}
              onSubmit={handleSubmit} // Pass the page's handler here
              isSubmitting={isSubmitting}
          />
           <ErrorDisplay title="Save Error" message={formError} className="mt-2" />
          <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              {/* *** THIS BUTTON MUST TRIGGER THE FORM SUBMIT *** */}
               <Button
                 type="submit"
                 form="announcement-form-id" // *** MUST MATCH form ID inside AnnouncementForm ***
                 disabled={isSubmitting}
               >
                 {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null}
                 {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcements Table */}
       <div className="border rounded-md">
         <Table>
            {/* ... TableHeader ... */}
            <TableBody>
                {isLoading ? (
                    <> <SkeletonRow /> <SkeletonRow /> <SkeletonRow /> </>
                ) : announcements.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No announcements found.</TableCell></TableRow>
                ) : (
                    announcements.map((ann) => {
                        const priorityData = priorityConfig[ann.priority] || priorityConfig.medium;
                        const Icon = priorityData.icon;
                        return (
                        <TableRow key={ann._id}>
                            <TableCell className="font-medium">{ann.title}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`${priorityData.color} border-current`}>
                                    <Icon className="h-3 w-3 mr-1" /> {ann.priority}
                                </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{ann.audience?.replace('_', ' ')}</TableCell>
                            <TableCell>{format(new Date(ann.createdAt), 'PPp')}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" title="Edit" onClick={() => handleOpenForm(ann)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="sm" title="Delete" onClick={() => handleDelete(ann._id)}><Trash2 className="h-4 w-4" /></Button>
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