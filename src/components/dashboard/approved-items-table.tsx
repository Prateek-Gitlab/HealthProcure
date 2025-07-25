
"use client";

import { useMemo } from 'react';
import type { ProcurementRequest, User } from '@/lib/data';
import { useHierarchy } from '@/hooks/use-hierarchy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ApprovedItemsTableProps {
  requests: ProcurementRequest[];
  currentUser: User;
}

interface AggregatedItem {
  itemName: string;
  totalQuantity: number;
  totalCost: number;
}

export function ApprovedItemsTable({ requests, currentUser }: ApprovedItemsTableProps) {
  const { getSubordinateIds } = useHierarchy();

  const subordinateIds = useMemo(() => {
    return getSubordinateIds(currentUser.id);
  }, [currentUser.id, getSubordinateIds]);

  const aggregatedData: AggregatedItem[] = useMemo(() => {
    const approvedRequests = requests.filter(r => 
      r.status === 'Approved' && 
      (subordinateIds.includes(r.submittedBy) || r.submittedBy === currentUser.id)
    );

    const itemsMap = new Map<string, AggregatedItem>();

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
        });
      }
    });

    return Array.from(itemsMap.values()).sort((a,b) => b.totalCost - a.totalCost);

  }, [requests, currentUser.id, subordinateIds]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Items Summary</CardTitle>
        <CardDescription>
          A summary of all approved items within your district.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
            <Table>
                <TableHeader className='sticky top-0 bg-background'>
                    <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Total Quantity</TableHead>
                    <TableHead className="text-right">Total Cost (₹)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {aggregatedData.length > 0 ? (
                        aggregatedData.map(item => (
                            <TableRow key={item.itemName}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-right">{item.totalQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{item.totalCost.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                No approved requests with items found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
