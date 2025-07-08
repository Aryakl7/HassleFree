// components/admin/AnnouncementForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"; // Although button is in footer, keep imports if needed elsewhere
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const priorities = ['low', 'medium', 'high', 'urgent'];
const audiences = ['all', 'specific_blocks', 'specific_users']; // Assuming these are your enum values

export function AnnouncementForm({ initialData, onSubmit, isSubmitting }) {
  // Initialize state using a function to ensure it runs correctly based on initialData
  const [formData, setFormData] = useState(() => getInitialState(initialData));

  function getInitialState(data) {
    console.log("[AnnouncementForm] Initializing state with data:", data);
    return {
      title: data?.title || '',
      description: data?.description || '',
      priority: data?.priority || 'medium',
      audience: data?.audience || 'all',
      notifyUsers: data?.notifyUsers || false,
      targetedUsers: data?.targetedUsers || [], // Needs UI logic
      attachments: data?.attachments || [] // Simplified
    };
  }

  // Effect to reset form state when initialData changes (e.g., switching from edit to add)
  useEffect(() => {
    console.log("[AnnouncementForm] initialData changed, resetting form state.");
    setFormData(getInitialState(initialData));
  }, [initialData]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    console.log(`[AnnouncementForm] Field Change: ${id} = ${val}`); // Log changes
    setFormData(prev => ({ ...prev, [id]: val }));
  };

  const handleSelectChange = (id, value) => {
    console.log(`[AnnouncementForm] Select Change: ${id} = ${value}`); // Log changes
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id, checked) => {
    console.log(`[AnnouncementForm] Switch Change: ${id} = ${checked}`); // Log changes
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  // This is triggered by the footer button via the form's id
  const handleFormInternalSubmit = (e) => {
    e.preventDefault(); // Prevent default browser form submission
    console.log("[AnnouncementForm] Internal form onSubmit triggered. Calling parent onSubmit prop with:", formData);
    onSubmit(formData); // Pass current form data UP to the page component
  };

  return (
    // *** Ensure this ID matches the 'form' prop on the footer button ***
    <form onSubmit={handleFormInternalSubmit} id="announcement-form-id" className="grid gap-4 py-4">
      {/* Title */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Title</Label>
        <Input id="title" value={formData.title} onChange={handleChange} className="col-span-3" required disabled={isSubmitting} />
      </div>
      {/* Description */}
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right pt-2">Description</Label>
        <Textarea id="description" value={formData.description} onChange={handleChange} className="col-span-3" required disabled={isSubmitting} />
      </div>
      {/* Priority */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="priority" className="text-right">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)} disabled={isSubmitting}>
          <SelectTrigger id="priority" className="col-span-3">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {priorities.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {/* Audience */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="audience" className="text-right">Audience</Label>
        <Select value={formData.audience} onValueChange={(value) => handleSelectChange('audience', value)} disabled={isSubmitting}>
          <SelectTrigger id="audience" className="col-span-3">
            <SelectValue placeholder="Select audience" />
          </SelectTrigger>
          <SelectContent>
             {audiences.map(a => <SelectItem key={a} value={a}>{a.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {/* TODO: Add conditional UI for selecting specific users/blocks based on formData.audience */}
      {formData.audience !== 'all' && (
        <div className="col-span-4 text-center text-muted-foreground text-sm">
            (UI for selecting specific {formData.audience === 'specific_blocks' ? 'blocks' : 'users'} not implemented)
        </div>
      )}

      {/* Notify Users */}
      <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="notifyUsers" className="text-right">Notify Users?</Label>
          <Switch
              id="notifyUsers"
              checked={formData.notifyUsers}
              onCheckedChange={(checked) => handleSwitchChange('notifyUsers', checked)}
              className="col-span-3 justify-self-start"
              disabled={isSubmitting}
          />
      </div>
      {/* Attachments (Simplified URL input) */}
      <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="attachments" className="text-right">Attachments (URLs)</Label>
          {/* TODO: Improve attachment handling */}
          <Input
            id="attachments"
            placeholder="Optional: URL1, URL2 (comma-separated)"
            value={formData.attachments.join(', ')}
            // Simple split/trim for URL input, filter empty strings
            onChange={(e) => setFormData(prev => ({ ...prev, attachments: e.target.value.split(',').map(url => url.trim()).filter(url => url) }))}
            className="col-span-3"
            disabled={isSubmitting}
          />
      </div>

       {/* NO submit button inside the form itself if it's triggered from the DialogFooter */}
       {/* <Button type="submit" disabled={isSubmitting} className="hidden">Internal Submit</Button> */}
    </form>
  );
}