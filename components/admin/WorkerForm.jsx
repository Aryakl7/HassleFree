// components/admin/WorkerForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const departments = ['maintenance', 'security', 'cleaning', 'gardening'];

export function WorkerForm({ initialData, onSubmit, isSubmitting, isEditing = false }) {
  const [formData, setFormData] = useState(() => getInitialState(initialData)); // Initialize directly

  function getInitialState(data) {
    return {
      workerID: data?.workerID || '', // This is the custom, user-entered ID
      name: data?.name || '',
      department: data?.department || '',
      experience: data?.experience || 0,
      photo: { url: data?.photo?.url || '' },
    };
  }

  useEffect(() => {
    setFormData(getInitialState(initialData));
  }, [initialData]);

  // Generic handler for top-level and nested fields
   const handleChange = (e, path) => {
     const { id, value, type } = e.target;
     const keys = path ? path.split('.') : [id];
     setFormData(prev => {
       let current = {...prev}; // Shallow copy needed
       let pointer = current;
       for (let i = 0; i < keys.length - 1; i++) {
         pointer[keys[i]] = { ...(pointer[keys[i]] || {}) }; // Deep copy for nested objects
         pointer = pointer[keys[i]];
       }
       pointer[keys[keys.length - 1]] = type === 'number' ? Number(value) || 0 : value;
       return current;
     });
   };

   const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pass current state to parent handler
  };

  return (
    // Add ID for the footer button's 'form' attribute
    <form onSubmit={handleFormSubmit} id="worker-form-id" className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="workerID">Worker ID</Label>
              <Input id="workerID" value={formData.workerID} onChange={handleChange} required disabled={isSubmitting} />
              {isEditing && <p className="text-xs text-muted-foreground">Worker ID cannot be changed after creation.</p>}
            </div>
             <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleSelectChange('department', value)} required disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-1">
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input id="experience" type="number" value={formData.experience} onChange={handleChange} required disabled={isSubmitting} min="0"/>
            </div>
            <div className="space-y-1 md:col-span-2">
               <Label htmlFor="photoUrl">Photo URL</Label>
               {/* Use correct id for nested state */}
               <Input id="photo.url" value={formData.photo.url} onChange={(e) => handleChange(e, 'photo.url')} disabled={isSubmitting} placeholder="Optional: https://..."/>
           </div>
       </div>
       {/* Hidden submit button for triggering via footer */}
       <button type="submit" disabled={isSubmitting} className="hidden">Internal Submit</button>
    </form>
  );
}