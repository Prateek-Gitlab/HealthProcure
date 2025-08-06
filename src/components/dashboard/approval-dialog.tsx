
"use client";

import { useState } from "react";
import type { ProcurementRequest, User } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Loader2 } from "lucide-react";
import { updateRequest as updateRequestAction } from "@/lib/actions";

interface ApprovalDialogProps {
  request: ProcurementRequest;
  user: User;
  action: "Approve" | "Reject";
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: (updatedRequest: ProcurementRequest) => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    let newStatus = request.status;
    let actionMessage = "";

    if (action === "Reject") {
        newStatus = "Rejected";
        actionMessage = "rejected";
    } else {
        actionMessage = "approved";
        if (user.role === 'taluka') {
            newStatus = "Approved";
        }
    }
    
    const updatedRequest = {
        ...request,
        status: newStatus,
        auditLog: [
            ...request.auditLog,
            {
                action: actionMessage,
                user: user.name,
                date: new Date().toISOString(),
                comment: comment || undefined,
            }
        ]
    };
    
    try {
        await updateRequestAction(updatedRequest, user.id);
        onUpdate(updatedRequest);
        
        toast({
            title: `Request ${action === "Approve" ? 'Approved' : 'Rejected'}`,
            description: `Request ${request.id} has been successfully updated.`
        });

        onOpenChange(false);
        setComment("");
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update the request. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-custom shadow-custom-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gradient">Confirm Request {action}</AlertDialogTitle>
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
            disabled={isSubmitting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={cn(
              "focus-ring",
              action === "Reject"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-success text-success-foreground hover:bg-success/90"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm ${action}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
