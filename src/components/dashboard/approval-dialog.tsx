
"use client";

import { useState } from "react";
import type { ProcurementRequest, User } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalDialogProps {
  request: ProcurementRequest;
  user: User;
  action: "Approve" | "Reject";
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: (updatedRequest: ProcurementRequest) => Promise<void>;
}

export function ApprovalDialog({
  request,
  user,
  action,
  isOpen,
  onOpenChange,
  onUpdate
}: ApprovalDialogProps) {
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleConfirm = async () => {
    let newStatus = request.status;
    if (action === "Reject") {
        newStatus = "Rejected";
    } else {
        if (user.role === 'district') {
            newStatus = "Pending State Approval";
        } else if (user.role === 'state') {
            newStatus = "Approved";
        }
    }
    
    const updatedRequest = {
        ...request,
        status: newStatus,
        auditLog: [
            ...request.auditLog,
            {
                action: action === "Approve" ? `Approved by ${user.role}` : `Rejected by ${user.role}`,
                user: user.name,
                date: new Date().toISOString(),
                comment: comment || undefined,
            }
        ]
    };
    
    await onUpdate(updatedRequest);
    
    toast({
        title: `Request ${action === "Approve" ? 'Approved' : 'Rejected'}`,
        description: `Request ${request.id} has been successfully updated.`
    });

    onOpenChange(false);
    setComment("");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Request {action}</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to {action.toLowerCase()} request{" "}
            <span className="font-bold">{request.id}</span>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
            <Label htmlFor="comment">Add a comment (optional)</Label>
            <Textarea 
                id="comment"
                placeholder="Provide a reason or comment for your decision..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={action === 'Reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            Confirm {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
