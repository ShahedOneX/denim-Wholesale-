import { Customer, OrderRecord, OrderTag } from '../types';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  lastModified?: string;
}

export interface SyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  customersSynced: number;
  ordersSynced: number;
  updatedAt: string;
}

const DEFAULT_SPREADSHEET_TITLE = 'Arif Fashion World - Wholesale CRM Ledger';

/**
 * Searches user's Google Drive for existing spreadsheets created for this app
 */
export async function findDriveSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=15`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    const files = data.files || [];
    return files.map((f: any) => ({
      id: f.id,
      name: f.name,
      url: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
      lastModified: f.modifiedTime,
    }));
  } catch (err: any) {
    console.error('Error finding spreadsheets:', err);
    throw err;
  }
}

/**
 * Creates a brand new Google Spreadsheet with two preconfigured tabs:
 * 1. "Customer Accounts"
 * 2. "Warehouse Orders"
 */
export async function createWholesaleSpreadsheet(
  accessToken: string,
  title: string = DEFAULT_SPREADSHEET_TITLE
): Promise<{ id: string; url: string; title: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Customer Accounts',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Warehouse Orders',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  const id = data.spreadsheetId;
  const url = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}/edit`;

  return { id, url, title };
}

/**
 * Syncs full customer accounts and warehouse orders into the Google Spreadsheet
 */
export async function syncDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  customers: Customer[]
): Promise<SyncResult> {
  // Check spreadsheet metadata to verify/create tabs
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const errData = await metaRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Cannot access spreadsheet: ${metaRes.statusText}`);
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map(
    (s: any) => s.properties?.title || ''
  );

  // Add missing sheets if necessary
  const missingSheets: string[] = [];
  if (!existingSheetTitles.includes('Customer Accounts')) missingSheets.push('Customer Accounts');
  if (!existingSheetTitles.includes('Warehouse Orders')) missingSheets.push('Warehouse Orders');

  if (missingSheets.length > 0) {
    const addSheetRequests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    });
  }

  // Prepare Customer Accounts rows
  const customerHeaders = [
    'Shop Name',
    'Proprietor / Owner',
    'Phone',
    'Secondary Phone',
    'District',
    'Detailed Address',
    'Tier',
    'Pipeline Status',
    'Total LTV (BDT)',
    'Total Denim Pcs',
    'Orders Count',
    'Last Order Date',
    'Last Order Amount (BDT)',
    'Last Order Pcs',
    'Preferred Model',
    'Model Share %',
    'Replenishment Cycle (Days)',
    'Next Expected Order Date',
    'Follow-up Status',
    'Ontime Payment Rate (%)',
    'Recent Order Tags',
    'Last Synced',
  ];

  const nowTimestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

  const customerRows = customers.map((c) => [
    c.name,
    c.ownerName,
    c.phone,
    c.secondaryPhone || '',
    c.district,
    c.detailedAddress || '',
    c.tier,
    c.pipelineStatus,
    c.ltv,
    c.totalQuantity,
    c.ordersCount,
    c.lastOrderDate,
    c.lastOrderAmount,
    c.lastOrderPcs,
    c.preferredModel,
    `${c.modelSharePercent}%`,
    c.cycleDays,
    c.nextExpectedOrder,
    c.followUpStatus,
    `${c.ontimePaymentRate}%`,
    c.orderHistory[0]?.tags?.join('; ') || 'Wholesale',
    nowTimestamp,
  ]);

  // Prepare Warehouse Orders rows
  const orderHeaders = [
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
    'Net Total (BDT)',
    'Delivery Status',
    'Payment Status',
    'Courier / Logistics',
    'Warehouse Tags',
    'Logistics Notes',
    'Last Synced',
  ];

  const orderRows: (string | number)[][] = [];
  customers.forEach((c) => {
    c.orderHistory.forEach((o) => {
      orderRows.push([
        o.id,
        o.date,
        c.name,
        c.ownerName,
        c.phone,
        c.district,
        o.model,
        o.quantity,
        o.unitPrice,
        o.discount,
        o.total,
        o.deliveryStatus,
        o.paymentStatus,
        o.courier,
        (o.tags || ['Wholesale']).join('; '),
        o.logisticsNote || '',
        nowTimestamp,
      ]);
    });
  });

  // Batch Update Values in both sheets
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Customer Accounts!A1:V' + (customerRows.length + 1),
        values: [customerHeaders, ...customerRows],
      },
      {
        range: 'Warehouse Orders!A1:Q' + (orderRows.length + 1),
        values: [orderHeaders, ...orderRows],
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to write values: ${updateRes.statusText}`);
  }

  // Polish styling: Header formatting
  try {
    await polishSpreadsheetFormatting(accessToken, spreadsheetId);
  } catch (formatErr) {
    // Non-fatal, formatting failure shouldn't block data sync
    console.warn('Formatting error (non-fatal):', formatErr);
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    customersSynced: customers.length,
    ordersSynced: orderRows.length,
    updatedAt: nowTimestamp,
  };
}

/**
 * Appends a newly created order row to the "Warehouse Orders" sheet
 */
export async function appendOrderRowToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  order: {
    id: string;
    date: string;
    model: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    paymentStatus: string;
    deliveryStatus: string;
    courier: string;
    logisticsNote?: string;
    tags?: OrderTag[];
  },
  customer: {
    name: string;
    ownerName: string;
    phone: string;
    district: string;
  }
): Promise<boolean> {
  const row = [
    order.id,
    order.date,
    customer.name,
    customer.ownerName,
    customer.phone,
    customer.district,
    order.model,
    order.quantity,
    order.unitPrice,
    order.discount,
    order.total,
    order.deliveryStatus,
    order.paymentStatus,
    order.courier,
    (order.tags || ['Wholesale']).join('; '),
    order.logisticsNote || '',
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Warehouse Orders'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  return response.ok;
}

/**
 * Apply header color and bold styling
 */
async function polishSpreadsheetFormatting(accessToken: string, spreadsheetId: string) {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!metaRes.ok) return;

  const metaData = await metaRes.json();
  const sheets = metaData.sheets || [];

  const requests: any[] = [];

  sheets.forEach((s: any) => {
    const sheetId = s.properties?.sheetId;
    if (sheetId === undefined) return;

    // Header style: dark navy/blue background, bold white text
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.22, blue: 0.38 }, // primary navy
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'LEFT',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    });

    // Auto-resize columns
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 20,
        },
      },
    });
  });

  if (requests.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }
}
