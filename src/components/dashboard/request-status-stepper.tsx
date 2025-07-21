import { cn } from "@/lib/utils";
import type { RequestStatus, ProcurementRequest } from "@/lib/data";
import { Check, Hourglass, ThumbsUp, X } from "lucide-react";

interface RequestStatusStepperProps {
  currentStatus: RequestStatus;
  auditLog: ProcurementRequest['auditLog'];
}

const steps = [
  { name: "Submitted", statuses: [] as RequestStatus[] },
  {
    name: "District Approval",
    statuses: ["Pending District Approval", "Pending State Approval", "Approved"],
  },
  { name: "State Approval", statuses: ["Pending State Approval", "Approved"] },
  { name: "Fulfilled", statuses: ["Approved"] },
];

export function RequestStatusStepper({
  currentStatus,
  auditLog
}: RequestStatusStepperProps) {
  const getStepStatus = (stepName: string) => {
    if (currentStatus === "Rejected") {
      if (stepName === "Submitted") return "completed";
      if (
        stepName === "District Approval" ||
        stepName === "State Approval"
      ) {
        const lastCompletedStepBeforeRejection =
          auditLog
            .filter((l) => l.action === "Approved")
            .pop()?.user.includes("District")
            ? "District Approval"
            : "Submitted";
        const currentStepIndex = steps.findIndex((s) => s.name === stepName);
        const lastCompletedIndex = steps.findIndex(
          (s) => s.name === lastCompletedStepBeforeRejection
        );
        if (currentStepIndex <= lastCompletedIndex) return "completed";
        return "rejected";
      }
    }

    if (stepName === "Submitted") return "completed";
    if (stepName === "Fulfilled") {
      return currentStatus === "Approved" ? "completed" : "upcoming";
    }

    const step = steps.find((s) => s.name === stepName);
    if (!step) return "upcoming";

    if (currentStatus.includes(step.name)) return "current";
    if (step.statuses.includes(currentStatus)) return "completed";

    return "upcoming";
  };

  const getIcon = (stepName: string) => {
    const status = getStepStatus(stepName);
    if (currentStatus === "Rejected") {
      if (status === "rejected") return <X className="h-5 w-5" />;
      if (status === "completed") return <Check className="h-5 w-5" />;
      return <div className="h-2.5 w-2.5 bg-border rounded-full" />;
    }

    switch (status) {
      case "completed":
        return stepName === "Fulfilled" ? (
          <ThumbsUp className="h-5 w-5" />
        ) : (
          <Check className="h-5 w-5" />
        );
      case "current":
        return <Hourglass className="h-5 w-5 animate-spin" />;
      default:
        return <div className="h-2.5 w-2.5 bg-border rounded-full" />;
    }
  };

  const getIconColor = (stepName: string) => {
    const status = getStepStatus(stepName);
    if (currentStatus === "Rejected" && status === "rejected")
      return "bg-destructive text-destructive-foreground";
    if (status === "completed") return "bg-primary text-primary-foreground";
    if (status === "current") return "bg-yellow-400 text-yellow-900";
    return "bg-secondary text-secondary-foreground";
  };

  const isStepCompleted = (stepName: string) => {
    const currentStepIndex = steps.findIndex((s) => s.name === stepName);
    if (currentStepIndex === -1) return false;

    // The first step "Submitted" is always considered completed as a baseline
    if (currentStepIndex === 0) return true;

    // For rejection cases
    if (currentStatus === "Rejected") {
        const lastApprovedLog = auditLog.filter(l => l.action === 'Approved').pop();
        if (!lastApprovedLog) return false;
        
        if (lastApprovedLog.user.includes('District')) {
             return currentStepIndex <= 1;
        }
        if (lastApprovedLog.user.includes('State')) {
            return currentStepIndex <=2;
        }
        return false;
    }
    
    // For normal flow
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
              {stepIdx < steps.length - 1 ? (
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
