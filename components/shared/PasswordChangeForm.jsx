// components/shared/PasswordChangeForm.jsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Example Usage in a parent component (e.g., Settings page):
// const handlePasswordSubmit = async (passwordData) => {
//    setIsChangingPassword(true);
//    try {
//        // await axios.post('/api/admin/change-password', passwordData, { headers: { Authorization: `Bearer ${token}` }});
//        toast({ title: "Success", description: "Password changed."});
//        return true; // Indicate success to reset form
//    } catch (error) {
//        toast({ title: "Error", description: "Failed to change password.", variant: "destructive"});
//        return false; // Indicate failure
//    } finally {
//        setIsChangingPassword(false);
//    }
// }
// <PasswordChangeForm onSubmit={handlePasswordSubmit} />

export function PasswordChangeForm({ onSubmit, isSubmitting }) {
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const { toast } = useToast();

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({ title: "Error", description: "Please fill all password fields.", variant: "destructive" });
      return;
    }

    const success = await onSubmit(passwordData);
    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset form on success
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={passwordData.currentPassword}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={passwordData.newPassword}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={passwordData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Changing...' : 'Change Password'}
      </Button>
    </form>
  );
}