import { Customer } from '../types';

/**
 * Generates and downloads a CSV export of the Wholesale Customer Ledger
 * formatted for spreadsheet applications (Excel, Google Sheets, etc.).
 */
export function exportCustomerLedgerCSV(customers: Customer[]): void {
  const headers = [
    'Shop Name',
    'Owner Name',
    'Phone',
    'Secondary Phone',
    'District',
    'Detailed Address',
    'Customer Tier',
    'Pipeline Status',
    'Lifetime Value (LTV BDT)',
    'Total Quantity (Pcs)',
    'Orders Count',
    'Last Order Date',
    'Last Order Amount (BDT)',
    'Last Order Pcs',
    'Last Order Model',
    'Preferred Denim Model',
    'Model Share (%)',
    'Reorder Cycle (Days)',
    'Lead Time (Days)',
    'Next Expected Order',
    'Next Follow-up Date',
    'Follow-up Status',
    'Ontime Payment Rate (%)',
    'Last Order Tags',
  ];

  // Helper to escape CSV cell content properly
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = customers.map((c) => [
    escapeCell(c.name),
    escapeCell(c.ownerName),
    escapeCell(c.phone),
    escapeCell(c.secondaryPhone || ''),
    escapeCell(c.district),
    escapeCell(c.detailedAddress || ''),
    escapeCell(c.tier),
    escapeCell(c.pipelineStatus),
    escapeCell(c.ltv),
    escapeCell(c.totalQuantity),
    escapeCell(c.ordersCount),
    escapeCell(c.lastOrderDate),
    escapeCell(c.lastOrderAmount),
    escapeCell(c.lastOrderPcs),
    escapeCell(c.lastOrderModel),
    escapeCell(c.preferredModel),
    escapeCell(c.modelSharePercent),
    escapeCell(c.cycleDays),
    escapeCell(c.leadDays),
    escapeCell(c.nextExpectedOrder),
    escapeCell(c.nextFollowUpDate),
    escapeCell(c.followUpStatus),
    escapeCell(c.ontimePaymentRate),
    escapeCell(c.orderHistory[0]?.tags?.join('; ') || 'Wholesale'),
  ]);

  const csvContent = [
    // UTF-8 BOM so Excel opens Bengali and Unicode text cleanly
    '\uFEFF' + headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `arif-fashion-ledger-${todayStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a CSV export of all warehouse orders,
 * including warehouse tags, delivery status, courier, and denim model specs.
 */
export function exportWarehouseOrdersCSV(customers: Customer[], filterTag?: string): void {
  const headers = [
    'Order ID',
    'Date',
    'Customer Shop',
    'Owner Name',
    'Phone',
    'District',
    'Denim Model',
    'Quantity (Pcs)',
    'Unit Price (BDT)',
    'Discount (BDT)',
    'Total (BDT)',
    'Delivery Status',
    'Payment Status',
    'Courier & Logistics',
    'Warehouse Tags',
    'Logistics Notes',
  ];

  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows: string[][] = [];

  customers.forEach((c) => {
    c.orderHistory.forEach((o) => {
      const tagsList = o.tags || ['Wholesale'];
      if (filterTag && filterTag !== 'All' && !tagsList.includes(filterTag as any)) {
        return;
      }

      rows.push([
        escapeCell(o.id),
        escapeCell(o.date),
        escapeCell(c.name),
        escapeCell(c.ownerName),
        escapeCell(c.phone),
        escapeCell(c.district),
        escapeCell(o.model),
        escapeCell(o.quantity),
        escapeCell(o.unitPrice),
        escapeCell(o.discount),
        escapeCell(o.total),
        escapeCell(o.deliveryStatus),
        escapeCell(o.paymentStatus),
        escapeCell(o.courier),
        escapeCell(tagsList.join('; ')),
        escapeCell(o.logisticsNote || ''),
      ]);
    });
  });

  const csvContent = [
    '\uFEFF' + headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const todayStr = new Date().toISOString().split('T')[0];
  const tagSuffix = filterTag && filterTag !== 'All' ? `-${filterTag.toLowerCase()}` : '';
  link.setAttribute('href', url);
  link.setAttribute('download', `warehouse-orders${tagSuffix}-${todayStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
