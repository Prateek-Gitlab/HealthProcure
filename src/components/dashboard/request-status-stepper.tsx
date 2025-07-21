import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/data";
import { Check, Hourglass, Send, X, ThumbsUp } from "lucide-react";

interface RequestStatusStepperProps {
  currentStatus: RequestStatus;
}

const steps = [
  { name: "Submitted", statuses: [] as RequestStatus[] },
  { name: "District Approval", statuses: ["Pending District Approval", "Pending State Approval", "Approved"] },
  { name: "State Approval", statuses: ["Pending State Approval", "Approved"] },
  { name: "Fulfilled", statuses: ["Approved"] },
];

export function RequestStatusStepper({ currentStatus }: RequestStatusStepperProps) {
  const getStepStatus = (stepName: string) => {
    if (currentStatus === "Rejected") {
        const rejectedStepIndex = steps.findIndex(step => step.statuses.includes(currentStatus));
        const currentStepIndex = steps.findIndex(step => step.name === stepName);
        if(currentStepIndex < rejectedStepIndex) return 'completed';
        if(stepName === "District Approval" || stepName === "State Approval") return 'rejected';
    }

    if (stepName === "Submitted") return 'completed';
    if (stepName === "Fulfilled") {
        return currentStatus === "Approved" ? "completed" : "upcoming";
    }

    const step = steps.find(s => s.name === stepName);
    if (!step) return "upcoming";

    if (currentStatus.includes(step.name)) return 'current';
    if (step.statuses.includes(currentStatus)) return 'completed';
    
    return "upcoming";
  };
  
  const getIcon = (stepName: string) => {
    const status = getStepStatus(stepName);
    if (currentStatus === "Rejected") {
        if(status === 'rejected') return <X className="h-5 w-5" />;
        if(status === 'completed') return <Check className="h-5 w-5" />;
        return <div className="h-2.5 w-2.5 bg-border rounded-full" />;
    }
    
    switch (status) {
      case "completed":
        return stepName === "Fulfilled" ? <ThumbsUp className="h-5 w-5" /> : <Check className="h-5 w-5" />;
      case "current":
        return <Hourglass className="h-5 w-5 animate-spin" />;
      default:
        return <div className="h-2.5 w-2.5 bg-border rounded-full" />;
    }
  };
  
  const getIconColor = (stepName: string) => {
     const status = getStepStatus(stepName);
     if (currentStatus === 'Rejected' && (status === 'rejected')) return "bg-destructive text-destructive-foreground";
     if (status === 'completed') return "bg-primary text-primary-foreground";
     if (status === 'current') return "bg-yellow-400 text-yellow-900";
     return "bg-secondary text-secondary-foreground";
  }

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
              "relative"
            )}
          >
            <>
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className={cn("h-0.5 w-full", getStepStatus(step.name) === 'completed' || getStepStatus(steps[stepIdx+1]?.name) === 'completed' ? 'bg-primary' : 'bg-border')} />
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full">
                <span className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                    getIconColor(step.name)
                )}>
                    {getIcon(step.name)}
                </span>
              </div>
              <p className="text-xs text-center mt-1">{step.name}</p>
            </>
          </li>
        ))}
      </ol>
    </nav>
  );
}
