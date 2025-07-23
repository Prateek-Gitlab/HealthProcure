
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AreaChart } from "lucide-react";

export function PlaceholderChart() {
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
