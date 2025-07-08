// components/admin/EquipmentForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const equipmentTypes = [
  'sports_equipment', 'gym_equipment', 'game_equipment', 'furniture',
  'electronic', 'cleaning', 'safety', 'other'
];
const equipmentStatuses = ['available', 'low_stock', 'out_of_stock', 'maintenance'];


export function EquipmentForm({ initialData, onSubmit, isSubmitting, amenitiesList = [] }) {
  const [formData, setFormData] = useState(getInitialState());

  function getInitialState() {
    return {
      name: initialData?.name || '',
      amenityId: initialData?.amenityId?._id || initialData?.amenityId || '',
      type: initialData?.type || '',
      description: initialData?.description || '',
      quantity: {
        total: initialData?.quantity?.total || 1,
        available: initialData?.quantity?.available || 1,
        underMaintenance: initialData?.quantity?.underMaintenance || 0,
      },
      status: initialData?.status || 'available',
      isChargeable: initialData?.isChargeable || false,
      charges: {
        hourly: initialData?.charges?.hourly || 0,
        deposit: initialData?.charges?.deposit || 0,
      },
      photo: initialData?.photo || '',
    };
  }

 useEffect(() => {
    setFormData(getInitialState());
  }, [initialData]);

   // --- Generic Input Handlers ---
   const handleInputChange = (e, path) => {
     const { id, value, type, checked } = e.target;
     const keys = path ? path.split('.') : [id];
     setFormData(prev => {
       let current = JSON.parse(JSON.stringify(prev)); // Deep copy
       let pointer = current;
       for (let i = 0; i < keys.length - 1; i++) {
         if (!pointer[keys[i]]) pointer[keys[i]] = {};
         pointer = pointer[keys[i]];
       }
       pointer[keys[keys.length - 1]] = type === 'checkbox' ? checked : type === 'number' ? Number(value) || 0 : value;
       return current;
     });
   };

   const handleSelectChange = (id, value, path) => {
      const keys = path ? path.split('.') : [id];
       setFormData(prev => {
        let current = JSON.parse(JSON.stringify(prev));
        let pointer = current;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!pointer[keys[i]]) pointer[keys[i]] = {};
          pointer = pointer[keys[i]];
        }
        pointer[keys[keys.length - 1]] = value;
        return current;
      });
    };

  const handleSubmit = (e) => {
    e.preventDefault();
     // Add validation if needed (e.g., ensure available <= total)
    if (formData.quantity.available > formData.quantity.total) {
        alert("Available quantity cannot exceed total quantity."); // Replace with toast
        return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
                <Label htmlFor="name">Equipment Name</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} required disabled={isSubmitting} />
            </div>
            {/* Amenity */}
            <div className="space-y-1">
                <Label htmlFor="amenityId">Belongs to Amenity</Label>
                 <Select value={formData.amenityId} onValueChange={(value) => handleSelectChange('amenityId', value)} required disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Select amenity" /></SelectTrigger>
                    <SelectContent>
                        {amenitiesList.map(am => <SelectItem key={am._id} value={am._id}>{am.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             {/* Type */}
            <div className="space-y-1">
                <Label htmlFor="type">Type</Label>
                 <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)} required disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        {equipmentTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
              {/* Status */}
            <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                 <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        {equipmentStatuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             {/* Description */}
            <div className="space-y-1 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={handleInputChange} disabled={isSubmitting} />
            </div>

             {/* Quantity */}
            <div className="md:col-span-2 space-y-1">
                 <Label>Quantity</Label>
                <div className="grid grid-cols-3 gap-2 border p-2 rounded-md">
                    <div>
                        <Label htmlFor="quantity.total" className="text-xs">Total</Label>
                        <Input id="quantity.total" type="number" value={formData.quantity.total} onChange={(e) => handleInputChange(e, 'quantity.total')} required disabled={isSubmitting} min="0"/>
                    </div>
                     <div>
                        <Label htmlFor="quantity.available" className="text-xs">Available</Label>
                        <Input id="quantity.available" type="number" value={formData.quantity.available} onChange={(e) => handleInputChange(e, 'quantity.available')} required disabled={isSubmitting} min="0"/>
                    </div>
                     <div>
                        <Label htmlFor="quantity.underMaintenance" className="text-xs">In Maintenance</Label>
                        <Input id="quantity.underMaintenance" type="number" value={formData.quantity.underMaintenance} onChange={(e) => handleInputChange(e, 'quantity.underMaintenance')} disabled={isSubmitting} min="0"/>
                    </div>
                </div>
            </div>

            {/* Photo URL */}
             <div className="space-y-1 md:col-span-2">
               <Label htmlFor="photo">Photo URL</Label>
               <Input id="photo" value={formData.photo} onChange={handleInputChange} disabled={isSubmitting} placeholder="Optional: https://..."/>
           </div>

             {/* Charges */}
             <div className="md:col-span-2 space-y-2 border-t pt-4">
                 <div className="flex items-center space-x-2">
                     <Switch id="isChargeable" checked={formData.isChargeable} onCheckedChange={(checked) => handleSelectChange('isChargeable', checked)} disabled={isSubmitting}/>
                     <Label htmlFor="isChargeable">Is this equipment chargeable?</Label>
                 </div>
                 {formData.isChargeable && (
                 <div className="grid grid-cols-2 gap-4 pl-6">
                         <div className="space-y-1">
                             <Label htmlFor="charges.hourly">Hourly Rate ($)</Label>
                             <Input id="charges.hourly" type="number" value={formData.charges.hourly} onChange={(e) => handleInputChange(e, 'charges.hourly')} disabled={isSubmitting} min="0" step="0.01"/>
                         </div>
                         <div className="space-y-1">
                             <Label htmlFor="charges.deposit">Deposit ($)</Label>
                             <Input id="charges.deposit" type="number" value={formData.charges.deposit} onChange={(e) => handleInputChange(e, 'charges.deposit')} disabled={isSubmitting} min="0" step="0.01"/>
                         </div>
                 </div>
                 )}
             </div>

       </div>
       {/* Submit Button - Handled by DialogFooter in parent */}
       <Button type="submit" disabled={isSubmitting} className="hidden">Submit Trigger</Button>
    </form>
  );
}