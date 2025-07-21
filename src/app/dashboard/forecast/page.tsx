import { ForecastTool } from "@/components/dashboard/forecast-tool";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function ForecastPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg flex-shrink-0">
                    <LineChart className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Demand Forecasting Tool</h1>
                    <p className="text-muted-foreground mt-1">
                        Use historical data and current requests to generate an AI-powered demand forecast.
                    </p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Generate Forecast</CardTitle>
                    <CardDescription>
                        Paste data in CSV format into the fields below to analyze trends and predict future needs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ForecastTool />
                </CardContent>
            </Card>
        </div>
    );
}
