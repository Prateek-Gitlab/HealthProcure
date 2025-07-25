
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest, User, ProcurementCategory } from '@/lib/data';
import { useHierarchy } from '@/hooks/use-hierarchy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ApprovedItemsTableProps {
  requests: ProcurementRequest[];
  currentUser: User;
}

interface AggregatedItem {
  itemName: string;
  totalQuantity: number;
  totalCost: number;
}

type AggregatedData = Record<ProcurementCategory, AggregatedItem[]>;

export function ApprovedItemsTable({ requests, currentUser }: ApprovedItemsTableProps) {
  const { getSubordinateIds } = useHierarchy();

  const subordinateIds = useMemo(() => {
    return getSubordinateIds(currentUser.id);
  }, [currentUser.id, getSubordinateIds]);

  const aggregatedData: AggregatedData = useMemo(() => {
    const approvedRequests = requests.filter(r => 
      r.status === 'Approved' && 
      (subordinateIds.includes(r.submittedBy) || r.submittedBy === currentUser.id)
    );

    const itemsMap = new Map<string, AggregatedItem & { category: ProcurementCategory }>();

    approvedRequests.forEach(request => {
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


  }, [requests, currentUser.id, subordinateIds]);

  const aggregatedCategories = Object.keys(aggregatedData) as ProcurementCategory[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Items Summary</CardTitle>
        <CardDescription>
          A summary of all approved items within your district, grouped by category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            {aggregatedCategories.length > 0 ? (
                <Accordion type="multiple" className="w-full space-y-2">
                    {aggregatedCategories.map(category => (
                        <AccordionItem value={category} key={category} className="border rounded-md">
                            <AccordionTrigger className="p-4 text-base font-medium hover:no-underline">
                                {category}
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
                    ))}
                </Accordion>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No approved requests with items found.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
