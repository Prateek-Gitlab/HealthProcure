
"use client";

import { useState } from "react";
import type { ProcurementCategory, StagedRequest, Priority } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Send, XCircle, Loader2, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequestForm } from "./request-form";
import { procurementPriorities } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StagedRequestsProps {
    onSubmit: (stagedRequests: StagedRequest[]) => Promise<boolean>;
}

export function StagedRequests({ onSubmit }: StagedRequestsProps) {
  const [stagedRequests, setStagedRequests] = useState<StagedRequest[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkPriority, setBulkPriority] = useState<Priority | "">("");
  const [bulkJustification, setBulkJustification] = useState("");
  const { toast } = useToast();

  const handleItemsSelected = (
    items: string[],
    category: ProcurementCategory
  ) => {
    const newStagedRequests: StagedRequest[] = items.map((itemName) => ({
      itemName,
      category,
      quantity: 1,
      pricePerUnit: 0,
      priority: "Medium",
      justification: "",
    }));

    const combined = [...stagedRequests, ...newStagedRequests];
    const unique = combined.filter(
      (v, i, a) => a.findIndex((t) => t.itemName === v.itemName) === i
    );

    setStagedRequests(unique);
    setIsFormOpen(false);
  };

  const handleStagedRequestChange = (
    index: number,
    field: "quantity" | "justification" | "priority" | "pricePerUnit",
    value: string | number
  ) => {
    const updated = [...stagedRequests];
    if (field === "quantity" || field === "pricePerUnit") {
      updated[index][field] = Number(value);
    } else if (field === 'priority') {
      updated[index].priority = value as Priority;
    }
     else {
      updated[index].justification = String(value);
    }
    setStagedRequests(updated);
  };
  
  const handleRemoveStagedRequest = (index: number) => {
    const updated = stagedRequests.filter((_, i) => i !== index);
    setStagedRequests(updated);
  }

  const handleSubmitAllStaged = async () => {
    const validRequests = stagedRequests.filter(req => req.quantity > 0 && req.justification.trim().length > 0 && req.pricePerUnit >= 0);
    
    if (validRequests.length !== stagedRequests.length) {
        toast({
            title: "Validation Error",
            description: "Please ensure all selected items have a quantity, justification and a valid price.",
            variant: "destructive",
        });
        return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(validRequests);
    if (success) {
        setStagedRequests([]);
    }
    setIsSubmitting(false);
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    if (checked) {
        setSelectedIndices(prev => [...prev, index]);
    } else {
        setSelectedIndices(prev => prev.filter(i => i !== index));
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIndices(stagedRequests.map((_, i) => i));
    } else {
        setSelectedIndices([]);
    }
  }

  const handleApplyBulkEdit = () => {
    const updatedRequests = [...stagedRequests];
    selectedIndices.forEach(index => {
        if (bulkPriority) {
            updatedRequests[index].priority = bulkPriority;
        }
        if (bulkJustification.trim()) {
            updatedRequests[index].justification = bulkJustification;
        }
    });
    setStagedRequests(updatedRequests);
    setIsBulkEditOpen(false);
    setBulkPriority("");
    setBulkJustification("");
    setSelectedIndices([]);
  }

  const disableActions = isSubmitting;
  const isAllSelected = selectedIndices.length > 0 && selectedIndices.length === stagedRequests.length;
  const isIndeterminate = selectedIndices.length > 0 && !isAllSelected;

  return (
    <>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>New Requests</CardTitle>
                    <CardDescription>Create and manage procurement requests before submission.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" disabled={disableActions || selectedIndices.length === 0}>
                                <Edit className="mr-2 h-4 w-4" />
                                Bulk Edit ({selectedIndices.length})
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Edit Requests</DialogTitle>
                                <DialogDescription>Apply changes to all {selectedIndices.length} selected items. Leave fields blank to keep original values.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-priority">Priority</Label>
                                    <Select value={bulkPriority} onValueChange={(value) => setBulkPriority(value as Priority)}>
                                        <SelectTrigger id="bulk-priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procurementPriorities.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bulk-justification">Justification</Label>
                                    <Textarea id="bulk-justification" value={bulkJustification} onChange={e => setBulkJustification(e.target.value)} placeholder="Enter a justification to apply to all selected items." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsBulkEditOpen(false)}>Cancel</Button>
                                <Button onClick={handleApplyBulkEdit}>Apply Changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={() => setIsFormOpen(true)} disabled={disableActions}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Items
                    </Button>
                </div>
            </CardHeader>
            
            {stagedRequests.length > 0 && (
                <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox 
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all rows"
                                    data-state={isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                />
                            </TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead className="w-[120px]">Quantity</TableHead>
                            <TableHead className="w-[150px]">Price/unit (₹)</TableHead>
                            <TableHead className="w-[150px]">Priority</TableHead>
                            <TableHead>Justification</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stagedRequests.map((req, index) => (
                            <TableRow key={index} data-state={selectedIndices.includes(index) ? 'selected' : ''}>
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedIndices.includes(index)}
                                        onCheckedChange={(checked) => handleSelectRow(index, !!checked)}
                                        aria-label={`Select row ${index + 1}`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{req.itemName}</TableCell>
                                <TableCell>
                                <Input
                                    type="number"
                                    value={req.quantity}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "quantity", e.target.value)
                                    }
                                    className="w-full"
                                    min="1"
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                <Input
                                    type="number"
                                    value={req.pricePerUnit}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "pricePerUnit", e.target.value)
                                    }
                                    className="w-full"
                                    min="0"
                                    step="0.01"
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        value={req.priority} 
                                        onValueChange={(value) => handleStagedRequestChange(index, "priority", value)}
                                        disabled={disableActions}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procurementPriorities.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                <Textarea
                                    value={req.justification}
                                    onChange={(e) =>
                                    handleStagedRequestChange(index, "justification", e.target.value)
                                    }
                                    placeholder="Enter justification..."
                                    className="w-full"
                                    rows={3}
                                    disabled={disableActions}
                                />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveStagedRequest(index)} disabled={disableActions}>
                                        <XCircle className="h-4 w-4 text-muted-foreground"/>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                    <Button onClick={handleSubmitAllStaged} disabled={disableActions || stagedRequests.length === 0}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit All Requests
                        </>
                    )}
                    </Button>
                </div>
                </CardContent>
            )}

            {stagedRequests.length === 0 && (
                 <CardContent>
                    <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No items added yet. Click "Add Items" to start.</p>
                    </div>
                 </CardContent>
            )}

        </Card>

        <RequestForm
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onItemsSelected={handleItemsSelected}
        />
    </>
  );
}

    