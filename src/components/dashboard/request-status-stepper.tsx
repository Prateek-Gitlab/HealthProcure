
import { cn } from "@/lib/utils";
import type { RequestStatus, ProcurementRequest } from "@/lib/data";
import { Check, Hourglass, ThumbsUp, X } from "lucide-react";

interface RequestStatusStepperProps {
  currentStatus: RequestStatus;
  auditLog: ProcurementRequest['auditLog'];
}

export function RequestStatusStepper({
  currentStatus,
  auditLog
}: RequestStatusStepperProps) {

  const finalStepName = currentStatus === "Approved" ? "Request Approved" : "Request Rejected";
  const steps = [
    { name: "Submitted", statuses: [] as RequestStatus[] },
    {
      name: "Taluka Approval",
      statuses: ["Pending Taluka Approval", "Approved"],
    },
    { name: finalStepName, statuses: ["Approved"] },
  ];

  const getStepStatus = (stepName: string) => {
    if (currentStatus === "Rejected") {
        if (stepName === "Submitted") return "completed";
        if (stepName === "Taluka Approval") {
            const talukaRejection = auditLog.find(l => l.action === 'rejected' && l.user.toLowerCase().includes('taluka'));
            return talukaRejection ? "rejected" : "completed";
        }
        if(stepName === "Request Rejected") return "rejected";
        return "upcoming";
    }

    if (stepName === "Submitted") return "completed";
    if (stepName === "Request Approved") {
      return currentStatus === "Approved" ? "completed" : "upcoming";
    }

    const step = steps.find((s) => s.name === stepName);
    if (!step) return "upcoming";

    if (currentStatus.replace(/ /g, '').includes(step.name.replace(/ /g, ''))) return "current";
    if (step.statuses.includes(currentStatus)) return "completed";

    return "upcoming";
  };

  const getIcon = (stepName: string) => {
    const status = getStepStatus(stepName);
    
    if (status === "rejected") return <X className="h-5 w-5" />;
    
    if (currentStatus === "Approved" && stepName === "Request Approved") {
        return <ThumbsUp className="h-5 w-5" />;
    }

    switch (status) {
      case "completed":
        return <Check className="h-5 w-5" />;
      case "current":
        return <Hourglass className="h-5 w-5 animate-spin" />;
      default:
        return <div className="h-2.5 w-2.5 bg-border rounded-full" />;
    }
  };

  const getIconColor = (stepName: string) => {
    const status = getStepStatus(stepName);
    if (status === "rejected")
      return "bg-destructive text-destructive-foreground";
    if (status === "completed") return "bg-primary text-primary-foreground";
    if (status === "current") return "bg-yellow-400 text-yellow-900";
    return "bg-secondary text-secondary-foreground";
  };

  const isStepCompleted = (stepName: string) => {
    const currentStepIndex = steps.findIndex((s) => s.name === stepName);
    if (currentStepIndex === -1) return false;
    if (currentStepIndex === 0) return true;

    if (currentStatus === "Rejected") {
        const rejectionAudit = auditLog.find(l => l.action === 'rejected');
        if(!rejectionAudit) return false;
        if(rejectionAudit.user.toLowerCase().includes('taluka')) return currentStepIndex < 1;
        return false;
    }
    
    const requiredStatusForCompletion = steps[currentStepIndex-1].statuses[0];
    if(!requiredStatusForCompletion) return true;

    const allStatuses = steps.flatMap(s => s.statuses);
    const currentStatusIndex = allStatuses.indexOf(currentStatus);
    const requiredStatusIndex = allStatuses.indexOf(requiredStatusForCompletion);

    return currentStatusIndex >= requiredStatusIndex;
  };

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-start">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn("relative", stepIdx === steps.length - 1 ? "flex-shrink-0" : "flex-1")}
          >
              {currentStatus !== 'Rejected' && stepIdx < steps.length - 1 ? (
                <div
                  className="absolute left-4 top-4 -ml-px mt-px h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div className={cn("h-full w-full", isStepCompleted(steps[stepIdx+1].name) ? 'bg-primary' : 'bg-border')} />
                </div>
              ) : null}
              <div className="relative flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 items-center justify-center rounded-full",
                    getIconColor(step.name)
                  )}
                >
                  {getIcon(step.name)}
                </div>
                <div className="text-xs text-center">
                  {step.name.split(" ").map((word) => (
                    <div key={word}>{word}</div>
                  ))}
                </div>
              </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
