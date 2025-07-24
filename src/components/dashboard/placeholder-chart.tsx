
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AreaChart, IndianRupee } from "lucide-react";
import type { User } from "@/lib/data";

interface PlaceholderChartProps {
    currentUser: User;
    totalApprovedBudget: number;
}

export function PlaceholderChart({ currentUser, totalApprovedBudget }: PlaceholderChartProps) {

    const formatBudget = (amount: number) => {
        if (amount >= 10000000) { // 1 Crore
            return `${(amount / 10000000).toFixed(2)} Cr.`;
        }
        if (amount >= 100000) { // 1 Lakh
            return `${(amount / 100000).toFixed(2)} Lacs`;
        }
        return amount.toLocaleString('en-IN');
    };

    if (currentUser.role === 'state') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Budget Overview</CardTitle>
                    <CardDescription>Total budgetary outlay required based on approved requests</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[300px] bg-secondary rounded-md p-6">
                        <div className="flex items-center justify-center bg-primary/10 text-primary p-4 rounded-full mb-4">
                            <IndianRupee className="w-12 h-12" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Total Budget for Approved Requests</p>
                        <p className="text-4xl font-bold">
                            {`₹${formatBudget(totalApprovedBudget)}`}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Placeholder Chart</CardTitle>
                <CardDescription>Awaiting future implementation.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-[300px] bg-secondary rounded-md">
                    <AreaChart className="w-16 h-16 text-muted-foreground/50" />
                    <p className="text-muted-foreground mt-4">Chart coming soon</p>
                </div>
            </CardContent>
        </Card>
    );
}
