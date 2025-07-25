
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest, ProcurementCategory } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RequestedBudgetTableProps {
  requests: ProcurementRequest[];
}

interface AggregatedItem {
  itemName: string;
  totalQuantity: number;
  totalCost: number;
}

type AggregatedData = Record<ProcurementCategory, AggregatedItem[]>;

export function RequestedBudgetTable({ requests }: RequestedBudgetTableProps) {
  
  const aggregatedData: AggregatedData = useMemo(() => {
    // Only include requests that are not rejected.
    const relevantRequests = requests.filter(r => r.status !== 'Rejected');
    
    const itemsMap = new Map<string, AggregatedItem & { category: ProcurementCategory }>();

    relevantRequests.forEach(request => {
      const existingItem = itemsMap.get(request.itemName);
      const cost = (request.pricePerUnit || 0) * request.quantity;

      if (existingItem) {
        existingItem.totalQuantity += request.quantity;
        existingItem.totalCost += cost;
      } else {
        itemsMap.set(request.itemName, {
          itemName: request.itemName,
          totalQuantity: request.quantity,
          totalCost: cost,
          category: request.category,
        });
      }
    });
    
    const allItems = Array.from(itemsMap.values());
    
    return allItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push({
            itemName: item.itemName,
            totalQuantity: item.totalQuantity,
            totalCost: item.totalCost
        });
        // Sort items within category by total cost
        acc[item.category].sort((a, b) => b.totalCost - a.totalCost);
        return acc;
    }, {} as AggregatedData);

  }, [requests]);

  const aggregatedCategories = Object.keys(aggregatedData) as ProcurementCategory[];
  
  const totalBudget = useMemo(() => {
    return Object.values(aggregatedData)
      .flat()
      .reduce((sum, item) => sum + item.totalCost, 0);
  }, [aggregatedData]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>My Requested Budget</CardTitle>
                <CardDescription>
                A summary of the total estimated budget for all items you have requested.
                </CardDescription>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-full max-h-96">
            {aggregatedCategories.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                    {aggregatedCategories.map(category => {
                        const categoryTotal = aggregatedData[category].reduce((sum, item) => sum + item.totalCost, 0);
                        return (
                        <AccordionItem value={category} key={category} className="border rounded-md">
                            <AccordionTrigger className="p-4 text-base font-medium hover:no-underline">
                                <div className="flex justify-between w-full pr-4">
                                    <span>{category}</span>
                                    <span className="font-semibold">₹{categoryTotal.toLocaleString('en-IN')}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Total Quantity</TableHead>
                                            <TableHead className="text-right">Estimated Cost (₹)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aggregatedData[category].map(item => (
                                            <TableRow key={item.itemName}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="text-right">{item.totalQuantity.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">{item.totalCost.toLocaleString('en-IN')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    )})}
                </Accordion>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">You have not submitted any requests yet.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
