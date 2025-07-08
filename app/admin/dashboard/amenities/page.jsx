// app/admin/dashboard/amenities/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AmenityForm } from '@/components/admin/AmenityForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Keep consistent with your Amenity model
const amenityTypes = [
  'swimming_pool', 'gym', 'tennis_court', 'squash_court', 'football_field',
  'cricket_pitch', 'clubhouse', 'park', 'basketball_court', 'indoor_games',
  'yoga_room', 'party_hall', 'kids_play_area'
];
const amenityStatuses = ['operational', 'maintenance', 'closed'];

export default function ManageAmenitiesPage() {
  const [amenities, setAmenities] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchData = async () => {
    // ... (fetch logic - same as before, setFetchError on failure) ...
    if (!token || !societyId) { setFetchError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    try {
      const [amenitiesRes, workersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/workers?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } }) // TODO: Ensure this API exists
      ]);
      setAmenities(amenitiesRes.data || []);
      setWorkers(workersRes.data.workers || []);
    } catch (err) { setFetchError(err.response?.data?.message || "Could not load data."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenForm = (amenity = null) => {
    setEditingAmenity(amenity);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    // ... (delete logic - same as before, calls DELETE /api/amenities/{id}) ...
    if (!confirm("Delete this amenity?")) return;
    // TODO: Ensure DELETE /api/amenities/{id} API exists and works
    try {
        await axios.delete(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        toast({ title: "Success", description: "Amenity deleted." });
        fetchData();
    } catch (err) { toast({ title: "Error", description: "Could not delete.", variant: "destructive"}); }
  };

  const handleSubmit = async (formData) => {
    // ... (submit logic - same as before, sets formError, calls POST /api/amenities or PUT /api/amenities/{id}) ...
    setIsSubmitting(true); setFormError(null);
    const apiData = { ...formData, societyId: societyId };
    if (apiData.amenityManager === '') apiData.amenityManager = null;
    const url = editingAmenity ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities/${editingAmenity._id}` : `${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities`;
    const method = editingAmenity ? 'put' : 'post';
    // TODO: Ensure POST/PUT /api/amenities endpoints exist and work
    try {
        await axios[method](url, apiData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Success", description: `Amenity ${editingAmenity ? 'updated' : 'created'}.` });
        setIsFormOpen(false); setEditingAmenity(null); fetchData();
    } catch (err) {
        const errorMsg = err.response?.data?.message || "Could not save amenity.";
        setFormError(errorMsg); toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  // Skeleton Row Component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Amenities</h1>
        <Button onClick={() => handleOpenForm(null)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Amenity
        </Button>
      </div>

       <ErrorDisplay title="Loading Error" message={fetchError} />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setEditingAmenity(null); setFormError(null); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAmenity ? 'Edit' : 'Add'} Amenity</DialogTitle>
          </DialogHeader>
          <AmenityForm
              key={editingAmenity?._id || 'new-amenity'}
              initialData={editingAmenity}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              workersList={workers}
              amenityTypes={amenityTypes}
              statuses={amenityStatuses}
          />
           <ErrorDisplay title="Save Error" message={formError} className="mt-2" />
          <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" form="amenity-form-id" disabled={isSubmitting}> {/* Ensure AmenityForm has id */}
                  {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null}
                  {editingAmenity ? 'Update Amenity' : 'Create Amenity'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amenities Table */}
       <div className="border rounded-md">
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
                    <TableHead>Capacity</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
                ) : amenities.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No amenities found.</TableCell></TableRow>
                ) : (
                    amenities.map((am) => (
                        <TableRow key={am._id}>
                            <TableCell className="font-medium">{am.name}</TableCell>
                            <TableCell className="capitalize">{am.type?.replace(/_/g, ' ')}</TableCell>
                            <TableCell><Badge variant={am.status === 'operational' ? 'default' : 'destructive'}>{am.status}</Badge></TableCell>
                            <TableCell>{am.capacity}</TableCell>
                            <TableCell>{am.location}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenForm(am)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(am._id)}><Trash2 className="h-4 w-4" /></Button>
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