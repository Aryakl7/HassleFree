'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2, ImagePlus, Clock } from 'lucide-react'; // Added icons

// Constants
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const defaultTiming = { day: 'monday', openTime: '09:00', closeTime: '21:00', maintenanceTime: '' };
const defaultPhoto = { url: '', caption: '' };

export function AmenityForm({
  initialData,
  onSubmit,
  isSubmitting,
  workersList = [],
  amenityTypes = [],
  statuses = []
}) {
  const [formData, setFormData] = useState(() => getInitialState(initialData));

  function getInitialState(data) {
    const pricingData = {
        isChargeable: data?.pricing?.isChargeable || false,
        hourlyRate: data?.pricing?.hourlyRate || 0,
        monthlyRate: data?.pricing?.monthlyRate || 0,
        yearlyRate: data?.pricing?.yearlyRate || 0,
    };
    // Ensure arrays are always arrays, even if null/undefined in initialData
    const photosData = Array.isArray(data?.photos) && data.photos.length > 0 ? data.photos : [defaultPhoto];
    const timingsData = Array.isArray(data?.timings) && data.timings.length > 0 ? data.timings : [defaultTiming];
    const rulesData = Array.isArray(data?.rules) && data.rules.length > 0 ? data.rules : [''];
    const managerId = data?.amenityManager?._id || data?.amenityManager || '';

    return {
      name: data?.name || '', type: data?.type || '', description: data?.description || '',
      capacity: data?.capacity || 0, location: data?.location || '',
      photos: photosData, timings: timingsData, rules: rulesData,
      status: data?.status || 'operational', pricing: pricingData, amenityManager: managerId
    };
  }

  useEffect(() => { setFormData(getInitialState(initialData)); }, [initialData]);

  // --- Generic Input Handlers ---
  const handleInputChange = (e, path) => {
    const { id, value, type, checked } = e.target;
    const keys = path ? path.split('.') : [id];
    setFormData(prev => {
      let current = JSON.parse(JSON.stringify(prev)); // Deep copy for nested state
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
  const handleSwitchChange = (id, checked, path) => { // Specific handler for switch needed
     const keys = path ? path.split('.') : [id];
      setFormData(prev => {
       let current = JSON.parse(JSON.stringify(prev));
       let pointer = current;
       for (let i = 0; i < keys.length - 1; i++) {
         if (!pointer[keys[i]]) pointer[keys[i]] = {};
         pointer = pointer[keys[i]];
       }
       pointer[keys[keys.length - 1]] = checked; // Use checked value for switch
       return current;
     });
  };


   // --- Array Handlers ---
   // Rules
   const addRule = () => setFormData(prev => ({...prev, rules: [...(prev.rules || []), '']}));
   const updateRule = (index, value) => setFormData(prev => {
        const newRules = [...(prev.rules || [])]; newRules[index] = value; return {...prev, rules: newRules};
   });
   const removeRule = (index) => setFormData(prev => ({...prev, rules: (prev.rules || []).filter((_, i) => i !== index)}));

   // Timings
   const addTiming = () => setFormData(prev => ({...prev, timings: [...(prev.timings || []), {...defaultTiming}]}));
   const updateTiming = (index, field, value) => setFormData(prev => {
        const newTimings = [...(prev.timings || [])];
        if(newTimings[index]) { newTimings[index] = { ...newTimings[index], [field]: value }; }
        return {...prev, timings: newTimings};
   });
    const removeTiming = (index) => setFormData(prev => ({...prev, timings: (prev.timings || []).filter((_, i) => i !== index)}));

    // Photos
   const addPhoto = () => setFormData(prev => ({...prev, photos: [...(prev.photos || []), {...defaultPhoto}]}));
   const updatePhoto = (index, field, value) => setFormData(prev => {
        const newPhotos = [...(prev.photos || [])];
         if(newPhotos[index]) { newPhotos[index] = { ...newPhotos[index], [field]: value }; }
        return {...prev, photos: newPhotos};
   });
   const removePhoto = (index) => setFormData(prev => ({...prev, photos: (prev.photos || []).filter((_, i) => i !== index)}));


  const handleInternalSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (dataToSubmit.amenityManager === '') dataToSubmit.amenityManager = null;
    // Filter out empty rules/photos/timings if needed before submission
    dataToSubmit.rules = (dataToSubmit.rules || []).filter(r => r.trim() !== '');
    dataToSubmit.photos = (dataToSubmit.photos || []).filter(p => p.url.trim() !== '');
    // Add validation for timings if needed
    onSubmit(dataToSubmit);
  };

  return (
    // *** Add form ID ***
    <form onSubmit={handleInternalSubmit} id="amenity-form-id" className="space-y-4">
      {/* Basic Info Fields (Name, Type, Desc, Capacity, Location, Status, Manager) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ... Name, Type, Capacity, Location, Status, Manager fields ... (same as previous version) */}
          <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" value={formData.name} onChange={handleInputChange} required disabled={isSubmitting} /></div>
          <div className="space-y-1"><Label htmlFor="type">Type</Label><Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)} disabled={isSubmitting} required><SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{amenityTypes?.map(t => t && <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" value={formData.capacity} onChange={handleInputChange} required disabled={isSubmitting} min="0"/></div>
          <div className="space-y-1"><Label htmlFor="location">Location</Label><Input id="location" value={formData.location} onChange={handleInputChange} required disabled={isSubmitting} /></div>
          <div className="space-y-1"><Label htmlFor="status">Status</Label><Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)} disabled={isSubmitting}><SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{statuses?.map(s => s && <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label htmlFor="amenityManager">Manager</Label><Select value={formData.amenityManager} onValueChange={(value) => handleSelectChange('amenityManager', value)} disabled={isSubmitting}><SelectTrigger id="amenityManager"><SelectValue placeholder="None" /></SelectTrigger><SelectContent>{/*<SelectItem value="">None</SelectItem>*/}{workersList?.map(w => w?._id && <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="space-y-1"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={handleInputChange} required disabled={isSubmitting} /></div>

      <Separator />

      {/* Pricing Section */}
      <h4 className="font-medium">Pricing</h4>
      <div className="flex items-center space-x-2">
          <Switch id="pricing.isChargeable" checked={formData.pricing.isChargeable} onCheckedChange={(checked) => handleSwitchChange('isChargeable', checked, 'pricing')} disabled={isSubmitting}/>
          <Label htmlFor="pricing.isChargeable">Is this amenity chargeable?</Label> {/* Corrected ID association */}
      </div>
      {formData.pricing.isChargeable && ( <div className="grid grid-cols-3 gap-4 pl-6">
                <div className="space-y-1">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input id="hourlyRate" type="number" value={formData.pricing.hourlyRate} onChange={(e) => handleInputChange(e, 'pricing.hourlyRate')} disabled={isSubmitting} min="0" step="0.01"/>
                </div>
                 {/* Add Monthly/Yearly */}
           </div>
       )}

      <Separator />

      {/* Rules Section */}
      <h4 className="font-medium">Rules</h4>
      {(formData.rules || []).map((rule, index) => ( <div key={index} className="flex items-center gap-2">
                <Input
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    placeholder={`Rule ${index + 1}`}
                    disabled={isSubmitting}
                    className="flex-grow"
                />
                {formData.rules.length > 1 && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(index)} disabled={isSubmitting}>
                         <Trash2 className="h-4 w-4 text-destructive"/>
                     </Button>
                )}
            </div>
       ))}
      <Button type="button" variant="outline" size="sm" onClick={addRule} disabled={isSubmitting}><PlusCircle className="h-4 w-4 mr-1"/> Add Rule</Button>

      <Separator />

      {/* --- Timings Section --- */}
      <h4 className="font-medium flex items-center"><Clock className="h-4 w-4 mr-2"/> Timings</h4>
      {(formData.timings || []).map((timing, index) => (
          <div key={`timing-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border p-3 rounded-md relative">
               {/* Day Select */}
               <div className="space-y-1">
                   <Label htmlFor={`timing-${index}-day`} className="text-xs">Day</Label>
                   <Select
                       value={timing.day || ''}
                       onValueChange={(value) => updateTiming(index, 'day', value)}
                       disabled={isSubmitting}
                       required
                    >
                       <SelectTrigger id={`timing-${index}-day`}><SelectValue placeholder="Day" /></SelectTrigger>
                       <SelectContent>
                           {daysOfWeek.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                       </SelectContent>
                   </Select>
               </div>
                {/* Open Time */}
               <div className="space-y-1">
                   <Label htmlFor={`timing-${index}-openTime`} className="text-xs">Open Time</Label>
                   <Input id={`timing-${index}-openTime`} type="time" value={timing.openTime || ''} onChange={(e) => updateTiming(index, 'openTime', e.target.value)} disabled={isSubmitting} required/>
               </div>
                {/* Close Time */}
               <div className="space-y-1">
                   <Label htmlFor={`timing-${index}-closeTime`} className="text-xs">Close Time</Label>
                   <Input id={`timing-${index}-closeTime`} type="time" value={timing.closeTime || ''} onChange={(e) => updateTiming(index, 'closeTime', e.target.value)} disabled={isSubmitting} required/>
               </div>
                {/* Maintenance Time (Optional) */}
               <div className="space-y-1">
                   <Label htmlFor={`timing-${index}-maintenanceTime`} className="text-xs">Maint. Time (Opt.)</Label>
                   <Input id={`timing-${index}-maintenanceTime`} type="time" value={timing.maintenanceTime || ''} onChange={(e) => updateTiming(index, 'maintenanceTime', e.target.value)} disabled={isSubmitting} />
               </div>
                {/* Remove Button */}
                {(formData.timings?.length || 0) > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTiming(index)} disabled={isSubmitting} title="Remove Timing" className="self-end">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                )}
          </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addTiming} disabled={isSubmitting}>
           <PlusCircle className="h-4 w-4 mr-1"/> Add Timing Slot
       </Button>

       <Separator />

      {/* --- Photos Section --- */}
       <h4 className="font-medium flex items-center"><ImagePlus className="h-4 w-4 mr-2"/> Photos</h4>
        {(formData.photos || []).map((photo, index) => (
            <div key={`photo-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border p-3 rounded-md relative">
                {/* URL Input */}
                <div className="space-y-1 md:col-span-3">
                   <Label htmlFor={`photo-${index}-url`} className="text-xs">Image URL</Label>
                   <Input id={`photo-${index}-url`} value={photo.url || ''} onChange={(e) => updatePhoto(index, 'url', e.target.value)} disabled={isSubmitting} placeholder="https://example.com/image.jpg" required={index===0} /> {/* Maybe only first required? */}
               </div>
               {/* Caption Input */}
               <div className="space-y-1 md:col-span-2">
                   <Label htmlFor={`photo-${index}-caption`} className="text-xs">Caption (Optional)</Label>
                   <Input id={`photo-${index}-caption`} value={photo.caption || ''} onChange={(e) => updatePhoto(index, 'caption', e.target.value)} disabled={isSubmitting} placeholder="E.g., Poolside view"/>
               </div>
                {/* Remove Button */}
                {(formData.photos?.length || 0) > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePhoto(index)} disabled={isSubmitting} title="Remove Photo" className="self-end justify-self-end md:justify-self-center">
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                )}
            </div>
        ))}
       <Button type="button" variant="outline" size="sm" onClick={addPhoto} disabled={isSubmitting}>
           <PlusCircle className="h-4 w-4 mr-1"/> Add Photo URL
       </Button>
       {/* TODO: Consider implementing actual file uploads instead of just URLs */}

      {/* Hidden submit button for triggering via footer */}
      <button type="submit" disabled={isSubmitting} className="hidden">Internal Submit</button>
    </form>
  );
}