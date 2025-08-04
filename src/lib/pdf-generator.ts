
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ProcurementRequest, User } from './data';

// Extend jsPDF with autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const getUserById = (id: string, allUsers: User[]) => allUsers.find(u => u.id === id);

export function generateRequestsPdf(requests: ProcurementRequest[], totalBudget: number, allUsers: User[], userName?: string) {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor = [79, 175, 245]; // hsl(207, 90%, 61%)
    const greyColor = [240, 240, 240];
    const darkGreyColor = [74, 74, 74];
    const textColor = [255, 255, 255];
    const darkTextColor = [0, 0, 0];
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text("Procurement Requests Summary", 14, 18);
    if (userName) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated for: ${userName}`, 14, 25);
    }

    // Summary calculations
    const totalCount = requests.length;
    const pendingCount = requests.filter(r => r.status.startsWith('Pending')).length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    // Summary Boxes
    let summaryY = 40;
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
    doc.text(`Total Requested Budget (INR): ${totalBudget.toLocaleString('en-IN')}`, 14, summaryY);
    doc.setFont('helvetica', 'normal');

    summaryY += 5;

    // Category-wise summary
    const categoryTotals: { [key: string]: number } = {};
    requests.forEach(req => {
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
        head: [['Category', 'Total Cost (INR)']],
        body: categoryTableData,
        startY: summaryY + 5,
        headStyles: { fillColor: darkGreyColor, textColor: [255,255,255] },
        styles: {
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        tableWidth: 'auto',
        didDrawPage: (data) => {
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
            didDrawPage: (data) => {
                tableY = data.cursor?.y ?? tableY;
            }
        });
        tableY += 10; // Add some space between tables
    }


    doc.save('procurement_requests.pdf');
}
