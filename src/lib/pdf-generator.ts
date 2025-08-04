
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ProcurementRequest } from './data';

// Extend jsPDF with autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

export function generateRequestsPdf(requests: ProcurementRequest[], totalBudget: number) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    doc.text("Procurement Requests Summary", 14, 15);

    // Summary calculations
    const totalCount = requests.length;
    const pendingCount = requests.filter(r => r.status.startsWith('Pending')).length;
    const approvedCount = requests.filter(r => r.status === 'Approved').length;
    const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

    // Add summary text
    let summaryY = 25;
    doc.setFontSize(10);
    doc.text(`Total Requests: ${totalCount}`, 14, summaryY);
    doc.text(`Pending: ${pendingCount}`, 60, summaryY);
    doc.text(`Approved: ${approvedCount}`, 90, summaryY);
    doc.text(`Rejected: ${rejectedCount}`, 125, summaryY);

    summaryY += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Requested Budget (INR): ${totalBudget.toLocaleString('en-IN')}`, 14, summaryY);
    doc.setFont('helvetica', 'normal');


    const tableData = requests.map(req => ([
        req.id,
        req.category,
        req.itemName,
        req.quantity,
        req.pricePerUnit ? req.pricePerUnit.toLocaleString('en-IN') : 'N/A',
        ((req.pricePerUnit || 0) * req.quantity).toLocaleString('en-IN'),
        req.priority,
        req.status
    ]));

    doc.autoTable({
        head: [['ID', 'Category', 'Item', 'Quantity', 'Price/Unit (INR)', 'Total Cost (INR)', 'Priority', 'Status']],
        body: tableData,
        startY: summaryY + 5,
        headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save('procurement_requests.pdf');
}
