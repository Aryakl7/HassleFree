// FILE: app/admin/dashboard/society/page.jsx
'use client'

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input"; // Input is inside SocietyInfoForm
// import { Label } from "@/components/ui/label"; // Label is inside SocietyInfoForm
import { useToast } from "@/hooks/use-toast";
import { Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SocietyInfoForm } from '@/components/admin/SocietyInfoForm'; // Import custom form
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ManageSocietyPage() {
  const [society, setSociety] = useState(null);
  const [originalSociety, setOriginalSociety] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');
  const societyId = Cookies.get('SocietyId');

  const fetchSocietyDetails = async () => {
    if (!token || !societyId) { setError("Auth info missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
        // Ensure GET /api/society?societyId=... API exists and handles admin auth
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/society?societyId=${societyId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSociety(response.data);
        setOriginalSociety(response.data);
    } catch (err) { setError(err.response?.data?.message || "Could not load society details."); setSociety(null); setOriginalSociety(null); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSocietyDetails(); }, []);

  // Passed to SocietyInfoForm's onSubmit prop
  const handleSaveChanges = async (formDataFromComponent) => {
    setIsSubmitting(true); setError(null);
    const changedData = {};
    // Compare only fields present in formDataFromComponent to avoid sending undefined
    if (formDataFromComponent.name !== originalSociety.name) changedData.name = formDataFromComponent.name;
    if (formDataFromComponent.address !== originalSociety.address) changedData.address = formDataFromComponent.address;
    if (formDataFromComponent.pincode !== originalSociety.pincode) changedData.pincode = formDataFromComponent.pincode;
    if (formDataFromComponent.photo !== originalSociety.photo) changedData.photo = formDataFromComponent.photo;
    if (JSON.stringify(formDataFromComponent.location) !== JSON.stringify(originalSociety.location)) {
        changedData.location = formDataFromComponent.location;
    }

    if (Object.keys(changedData).length === 0) {
        toast({ title: "Info", description: "No changes detected."});
        setIsEditing(false); setIsSubmitting(false);
        return;
    }

    console.log("[Society Page] Saving changes:", changedData); // Debug log

    // TODO: Ensure PUT /api/society/{societyId} API exists and works
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/society/${societyId}`, changedData, { headers: { Authorization: `Bearer ${token}` } });
      const updatedSocietyData = response.data.society || response.data; // Adjust if API nests
      toast({ title: "Success", description: "Society details updated." });
      setOriginalSociety(updatedSocietyData); setSociety(updatedSocietyData);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update society:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Could not update society details.";
      setError(errorMsg); toast({ title: "Error", description: errorMsg, variant: "destructive" });
      // Revert form to original state on error
      setSociety(originalSociety);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
      setSociety(originalSociety); // Revert to original data
      setIsEditing(false);
      setError(null); // Clear any previous submission errors
  }

  // Skeleton for Society Info Card
  const SocietySkeleton = () => (
    <Card className="max-w-3xl mx-auto">
        <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
            </div>
             <div className="space-y-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
        </CardContent>
        {!isEditing && <CardFooter><Skeleton className="h-10 w-28 ml-auto" /></CardFooter> }
    </Card>
  );


  if (isLoading) { return <SocietySkeleton />; }
  if (error && !society) { return <ErrorDisplay title="Failed to Load Society Info" message={error} className="max-w-3xl mx-auto"/> }
  if (!society) { return <p className="text-center max-w-3xl mx-auto">Society data not found or could not be loaded.</p>; }


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Society Information</h1>
         {!isEditing && (
             <Button onClick={() => { setIsEditing(true); setError(null); }} disabled={isLoading}>Edit Details</Button>
         )}
      </div>
      <ErrorDisplay title="Update Error" message={error} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5" /> {originalSociety?.name || 'Society Details'}</CardTitle>
          <CardDescription>View and manage the details of your society.</CardDescription>
        </CardHeader>
        <CardContent>
           {/* SocietyInfoForm should have id="society-info-form-id" on its <form> tag */}
           <SocietyInfoForm
                key={originalSociety?._id || 'society-form'} // Use a stable key
                initialData={society} // Pass current (potentially edited) state data
                onSubmit={handleSaveChanges} // Pass the save handler
                isSubmitting={isSubmitting}
                // The form itself should handle disabling fields based on isEditing
                // (or pass an 'isEditing' prop to it)
           />
        </CardContent>
        {isEditing && (
            <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>Cancel</Button>
                {/* This button triggers submit for the form inside SocietyInfoForm */}
                <Button type="submit" form="society-info-form-id" disabled={isSubmitting}>
                    {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : 'Save Changes'}
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}