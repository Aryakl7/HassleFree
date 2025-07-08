// FILE: app/admin/dashboard/equipment/page.jsx
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
import { EquipmentForm } from '@/components/admin/EquipmentForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const equipmentStatuses = ['available', 'low_stock', 'out_of_stock', 'maintenance']; // Keep consistent

export default function ManageEquipmentPage() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [amenities, setAmenities] = useState([]); // For dropdown in form
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchData = async () => {
    if (!token || !societyId) { setFetchError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setFetchError(null);
    try {
      const [equipRes, amenityRes] = await Promise.all([
        // TODO: Create GET /api/admin/equipment?societyId=... API
        axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/equipment?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/amenities?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } }) // For amenity dropdown
      ]);
      setEquipmentList(equipRes.data.equipment || []);
      setAmenities(amenityRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setFetchError(err.response?.data?.message || "Could not load equipment or amenities.");
      setEquipmentList([]); setAmenities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenForm = (equipment = null) => {
    setEditingEquipment(equipment);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    // TODO: Create DELETE /api/admin/equipment/{id} API
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/equipment/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Success", description: "Equipment deleted." });
      fetchData();
    } catch (err) {
      console.error("Failed to delete equipment:", err);
      toast({ title: "Error", description: "Could not delete equipment.", variant: "destructive" });
    }
  };

  const handleSubmit = async (formDataFromComponent) => {
    setIsSubmitting(true); setFormError(null);
    const apiData = { ...formDataFromComponent, societyId: societyId };
    const url = editingEquipment
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/equipment/${editingEquipment._id}` // PUT
        : `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/equipment`; // POST
    const method = editingEquipment ? 'put' : 'post';

    console.log(`[Equipment Page] Submitting ${method.toUpperCase()} to ${url} with data:`, apiData); // Debug Log

    // TODO: Create POST /api/admin/equipment and PUT /api/admin/equipment/{id} APIs
    try {
      await axios[method](url, apiData, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Success", description: `Equipment ${editingEquipment ? 'updated' : 'created'}.` });
      setIsFormOpen(false); setEditingEquipment(null); fetchData();
    } catch (err) {
      console.error("Failed to save equipment:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Could not save equipment.";
      setFormError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skeleton Row Component
  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-5 w-3/4" /></TableCell> {/* Name */}
      <TableCell><Skeleton className="h-5 w-1/2" /></TableCell> {/* Amenity */}
      <TableCell><Skeleton className="h-5 w-24" /></TableCell> {/* Type */}
      <TableCell><Skeleton className="h-5 w-16" /></TableCell> {/* Total Qty */}
      <TableCell><Skeleton className="h-5 w-16" /></TableCell> {/* Available */}
      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell> {/* Status Badge */}
      <TableCell className="text-right space-x-2"><Skeleton className="h-8 w-8 inline-block" /><Skeleton className="h-8 w-8 inline-block" /></TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Equipment</h1>
        <Button onClick={() => handleOpenForm(null)} disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Equipment
        </Button>
      </div>

       <ErrorDisplay title="Loading Error" message={fetchError} />

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setEditingEquipment(null); setFormError(null); } setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit' : 'Add'} Equipment</DialogTitle>
            <DialogDescription>
                {editingEquipment ? 'Update the equipment details.' : 'Provide details for the new equipment.'}
            </DialogDescription>
          </DialogHeader>
          {/* Use the custom form component */}
          <EquipmentForm
            key={editingEquipment?._id || 'new-equipment'} // Re-mount form when item changes
            initialData={editingEquipment}
            onSubmit={handleSubmit} // Pass the page's submit handler
            isSubmitting={isSubmitting}
            amenitiesList={amenities} // Pass amenities for the dropdown
          />
           <ErrorDisplay title="Save Error" message={formError} className="mt-2" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            {/* This button triggers the submit *inside* EquipmentForm */}
            <Button type="submit" form="equipment-form-id" disabled={isSubmitting}> {/* Ensure EquipmentForm has id="equipment-form-id" */}
                {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null}
                {editingEquipment ? 'Update Equipment' : 'Create Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Table */}
      <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Amenity</TableHead><TableHead>Type</TableHead>
                <TableHead>Total</TableHead><TableHead>Available</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                     <> <SkeletonRow/> <SkeletonRow/> <SkeletonRow/> </>
                ): equipmentList.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">No equipment found.</TableCell></TableRow>
                ) : (
                    equipmentList.map((eq) => (
                        <TableRow key={eq._id}>
                        <TableCell className="font-medium">{eq.name}</TableCell>
                        <TableCell>{eq.amenityId?.name || eq.amenityId?.toString() || 'N/A'}</TableCell> {/* Requires Population */}
                        <TableCell className="capitalize">{eq.type?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{eq.quantity?.total ?? 'N/A'}</TableCell>
                        <TableCell>{eq.quantity?.available ?? 'N/A'}</TableCell>
                        <TableCell><Badge variant={eq.status === 'available' ? 'default' : 'secondary'} className="capitalize">{eq.status?.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" title="Edit" onClick={() => handleOpenForm(eq)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="sm" title="Delete" onClick={() => handleDelete(eq._id)}><Trash2 className="h-4 w-4" /></Button>
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