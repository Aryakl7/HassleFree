// FILE: components/admin/AssignWorkerDialog.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

const complaintStatuses = ['pending', 'assigned', 'in-progress', 'material_needed', 'resolved', 'closed'];

export function AssignWorkerDialog({
  complaint,
  workersList = [],
  onSubmit,
  isOpen,
  onOpenChange,
  isSubmitting,
  error
}) {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (isOpen && complaint) {
      const currentWorkerId = complaint.assignedWorker?._id || complaint.assignedWorker || '';
      setSelectedWorkerId(currentWorkerId);
      setSelectedStatus(complaint.status || 'pending');
    } else if (!isOpen) {
      setSelectedWorkerId('');
      setSelectedStatus('');
    }
  }, [isOpen, complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = {};
    const originalWorkerId = complaint?.assignedWorker?._id || complaint?.assignedWorker || '';

    // If selectedWorkerId is "", it means "Unassigned" was chosen via placeholder, send null
    if (selectedWorkerId !== originalWorkerId) {
        updateData.assignedWorker = selectedWorkerId || null;
    }

    if (selectedStatus !== complaint?.status) {
      updateData.status = selectedStatus;
    }

    if (updateData.assignedWorker && updateData.assignedWorker !== null &&
        (complaint?.status === 'pending' && selectedStatus === 'pending')) {
        updateData.status = 'assigned';
    } else if (updateData.assignedWorker === null && complaint?.status === 'assigned' && selectedStatus === 'assigned'){
        updateData.status = 'pending';
    }

    if (Object.keys(updateData).length > 0) {
      onSubmit(complaint._id, updateData);
    } else {
      onOpenChange(false);
    }
  };

  if (!complaint && isOpen) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent><DialogHeader><DialogTitle>Error</DialogTitle><DialogDescription>Complaint data not available.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter></DialogContent>
        </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Complaint Status / Assign Worker</DialogTitle>
          <DialogDescription>For complaint: <span className="font-semibold">{complaint?.title || 'N/A'}</span></DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="assign-status-dialog">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isSubmitting}>
              <SelectTrigger id="assign-status-dialog"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {(complaintStatuses || []).map(s => (
                  s && <SelectItem key={`status-dialog-${s}`} value={s}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assign-worker-dialog">Assign Worker</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId} disabled={isSubmitting}>
              <SelectTrigger id="assign-worker-dialog">
                {/* The placeholder is shown when selectedWorkerId is "" */}
                <SelectValue placeholder="Unassigned / Select Worker" />
              </SelectTrigger>
              <SelectContent>
                {/* DO NOT add <SelectItem value="">Unassigned</SelectItem> here */}
                {(workersList || []).map((w, index) => {
                  const workerValue = w?._id ? String(w._id) : null;
                  if (!workerValue) {
                    console.warn(`[AssignWorkerDialog] Skipping worker at index ${index} due to invalid ID:`, w);
                    return null;
                  }
                  return (
                    <SelectItem key={workerValue} value={workerValue}>
                      {w.name || 'Unnamed Worker'} ({w.department || 'No Dept.'})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ErrorDisplay title="Update Error" message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={16} className="mr-2"/> : null} Update Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}