
import type { ProcurementRequest, Role, RequestStatus } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileClock, CheckCircle2, XCircle, ListTodo } from "lucide-react";

type FilterStatus = RequestStatus | 'all' | 'pending' | 'approved-by-me';

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
      case 'district':
        return requests.filter(r => r.status === 'Pending Taluka Approval').length;
      case 'taluka':
        return requests.filter(r => r.status === 'Pending Taluka Approval').length;
      case 'base':
        return requests.filter(r => r.status.startsWith('Pending')).length;
      default:
        return 0;
    }
  }

  const getApprovedByMeCount = () => {
    if (userRole === 'taluka' || userRole === 'district' || userRole === 'state' || userRole === 'base') {
      return requests.filter(r => r.status === 'Approved').length;
    }
    return 0;
  }
  
  const totalRequests = requests.length;
  const pendingRequests = getPendingRequests();
  const approvedByMeRequests = getApprovedByMeCount();
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length;

  const getPendingLabel = () => {
    if (userRole === 'base') return 'My Pending Requests';
    if (userRole === 'taluka') return 'Pending Your Approval';
    if (userRole === 'district') return 'Total Pending Approval at Taluka Level';
    return 'Pending Approval';
  }

  const getApprovedLabel = () => {
    return 'Approved';
  }

  const cardStyle = (filter: FilterStatus) => cn(
    "transition-all cursor-pointer hover:border-primary/50",
    activeFilter === filter && "border-primary ring-2 ring-primary",
  );
  
  const handleCardClick = (filter: FilterStatus) => {
    onFilterChange(filter);
  }

  const gridClass = "grid gap-4 md:grid-cols-2 lg:grid-cols-4";

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
      
      <Card 
        className={cardStyle('pending')} 
        onClick={() => handleCardClick('pending')}
      >
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

      <Card className={cardStyle('approved-by-me')} onClick={() => handleCardClick('approved-by-me')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getApprovedLabel()}</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedByMeRequests}</div>
          <p className="text-xs text-muted-foreground">
            Completed requests
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
