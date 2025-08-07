

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ProcurementRequest, User, ProcurementCategory } from './data';
import type { AggregatedData } from '@/components/dashboard/approved-items-table';

// Extend jsPDF with autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const getUserById = (id: string, allUsers: User[]) => allUsers.find(u => u.id === id);

const primaryColor = [79, 175, 245]; // hsl(207, 90%, 61%)
const greyColor = [240, 240, 240];
const darkGreyColor = [74, 74, 74];
const textColor = [255, 255, 255];
const darkTextColor = [0, 0, 0];

const generateHeader = (doc: jsPDFWithAutoTable, title: string, subtitle?: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 18);
    if (subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, 25);
    }
};

const getSubordinateIds = (managerId: string, allUsers: User[]): string[] => {
    const directSubordinates = allUsers.filter(u => u.reportsTo === managerId);
    let allSubordinateIds = directSubordinates.map(u => u.id);
    
    directSubordinates.forEach(subordinate => {
        allSubordinateIds = [...allSubordinateIds, ...getSubordinateIds(subordinate.id, allUsers)];
    });

    return allSubordinateIds;
};

export function generateDistrictPdf(requests: ProcurementRequest[], allUsers: User[], currentUser: User) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    generateHeader(doc, "District Procurement Report", `Generated for: ${currentUser.name}`);
    
    // Filter requests to only include those from the current district's hierarchy
    const districtSubordinateIds = getSubordinateIds(currentUser.id, allUsers);
    const districtRequests = requests.filter(r => districtSubordinateIds.includes(r.submittedBy));

    let tableY = 40;

    // 1. Total Approved Budget Requirement
    const totalBudget = districtRequests
        .filter(r => r.status === 'Approved')
        .reduce((sum, req) => sum + ((req.pricePerUnit || 0) * req.quantity), 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`Total Approved Budget (INR): ${totalBudget.toLocaleString('en-IN')}`, 14, tableY);
    tableY += 10;

    // 2. Budget bifurcation by Talukas
    const talukaUsers = allUsers.filter(u => u.reportsTo === currentUser.id);
    
    const talukaBudgets = talukaUsers.map(taluka => {
        const talukaSubordinateIds = getSubordinateIds(taluka.id, allUsers);
        const talukaBudget = districtRequests
            .filter(r => talukaSubordinateIds.includes(r.submittedBy) && r.status === 'Approved')
            .reduce((sum, req) => sum + ((req.pricePerUnit || 0) * req.quantity), 0);
        return [taluka.name, talukaBudget.toLocaleString('en-IN')];
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget Breakdown by Taluka', 14, tableY);
    tableY += 8;

    doc.autoTable({
        head: [['Taluka', 'Approved Cost (INR)']],
        body: talukaBudgets,
        startY: tableY,
        headStyles: { fillColor: darkGreyColor, textColor: [255,255,255] },
        styles: {
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableY = (doc as any).autoTable.previous.finalY + 15;


    // 3. Approved Items Summary
    const approvedRequests = districtRequests.filter(r => r.status === 'Approved');
    const itemsMap = new Map<string, { itemName: string; totalQuantity: number; totalCost: number; category: ProcurementCategory }>();

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

    const aggregatedData = Array.from(itemsMap.values()).reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push({
            itemName: item.itemName,
            totalQuantity: item.totalQuantity,
            totalCost: item.totalCost
        });
        acc[item.category].sort((a, b) => b.totalCost - a.totalCost);
        return acc;
    }, {} as AggregatedData);

    const aggregatedCategories = Object.keys(aggregatedData) as ProcurementCategory[];

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Approved Items Summary', 14, tableY);
    tableY += 8;

    if (aggregatedCategories.length > 0) {
        aggregatedCategories.forEach(category => {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(category, 14, tableY);
            tableY += 6;
            
            const tableData = aggregatedData[category].map(item => [
                item.itemName,
                item.totalQuantity.toLocaleString(),
                item.totalCost.toLocaleString('en-IN')
            ]);
            
            doc.autoTable({
                head: [['Item', 'Total Quantity', 'Estimated Cost (INR)']],
                body: tableData,
                startY: tableY,
                headStyles: { fillColor: primaryColor, textColor: [255,255,255] },
                styles: {
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200]
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tableY = (doc as any).autoTable.previous.finalY + 10;
        });
    } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No approved items to display.', 14, tableY);
    }


    doc.save(`district_procurement_report_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
}


export function generateRequestsPdf(requests: ProcurementRequest[], totalBudget: number, allUsers: User[], userName?: string) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    generateHeader(doc, "Procurement Requests Summary", `Generated for: ${userName || 'User'}`);

    // Summary calculations
    let summaryY = 40;
    const totalCount = requests.length;
    const pendingCount = requests.filter(r => r.status.startsWith('Pending')).length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    // Summary Boxes
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = (pageWidth - 28 - 15) / 4; // 14 padding on each side, 5 padding between boxes
    const boxHeight = 25;

    const summaryData = [
        { label: "Total Requests", value: totalCount },
        { label: "Pending", value: pendingCount },
        { label: "Approved", value: approvedCount },
        { label: "Rejected", value: rejectedCount }
    ];

    doc.setFont('helvetica', 'normal');
    summaryData.forEach((data, index) => {
        const x = 14 + index * (boxWidth + 5);
        doc.setFillColor(greyColor[0], greyColor[1], greyColor[2]);
        doc.roundedRect(x, summaryY, boxWidth, boxHeight, 3, 3, 'F');
        
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.setFontSize(10);
        doc.text(data.label, x + boxWidth / 2, summaryY + 10, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(String(data.value), x + boxWidth / 2, summaryY + 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
    });

    summaryY += boxHeight + 15;

    // Total Budget
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`Total Approved Budget (INR): ${totalBudget.toLocaleString('en-IN')}`, 14, summaryY);
    doc.setFont('helvetica', 'normal');

    summaryY += 5;

    // Facility-wise budget summary for approved requests
    const approvedRequests = requests.filter(req => req.status === 'Approved');
    const facilityTotals: { [key: string]: number } = {};
    approvedRequests.forEach(req => {
        const cost = (req.pricePerUnit || 0) * req.quantity;
        const userId = req.submittedBy;
        if (facilityTotals[userId]) {
            facilityTotals[userId] += cost;
        } else {
            facilityTotals[userId] = cost;
        }
    });

    const facilityTableData = Object.entries(facilityTotals).map(([userId, total]) => {
        const user = getUserById(userId, allUsers);
        return [
            user ? user.name : userId,
            total.toLocaleString('en-IN')
        ];
    });

    if (facilityTableData.length > 1) { // Only show this table if more than one facility is selected
        doc.autoTable({
            head: [['Facility Name', 'Approved Cost (INR)']],
            body: facilityTableData,
            startY: summaryY + 5,
            headStyles: { fillColor: darkGreyColor, textColor: [255,255,255] },
            styles: {
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            tableWidth: 'auto',
            didDrawPage: (data: any) => {
                summaryY = data.cursor?.y ?? summaryY;
            }
        });
    }


    // Category-wise summary for approved requests
    const categoryTotals: { [key: string]: number } = {};
    approvedRequests.forEach(req => {
        const cost = (req.pricePerUnit || 0) * req.quantity;
        if (categoryTotals[req.category]) {
            categoryTotals[req.category] += cost;
        } else {
            categoryTotals[req.category] = cost;
        }
    });

    const categoryTableData = Object.entries(categoryTotals).map(([category, total]) => ([
        category,
        total.toLocaleString('en-IN')
    ]));

    doc.autoTable({
        head: [['Category', 'Approved Cost (INR)']],
        body: categoryTableData,
        startY: summaryY + 5,
        headStyles: { fillColor: darkGreyColor, textColor: [255,255,255] },
        styles: {
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        tableWidth: 'auto',
        didDrawPage: (data: any) => {
            summaryY = data.cursor?.y ?? summaryY;
        }
    });

    let tableY = summaryY + 15;

    // Group requests by submittedBy user
    const requestsByUser = requests.reduce((acc, req) => {
        const userId = req.submittedBy;
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(req);
        return acc;
    }, {} as Record<string, ProcurementRequest[]>);
    
    // Create a table for each user
    for (const userId in requestsByUser) {
        const userRequests = requestsByUser[userId];
        const submittedByUser = getUserById(userId, allUsers);
        
        if (submittedByUser) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Requests from: ${submittedByUser.name}`, 14, tableY);
            tableY += 8;
        }

        const tableData = userRequests.map(req => ([
            req.id,
            req.category,
            req.itemName,
            req.quantity,
            req.pricePerUnit ? req.pricePerUnit.toLocaleString('en-IN') : '0',
            ((req.pricePerUnit || 0) * req.quantity).toLocaleString('en-IN'),
            req.priority,
            req.status
        ]));
    
        doc.autoTable({
            head: [['ID', 'Category', 'Item', 'Quantity', 'Price/Unit (INR)', 'Total Cost (INR)', 'Priority', 'Status']],
            body: tableData,
            startY: tableY,
            headStyles: { fillColor: primaryColor, textColor: [255,255,255] },
            styles: {
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            didDrawPage: (data: any) => {
                tableY = data.cursor?.y ?? tableY;
            }
        });
        tableY += 10; // Add some space between tables
    }


    doc.save('procurement_requests.pdf');
}

/**
 * Generate a State-wide PDF report with:
 * - KPIs
 * - District-wise comparison (table + simple bar chart)
 * - Category totals (table + mini bars)
 * - Additional insights (top categories, outliers, aging)
 */
export function generateStatePdf(requests: ProcurementRequest[], allUsers: User[], currentUser: User) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    generateHeader(doc, "State Report", `Generated for: ${currentUser.name} • ${new Date().toLocaleString()}`);

    // KPIs
    let y = 40;
    const totalCount = requests.length;
    const pendingCount = requests.filter(r => r.status === 'Pending Taluka Approval').length;
    const approved = requests.filter(r => r.status === 'Approved');
    const approvedCount = approved.length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    const approvedBudget = approved.reduce((s, r) => s + (r.pricePerUnit || 0) * r.quantity, 0);

    const kpis = [
        { label: 'Total Requests (count)', value: totalCount },
        { label: 'Pending (count)', value: pendingCount },
        { label: 'Approved (count)', value: approvedCount },
        { label: 'Rejected (count)', value: rejectedCount },
        { label: 'Total Approved (INR)', value: approvedBudget.toLocaleString('en-IN') },
    ];

    const kpiCols = 3;
    const kpiBoxW = (pageWidth - 28 - (kpiCols - 1) * 6) / kpiCols;
    const kpiBoxH = 24;

    doc.setFont('helvetica', 'normal');
    kpis.forEach((k, i) => {
        const col = i % kpiCols;
        const row = Math.floor(i / kpiCols);
        const x = 14 + col * (kpiBoxW + 6);
        const yBox = y + row * (kpiBoxH + 8);
        doc.setFillColor(greyColor[0], greyColor[1], greyColor[2]);
        doc.roundedRect(x, yBox, kpiBoxW, kpiBoxH, 3, 3, 'F');
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.setFontSize(9);
        doc.text(k.label, x + 4, yBox + 9);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(String(k.value), x + 4, yBox + 19);
        doc.setFont('helvetica', 'normal');
    });

    y += Math.ceil(kpis.length / kpiCols) * (kpiBoxH + 8) + 6;

    // District-wise comparison
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('District-wise Comparison', 14, y);
    y += 6;

    // Compute district metrics
    const districts = allUsers.filter(u => u.role === 'district');
    const talukasByDistrict: Record<string, string[]> = {};
    const basesByDistrict: Record<string, string[]> = {};
    districts.forEach(d => {
        const talukas = allUsers.filter(u => u.reportsTo === d.id).map(u => u.id);
        talukasByDistrict[d.id] = talukas;
        basesByDistrict[d.id] = allUsers.filter(u => talukas.includes(u.reportsTo || '')).map(u => u.id);
    });

    const districtMetrics = districts.map(d => {
        const baseIds = basesByDistrict[d.id];
        const districtRequests = requests.filter(r => baseIds.includes(r.submittedBy));
        const districtApproved = districtRequests.filter(r => r.status === 'Approved');
        const requested = districtRequests.filter(r => r.status !== 'Rejected')
            .reduce((s, r) => s + (r.pricePerUnit || 0) * r.quantity, 0);
        const approvedAmt = districtApproved
            .reduce((s, r) => s + (r.pricePerUnit || 0) * r.quantity, 0);
        return {
            name: d.name,
            requested,
            approvedAmt
        };
    }).sort((a, b) => b.approvedAmt - a.approvedAmt);

    // Table
    const districtTable = districtMetrics.map(m => ([
        m.name,
        m.approvedAmt.toLocaleString('en-IN'),
        m.requested.toLocaleString('en-IN')
    ]));

    (doc as jsPDFWithAutoTable).autoTable({
        head: [['District', 'Approved (INR)', 'Requested (INR)']],
        body: districtTable,
        startY: y,
        headStyles: { fillColor: darkGreyColor, textColor: [255, 255, 255] },
        styles: { lineWidth: 0.1, lineColor: [200, 200, 200] },
        tableWidth: 'auto'
    });
    // @ts-ignore
    y = (doc as any).autoTable.previous.finalY + 8;

    // Removed district bar charts as requested

    // Category totals (table only, no bar charts)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total Approved by Category (INR)', 14, y);
    y += 6;

    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    approved.forEach(r => {
        const amt = (r.pricePerUnit || 0) * r.quantity;
        if (!categoryTotals[r.category]) categoryTotals[r.category] = { amount: 0, count: 0 };
        categoryTotals[r.category].amount += amt;
        categoryTotals[r.category].count += 1;
    });

    const catTable = Object.entries(categoryTotals).map(([cat, v]) => ([
        cat,
        v.amount.toLocaleString('en-IN'),
        v.count.toString()
    ]));

    (doc as jsPDFWithAutoTable).autoTable({
        head: [['Category', 'Approved (INR)', 'Approved (count)']],
        body: catTable,
        startY: y,
        headStyles: { fillColor: [0,0,0], textColor: [255, 255, 255] },
        styles: { lineWidth: 0.1, lineColor: [200, 200, 200] },
        tableWidth: 'auto'
    });
    // @ts-ignore
    y = (doc as any).autoTable.previous.finalY + 8;

    // State-wide Approved Items (aggregated) - separate page with category sections
    doc.addPage();
    generateHeader(doc, "State-wide Approved Items", `Generated for: ${currentUser.name}`);

    let sy = 40;

    // Aggregate all Approved requests by category then item
    type AggItem = { itemName: string; totalQuantity: number; totalCost: number };
    const itemsMap = new Map<string, AggItem & { category: ProcurementCategory }>();
    approved.forEach(r => {
        const key = r.itemName.trim();
        const cost = (r.pricePerUnit || 0) * r.quantity;
        const existing = itemsMap.get(key);
        if (existing) {
            existing.totalQuantity += r.quantity;
            existing.totalCost += cost;
        } else {
            itemsMap.set(key, {
                itemName: key,
                totalQuantity: r.quantity,
                totalCost: cost,
                category: r.category
            });
        }
    });

    const aggregatedByCategory = Array.from(itemsMap.values()).reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push({
            itemName: item.itemName,
            totalQuantity: item.totalQuantity,
            totalCost: item.totalCost
        });
        // Sort items by total cost desc for readability
        acc[item.category].sort((a, b) => b.totalCost - a.totalCost);
        return acc;
    }, {} as Record<ProcurementCategory, AggItem[]>);

    const aggCategories = Object.keys(aggregatedByCategory) as ProcurementCategory[];

    if (aggCategories.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('No approved items to display.', 14, sy);
    } else {
        for (const category of aggCategories) {
            // Section title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
            doc.text(category, 14, sy);
            sy += 6;

            const body = aggregatedByCategory[category].map(it => ([
                it.itemName,
                it.totalQuantity.toLocaleString('en-IN'),
                it.totalCost.toLocaleString('en-IN')
            ]));

            (doc as jsPDFWithAutoTable).autoTable({
                head: [['Item', 'Total Quantity', 'Approved (INR)']],
                body,
                startY: sy,
                headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
                styles: { lineWidth: 0.1, lineColor: [200, 200, 200] },
                tableWidth: 'auto'
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sy = (doc as any).autoTable.previous.finalY + 10;

            // If near page end, start a new page and re-render the header for this section
            if (sy > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                generateHeader(doc, "State-wide Approved Items", `Generated for: ${currentUser.name}`);
                sy = 40;
            }
        }
    }

    // Footer on last page not necessary; jsPDF doesn't support global footer easily. Kept simple.

    doc.save('state_procurement_report.pdf');
}
