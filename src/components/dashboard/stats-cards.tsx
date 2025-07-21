import type { ProcurementRequest, Role } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileClock, CheckCircle2, XCircle, ListTodo } from "lucide-react";

interface StatsCardsProps {
  requests: ProcurementRequest[];
  userRole: Role;
}

export function StatsCards({ requests, userRole }: StatsCardsProps) {
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status.includes('Pending')).length;
  const approvedRequests = requests.filter(r => r.status === 'Approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length;

  const getPendingLabel = () => {
    if (userRole === 'base') return 'Pending Approval';
    if (userRole === 'district') return 'Pending Your Approval';
    if (userRole === 'state') return 'Pending Your Approval';
    return 'Pending';
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
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
      <Card>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedRequests}</div>
          <p className="text-xs text-muted-foreground">
            Successfully processed
          </p>
        </CardContent>
      </Card>
      <Card>
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
