// components/admin/UserForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function UserForm({ initialData, onSubmit, isSubmitting, isEditing = false }) {
  // Initialize state based on whether it's an edit or add operation
  const [formData, setFormData] = useState(() => getInitialState(initialData));

  function getInitialState(data) {
    return {
      name: data?.name || '',
      email: data?.email || '',
      password: '', // Always start empty, required only for creation
      houseNo: data?.houseNo || '',
      flatNo: data?.flatNo || '',
      age: data?.age || '',
      noOfCars: data?.noOfCars || 0,
      carNumbers: data?.carNumbers || [],
      photo: { url: data?.photo?.url || '', isVerified: data?.photo?.isVerified || false },
    };
  }

  // Effect to update form when editing different users
  useEffect(() => {
    setFormData(getInitialState(initialData));
  }, [initialData]); // Rerun when initialData changes

   // Generic change handler for nested state
   const handleChange = (e, path) => {
     const { id, value, type, checked } = e.target;
     const keys = path ? path.split('.') : [id];
     setFormData(prev => {
       // Use deep copy ONLY if modifying nested objects/arrays directly
       // For simple fields or full object replacements, shallow copy is fine
       let current = {...prev}; // Shallow copy is sufficient here
       let pointer = current;
       for (let i = 0; i < keys.length - 1; i++) {
         // Ensure nested path exists, create if not (important for 'photo.url', etc.)
         // Make sure to copy the object before modifying if needed
         pointer[keys[i]] = { ...(pointer[keys[i]] || {}) };
         pointer = pointer[keys[i]];
       }
       pointer[keys[keys.length - 1]] = type === 'checkbox' ? checked : type === 'number' ? Number(value) || 0 : value;
       return current;
     });
   };

   // Car Number Specific Handler
   const handleCarNumberChange = (index, value) => {
       setFormData(prev => {
           const newCarNumbers = [...(prev.carNumbers || [])]; // Handle case where carNumbers might be undefined initially
           while (newCarNumbers.length <= index) { newCarNumbers.push(''); } // Ensure array is long enough
           newCarNumbers[index] = value;
           return {...prev, carNumbers: newCarNumbers};
       })
   }

   // Adjust car number inputs based on noOfCars
    useEffect(() => {
        const numCars = Number(formData.noOfCars) || 0;
        const currentCarNumbers = formData.carNumbers || [];
        let needsUpdate = false;
        let updatedCarNumbers = [...currentCarNumbers];

        if (currentCarNumbers.length < numCars) {
            const needed = numCars - currentCarNumbers.length;
            updatedCarNumbers = [...currentCarNumbers, ...Array(needed).fill('')];
            needsUpdate = true;
        } else if (currentCarNumbers.length > numCars) {
             updatedCarNumbers = currentCarNumbers.slice(0, numCars);
             needsUpdate = true;
        }

        if(needsUpdate) {
            setFormData(prev => ({...prev, carNumbers: updatedCarNumbers}));
        }
    }, [formData.noOfCars]); // Rerun only when number of cars changes


  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent default browser form submission
    const dataToSubmit = { ...formData };

    // Don't submit password if editing or if it's empty during creation (rely on backend validation)
    if (isEditing || !dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    // Filter out empty car numbers before submitting
    dataToSubmit.carNumbers = (dataToSubmit.carNumbers || []).filter(cn => cn && cn.trim() !== '');

    console.log("Submitting from UserForm:", dataToSubmit); // Debug log
    onSubmit(dataToSubmit); // Call the parent's submit handler
  };

  return (
    // Add the ID here for the footer button's 'form' attribute
    <form onSubmit={handleFormSubmit} id="user-form-id" className="space-y-4">
      {/* Name, Email, Password (only on create) */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1">
               <Label htmlFor="name">Name</Label>
               <Input id="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
           </div>
           <div className="space-y-1">
               <Label htmlFor="email">Email</Label>
               <Input id="email" type="email" value={formData.email} onChange={handleChange} required disabled={isSubmitting || isEditing} />
               {isEditing && <p className="text-xs text-muted-foreground">Email cannot be changed.</p>}
           </div>
       </div>

       {!isEditing && (
            <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} required={!isEditing} disabled={isSubmitting} placeholder="Required for new user"/>
            </div>
       )}

       {/* Address Info */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1">
               <Label htmlFor="houseNo">House No</Label>
               <Input id="houseNo" value={formData.houseNo} onChange={handleChange} required disabled={isSubmitting} />
           </div>
            <div className="space-y-1">
               <Label htmlFor="flatNo">Flat No</Label>
               <Input id="flatNo" value={formData.flatNo} onChange={handleChange} required disabled={isSubmitting} />
           </div>
       </div>

      {/* Other Info */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1">
               <Label htmlFor="age">Age</Label>
               <Input id="age" type="number" value={formData.age} onChange={handleChange} disabled={isSubmitting} min="0"/>
           </div>
            <div className="space-y-1">
               <Label htmlFor="noOfCars">Number of Cars</Label>
               <Input id="noOfCars" type="number" value={formData.noOfCars} onChange={handleChange} required disabled={isSubmitting} min="0"/>
           </div>
       </div>

       {/* Car Numbers */}
        {formData.noOfCars > 0 && (
            <div className="space-y-2">
                <Label>Car Numbers</Label>
                {Array.from({ length: formData.noOfCars }).map((_, index) => (
                    <Input
                        key={`car-${index}`}
                        value={formData.carNumbers?.[index] || ''}
                        onChange={(e) => handleCarNumberChange(index, e.target.value)}
                        placeholder={`Car ${index + 1} Number`}
                        disabled={isSubmitting}
                    />
                ))}
            </div>
        )}

       {/* Photo Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
           <div className="space-y-1">
               <Label htmlFor="photoUrl">Photo URL</Label>
               {/* Use id="photo.url" to match nested state */}
               <Input id="photo.url" value={formData.photo.url} onChange={(e) => handleChange(e, 'photo.url')} disabled={isSubmitting} placeholder="https://..."/>
           </div>
            {isEditing && ( // Only show verification toggle when editing
                <div className="flex items-center space-x-2 pt-5">
                    {/* Use id="photo.isVerified" */}
                    <Switch
                        id="photo.isVerified"
                        checked={formData.photo.isVerified}
                        onCheckedChange={(checked) => handleChange({ target: { id: 'photo.isVerified', type: 'checkbox', checked } }, 'photo.isVerified')}
                        disabled={isSubmitting}
                    />
                    <Label htmlFor="photo.isVerified">Photo Verified?</Label>
                </div>
            )}
       </div>
    </form>
  );
}