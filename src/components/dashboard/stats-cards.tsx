import type { ProcurementRequest, Role, RequestStatus } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileClock, CheckCircle2, XCircle, ListTodo, ArrowUpCircle } from "lucide-react";

type FilterStatus = RequestStatus | 'all' | 'pending';

interface StatsCardsProps {
  requests: ProcurementRequest[];
  userRole: Role;
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export function StatsCards({ requests, userRole, activeFilter, onFilterChange }: StatsCardsProps) {
  
  const getPendingRequests = () => {
    switch(userRole) {
      case 'state':
        return requests.filter(r => r.status === 'Pending State Approval').length;
      case 'district':
        return requests.filter(r => r.status === 'Pending District Approval').length;
      case 'taluka':
        return requests.filter(r => r.status === 'Pending Taluka Approval').length;
      case 'base':
        return requests.filter(r => r.status.startsWith('Pending')).length;
      default:
        return 0;
    }
  }
  
  const totalRequests = requests.length;
  const pendingRequests = getPendingRequests();
  const finalApprovedRequests = requests.filter(r => r.status === 'Approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length;
  
  const forwardedRequests = requests.filter(r => 
    (userRole === 'taluka' && (r.status === 'Pending District Approval' || r.status === 'Pending State Approval')) ||
    (userRole === 'district' && r.status === 'Pending State Approval')
  ).length;

  const getPendingLabel = () => {
    if (userRole === 'base') return 'My Pending Requests';
    return 'Pending Your Approval';
  }

  const cardStyle = (filter: FilterStatus | 'forwarded') => cn(
    "transition-all cursor-pointer hover:border-primary/50",
    activeFilter === filter && "border-primary ring-2 ring-primary",
  );
  
  const handleCardClick = (filter: FilterStatus) => {
    onFilterChange(filter);
  }

  const isApprover = userRole !== 'base';

  const gridClass = isApprover
    ? "grid gap-4 md:grid-cols-2 lg:grid-cols-5"
    : "grid gap-4 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={gridClass}>
      <Card className={cardStyle('all')} onClick={() => handleCardClick('all')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRequests}</div>
          <p className="text-xs text-muted-foreground">
            {userRole === 'base' ? 'Requests you submitted' : 'Requests in your purview'}
          </p>
        </CardContent>
      </Card>
      
      <Card className={cardStyle('pending')} onClick={() => onFilterChange('pending')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getPendingLabel()}</CardTitle>
          <FileClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingRequests}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting action
          </p>
        </CardContent>
      </Card>

      {isApprover && (
        <Card className={cn("transition-all", activeFilter === 'all' ? "opacity-100" : "opacity-60")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forwarded for Approval</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{forwardedRequests}</div>
                <p className="text-xs text-muted-foreground">
                    Sent to the next level
                </p>
            </CardContent>
        </Card>
      )}

      <Card className={cardStyle('Approved')} onClick={() => handleCardClick('Approved')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Final Approved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{finalApprovedRequests}</div>
          <p className="text-xs text-muted-foreground">
            Successfully processed
          </p>
        </CardContent>
      </Card>
      <Card className={cardStyle('Rejected')} onClick={() => handleCardClick('Rejected')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rejectedRequests}</div>
          <p className="text-xs text-muted-foreground">
            Requires revision
          </p>
        </CardContent>
      </Card>
    </div>
  );
}