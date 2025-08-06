
import { cn } from "@/lib/utils";
import type { RequestStatus, ProcurementRequest } from "@/lib/data";
import { Check, X } from "lucide-react";

interface RequestStatusStepperProps {
  currentStatus: RequestStatus;
  auditLog: ProcurementRequest["auditLog"];
}

/**
 * Modern horizontal stepper with gradient progress bar and pill steps.
 * - Minimal icons
 * - Clear progress indicator
 * - Compact labels
 */
export function RequestStatusStepper({
  currentStatus,
  auditLog,
}: RequestStatusStepperProps) {
  const steps = [
    { key: "submitted", label: "Request Submitted" },
    { key: "taluka", label: "THO Status" },
    { key: "final", label: currentStatus === "Approved" ? "Approved" : "Rejected" },
  ] as const;

  const indexForStatus = () => {
    if (currentStatus === "Rejected") return 2;
    if (currentStatus === "Approved") return 2;
    // Pending THO Approval Status
    return 1;
  };

  const activeIndex = indexForStatus() as 0 | 1 | 2;

  const isRejected = currentStatus === "Rejected";
  // Completed means the step index is strictly before the active one
  const isCompleted = (idx: number) => idx < activeIndex;
  const isCurrent = (idx: number) => idx === activeIndex;

  // THO pending is when we're on the THO step (index 1) and not approved/rejected
  const isTHOPending = activeIndex === 1 && !isRejected && currentStatus !== "Approved";

  const progressWidth = (() => {
    switch (activeIndex) {
      case 0:
        return "10%";
      case 1:
        return "55%";
      default:
        return "100%";
    }
  })();

  return (
    <div className="w-full">
      {/* Gradient progress rail */}
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden mb-6">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all",
            isRejected ? "bg-destructive" : "bg-gradient-primary"
          )}
          style={{ width: progressWidth }}
        />
      </div>

      {/* Pills */}
      <div className="grid grid-cols-3 gap-3">
        {steps.map((s, idx) => {
          const pillBase =
            "flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium border transition-all";
          const pillState = isRejected
            ? isCompleted(idx)
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : isCurrent(idx)
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-muted text-muted-foreground border-border"
            : // Non-rejected flow
            isCompleted(idx)
            ? "bg-primary/10 text-primary border-primary/30"
            : isCurrent(idx)
            ? // Highlight current step:
              // - THO when pending: soft yellow
              // - Submitted when current: blue emphasis for clarity
              (idx === 1 && isTHOPending)
                ? "bg-warning/20 text-warning border-warning/40"
                : idx === 0
                ? "bg-info text-info-foreground border-info"
                : "bg-primary text-primary-foreground border-primary"
            : "bg-muted text-muted-foreground border-border";

          return (
            <div key={s.key} className={cn(pillBase, pillState)}>
              {isRejected && idx === activeIndex ? (
                <X className="h-4 w-4" />
              ) : isCompleted(idx) || isCurrent(idx) ? (
                <Check className="h-4 w-4" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-border" />
              )}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Optional compact audit context */}
      {auditLog?.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground">
          Last action:{" "}
          <span className="font-medium">
            {auditLog[auditLog.length - 1].user}
          </span>{" "}
          {auditLog[auditLog.length - 1].action.toLowerCase()} •{" "}
          {new Date(auditLog[auditLog.length - 1].date).toLocaleString()}
        </div>
      )}
    </div>
  );
}
