// app/admin/dashboard/users/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Verified } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm } from '@/components/admin/UserForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null); // For Add/Edit form errors
  const [fetchError, setFetchError] = useState(null); // For table loading errors
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchUsers = async () => {
    if (!token || !societyId) { setFetchError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    try {
        // TODO: Ensure GET /api/admin/users?societyId=... API exists and works
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(response.data.users || []);
    } catch (err) { setFetchError(err.response?.data?.message || "Could not load users."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenForm = (user = null) => {
    setEditingUser(user);
    setFormError(null); // Clear previous form errors
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm(`Delete user ${id}? This action cannot be undone.`)) return;
    // TODO: Ensure DELETE /api/admin/users/{id} API exists and works
    try {
        await axios.delete(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        toast({ title: "Success", description: "User deleted." });
        fetchUsers(); // Refresh the list
    } catch (err) {
        console.error("Delete user error:", err);
        toast({ title: "Error", description: "Could not delete user.", variant: "destructive"});
    }
  };

  // Handles BOTH Add and Edit form submissions via the UserForm's onSubmit prop
  const handleSubmit = async (formData) => {
     setIsSubmitting(true); setFormError(null);
     // Ensure societyId is included, especially for creation
     const apiData = { ...formData, societyId: societyId };

     const url = editingUser
         ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users/${editingUser._id}` // PUT endpoint
         : `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users`; // POST endpoint
     const method = editingUser ? 'put' : 'post';

     console.log(`Attempting to ${method.toUpperCase()} user:`, url, apiData); // Debug log

     // TODO: Ensure POST /api/admin/users and PUT /api/admin/users/{id} APIs exist and work
     try {
        await axios[method](url, apiData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Success", description: `User ${editingUser ? 'updated' : 'created'}.` });
        setIsFormOpen(false);
        setEditingUser(null);
        fetchUsers(); // Refresh list after successful operation
     } catch (err) {
        console.error(`Failed to ${method} user:`, err.response?.data || err.message);
        const errorMsg = err.response?.data?.message || `Could not save user.`;
        setFormError(errorMsg); // Set error to display within the dialog
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
     } finally {
         setIsSubmitting(false);
     }
  };

   // Skeleton Row Component
   const SkeletonRow = () => (
        <TableRow>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell><Skeleton className="h-5 w-40" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
        </TableRow>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Residents</h1>
        <Button onClick={() => handleOpenForm(null)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Resident
        </Button>
      </div>

       <ErrorDisplay title="Loading Error" message={fetchError} />

      {/* Add/Edit User Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setEditingUser(null); setFormError(null); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update resident details below.' : 'Enter details for the new resident.'}
            </DialogDescription>
          </DialogHeader>
          {/* Use the custom form component */}
          <UserForm
            key={editingUser?._id || 'new-user'} // Re-mount form when user changes
            initialData={editingUser}
            onSubmit={handleSubmit} // Pass the page's submit handler
            isSubmitting={isSubmitting}
            isEditing={!!editingUser}
          />
           <ErrorDisplay title="Save Error" message={formError} className="mt-2" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            {/* This button triggers the submit *inside* UserForm */}
            <Button type="submit" form="user-form-id" disabled={isSubmitting}> {/* Ensure UserForm <form> has id="user-form-id" */}
              {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null}
              {editingUser ? 'Update Resident' : 'Add Resident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
       <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>House</TableHead>
                        <TableHead>Flat</TableHead><TableHead>Verified</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
                    ) : users.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-24">No residents found.</TableCell></TableRow>
                    ) : (
                        users.map((user) => (
                        <TableRow key={user._id}>
                            <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell>
                            <TableCell>{user.houseNo}</TableCell><TableCell>{user.flatNo}</TableCell>
                            <TableCell>
                                {user.photo?.isVerified ? (<Badge variant="secondary"><Verified className="h-3 w-3 mr-1"/>Verified</Badge>) : (<Badge variant="outline">No</Badge>)}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenForm(user)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user._id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  )
}