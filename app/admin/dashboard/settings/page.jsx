// FILE: app/admin/dashboard/settings/page.jsx
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';
import Cookies from 'js-cookie';
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordChangeForm } from '@/components/shared/PasswordChangeForm';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState(null); // For profile data
  const [originalAdmin, setOriginalAdmin] = useState(null); // To compare for changes
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const { toast } = useToast();
  const token = Cookies.get('AdminAccessToken');

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!token) { setProfileError("Auth token missing."); setIsLoadingProfile(false); return; }
      setIsLoadingProfile(true); setProfileError(null);
      try {
        // TODO: Create GET /api/admin/me API endpoint
        const response = await axios.get(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } });
        setAdmin(response.data); setOriginalAdmin(response.data);
      } catch (err) { setProfileError(err.response?.data?.message || "Could not load your profile."); }
      finally { setIsLoadingProfile(false); }
    };
    fetchAdminData();
  }, []); // Fetch only once

  const handleProfileChange = (e) => {
    setAdmin({ ...admin, [e.target.id]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setProfileError(null); setIsSavingProfile(true);
    const changedData = {};
    if (admin.name !== originalAdmin.name) changedData.name = admin.name;
    // Email is usually not changed via profile update, but handled by support
    // if (admin.email !== originalAdmin.email) changedData.email = admin.email;

    if (Object.keys(changedData).length === 0) {
      toast({ title: "Info", description: "No profile information was changed." });
      setIsSavingProfile(false);
      return;
    }
    // TODO: Create PUT /api/admin/me API endpoint
    try {
        await axios.put(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/me`, changedData, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: "Success", description: "Profile updated successfully." });
        setOriginalAdmin(admin); // Update original to reflect saved changes
    } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to update profile.";
        setProfileError(errorMsg); toast({ title: "Error", description: errorMsg, variant: "destructive" });
        setAdmin(originalAdmin); // Revert to original on error
    } finally {
        setIsSavingProfile(false);
    }
  };

  // This is passed to PasswordChangeForm
  const handleChangePassword = async (passwordDataFromComponent) => {
    setIsChangingPassword(true); setPasswordError(null);
     // TODO: Create POST /api/admin/change-password API endpoint
     try {
         await axios.post(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/change-password`, passwordDataFromComponent, {
             headers: { Authorization: `Bearer ${token}` }
         });
         toast({ title: "Success", description: "Password changed successfully." });
         return true; // Indicate success to PasswordChangeForm so it can reset its fields
     } catch (err) {
         const errorMsg = err.response?.data?.message || "Failed to change password.";
         setPasswordError(errorMsg);
         toast({ title: "Error", description: errorMsg, variant: "destructive" });
         return false; // Indicate failure
     } finally {
         setIsChangingPassword(false);
     }
  };

  const renderProfileForm = () => (
     <form onSubmit={handleProfileUpdate} id="admin-profile-form" className="space-y-4">
        <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={admin?.name || ''} onChange={handleProfileChange} disabled={isSavingProfile}/>
        </div>
        <div className="space-y-1">
            <Label htmlFor="email">Email (Read-only)</Label>
            <Input id="email" type="email" value={admin?.email || ''} disabled />
        </div>
        {/* You can add other editable admin profile fields here if needed */}
        <ErrorDisplay title="Profile Update Error" message={profileError} />
        {/* Submit button for this form will be in the CardFooter */}
      </form>
  );

  const renderSkeletonCard = (titleText = "Loading...", descriptionText = "Please wait.") => (
       <Card>
            <CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-1" /></CardHeader>
             <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
             <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
         </Card>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Admin Settings</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
           {isLoadingProfile ? renderSkeletonCard("Profile","Loading profile...") : (
            <Card>
                <CardHeader><CardTitle>Edit Profile</CardTitle><CardDescription>Update your personal admin information.</CardDescription></CardHeader>
                <CardContent>{admin ? renderProfileForm() : <ErrorDisplay title="Loading Error" message={profileError || "Could not load profile data."} />}</CardContent>
                {admin &&
                    <CardFooter>
                        <Button type="submit" form="admin-profile-form" disabled={isSavingProfile}>
                           {isSavingProfile ? <LoadingSpinner size={16} className="mr-2"/> : null} Save Profile Changes
                        </Button>
                    </CardFooter>
                 }
            </Card>
           )}
        </TabsContent>

        <TabsContent value="security">
           <Card>
            <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Update your admin account password.</CardDescription></CardHeader>
            <CardContent>
               <PasswordChangeForm
                    onSubmit={handleChangePassword}
                    isSubmitting={isChangingPassword}
               />
                <ErrorDisplay title="Password Error" message={passwordError} className="mt-4"/>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}