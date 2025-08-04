
import type { ProcurementRequest, Role } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileClock, CheckCircle2, XCircle, ListTodo } from "lucide-react";

type FilterStatus = 'all' | 'pending' | 'approved-by-me' | 'Rejected';

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
    return 'Pending Approval';
  }

  const getApprovedLabel = () => {
    return 'Approved';
  }

  const cardStyle = (filter: FilterStatus) => cn(
    "transition-all cursor-pointer hover:shadow-md",
    activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-card",
  );

  const iconStyle = (filter: FilterStatus) => cn(
    "p-2 rounded-full",
    activeFilter === filter ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary"
  )
  
  const handleCardClick = (filter: FilterStatus) => {
    onFilterChange(filter);
  }

  const cardsData = [
    {
      id: 'all',
      title: 'Total Requests',
      value: totalRequests,
      description: userRole === 'base' ? 'Requests you submitted' : 'Requests in your purview',
      Icon: ListTodo,
      iconColor: 'text-muted-foreground'
    },
    {
      id: 'pending',
      title: getPendingLabel(),
      value: pendingRequests,
      description: 'Awaiting action',
      Icon: FileClock,
      iconColor: 'text-muted-foreground'
    },
    {
      id: 'approved-by-me',
      title: getApprovedLabel(),
      value: approvedByMeRequests,
      description: 'Completed requests',
      Icon: CheckCircle2,
      iconColor: 'text-green-500'
    },
    {
      id: 'Rejected',
      title: 'Rejected',
      value: rejectedRequests,
      description: 'Requires revision',
      Icon: XCircle,
      iconColor: 'text-red-500'
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardsData.map(card => (
        <Card 
          key={card.id}
          className={cardStyle(card.id as FilterStatus)} 
          onClick={() => handleCardClick(card.id as FilterStatus)}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={cn("text-xs", activeFilter === card.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {card.description}
              </p>
            </div>
            <div className={iconStyle(card.id as FilterStatus)}>
                <card.Icon className={cn("h-5 w-5", activeFilter !== card.id && card.iconColor)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
