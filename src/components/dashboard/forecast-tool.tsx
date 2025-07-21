"use client";

import { useState } from "react";
import { handleForecastDemand } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sampleHistoricalData = `item,quantity,date
Nitrile Examination Gloves,4500,2023-01-15
Ibuprofen 200mg,9000,2023-01-20
Surgical Masks,18000,2023-02-10
Nitrile Examination Gloves,4800,2023-04-12
Ibuprofen 200mg,11000,2023-04-18`;

const sampleCurrentRequests = `item,quantity,justification
Nitrile Examination Gloves,5000,Quarterly restock
Ibuprofen 200mg,10000,Seasonal flu outbreak
Surgical Masks,20000,Replenishing stock`;


export function ForecastTool() {
  const [historicalData, setHistoricalData] = useState(sampleHistoricalData);
  const [currentRequests, setCurrentRequests] = useState(sampleCurrentRequests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setForecast(null);

    const result = await handleForecastDemand({ historicalData, currentRequests });

    if (result.success) {
      setForecast(result.data.forecastSummary);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="historical-data">Historical Procurement Data (CSV)</Label>
          <Textarea
            id="historical-data"
            value={historicalData}
            onChange={(e) => setHistoricalData(e.target.value)}
            rows={10}
            placeholder="item,quantity,date..."
            className="font-code text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current-requests">Current Procurement Requests (CSV)</Label>
          <Textarea
            id="current-requests"
            value={currentRequests}
            onChange={(e) => setCurrentRequests(e.target.value)}
            rows={10}
            placeholder="item,quantity,justification..."
            className="font-code text-xs"
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isLoading || !historicalData || !currentRequests}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Generate Forecast"
            )}
          </Button>
        </div>
      </form>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {forecast && (
        <Card className="bg-primary/5">
            <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="w-6 h-6 text-primary"/>
                <CardTitle>AI-Generated Forecast Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{forecast}</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
