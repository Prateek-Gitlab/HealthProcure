
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
    "transition-all duration-200 cursor-pointer hover:scale-105 animate-fade-in",
    activeFilter === filter
      ? "bg-primary text-white shadow-custom-lg border-primary/20"
      : "shadow-custom hover:shadow-custom-md border-border",
  );

  const iconStyle = (filter: FilterStatus) => cn(
    "p-2 rounded-custom transition-all duration-200",
    activeFilter === filter
      ? "bg-white/20 text-white"
      : "bg-secondary hover:bg-secondary-hover"
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
      iconColor: 'text-info',
      gradient: 'from-info/10 to-info/5'
    },
    {
      id: 'pending',
      title: getPendingLabel(),
      value: pendingRequests,
      description: 'Awaiting action',
      Icon: FileClock,
      iconColor: 'text-warning',
      gradient: 'from-warning/10 to-warning/5'
    },
    {
      id: 'approved-by-me',
      title: getApprovedLabel(),
      value: approvedByMeRequests,
      description: 'Completed requests',
      Icon: CheckCircle2,
      iconColor: 'text-success',
      gradient: 'from-success/10 to-success/5'
    },
    {
      id: 'Rejected',
      title: 'Rejected',
      value: rejectedRequests,
      description: 'Requires revision',
      Icon: XCircle,
      iconColor: 'text-destructive',
      gradient: 'from-destructive/10 to-destructive/5'
    },
  ];

  return (
    <div className="grid gap-lg md:grid-cols-2 lg:grid-cols-4">
      {cardsData.map((card, index) => (
        <Card
          key={card.id}
          variant={activeFilter === card.id ? "default" : "elevated"}
          className={cn(
            cardStyle(card.id as FilterStatus),
            activeFilter !== card.id && `bg-gradient-to-br ${card.gradient}`,
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={() => handleCardClick(card.id as FilterStatus)}
        >
          <CardHeader className="pb-2">
            <CardTitle className={cn(
              "text-sm font-medium font-headline transition-colors duration-200",
              activeFilter === card.id ? "text-white" : "text-foreground"
            )}>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className={cn(
                "text-3xl font-bold font-headline transition-all duration-200",
                activeFilter === card.id ? "text-white" : "text-foreground"
              )}>
                {card.value}
              </div>
              <p className={cn(
                "text-xs leading-relaxed transition-colors duration-200",
                activeFilter === card.id ? "text-white/90" : "text-muted-foreground"
              )}>
                {card.description}
              </p>
            </div>
            <div className={cn(
              iconStyle(card.id as FilterStatus),
              "transform transition-transform duration-200 hover:scale-110"
            )}>
              <card.Icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                activeFilter === card.id ? "text-white" : card.iconColor
              )} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
