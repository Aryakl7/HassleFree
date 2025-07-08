// components/admin/SocietyInfoForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SocietyInfoForm({ initialData, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(getInitialState());

  function getInitialState() {
    return {
      name: initialData?.name || '',
      address: initialData?.address || '',
      pincode: initialData?.pincode || '',
      location: {
        latitude: initialData?.location?.latitude || '',
        longitude: initialData?.location?.longitude || '',
      },
      photo: initialData?.photo || '',
    };
  }

  useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

  const handleChange = (e, path) => {
     const { id, value, type } = e.target;
     const keys = path ? path.split('.') : [id];
     setFormData(prev => {
       let current = JSON.parse(JSON.stringify(prev)); // Deep copy
       let pointer = current;
       for (let i = 0; i < keys.length - 1; i++) {
         if (!pointer[keys[i]]) pointer[keys[i]] = {};
         pointer = pointer[keys[i]];
       }
       pointer[keys[keys.length - 1]] = type === 'number' ? Number(value) || 0 : value;
       return current;
     });
   };


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Society Name</Label>
        <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={formData.address} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pincode">Pincode</Label>
        <Input id="pincode" value={formData.pincode} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" type="number" step="any" value={formData.location.latitude} onChange={(e) => handleChange(e, 'location.latitude')} required disabled={isSubmitting} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" type="number" step="any" value={formData.location.longitude} onChange={(e) => handleChange(e, 'location.longitude')} required disabled={isSubmitting} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="photo">Photo URL</Label>
        <Input id="photo" value={formData.photo} onChange={handleChange} disabled={isSubmitting} placeholder="Optional: https://..." />
      </div>
      {/* Submit Button - Handled by parent page */}
       <Button type="submit" disabled={isSubmitting} className="hidden">Submit Trigger</Button>
    </form>
  );
}