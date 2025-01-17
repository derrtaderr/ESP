import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Known Microsoft 365 MX record patterns
const MICROSOFT_MX_PATTERNS = [
  'protection.outlook.com',
  'mail.protection.outlook.com',
  'olc.protection.outlook.com',
  '.mail.protection.outlook.com'
];

// Known Google Workspace MX record patterns
const GOOGLE_MX_PATTERNS = [
  'google.com',
  'googlemail.com',
  'aspmx.l.google.com',
  '.aspmx.l.google.com',
  'smtp-relay.gmail.com',
  'gmr-smtp-in.l.google.com',
  'aspmx2.googlemail.com',
  'aspmx3.googlemail.com',
  'alt1.aspmx.l.google.com',
  'alt2.aspmx.l.google.com',
  'alt3.aspmx.l.google.com',
  'alt4.aspmx.l.google.com'
];

// Additional ESP Patterns
const YAHOO_PATTERNS = [
  'yahoo.com',
  'yahoodns.net',
  'yahoo.net',
  'inbound-smtp.mail.yahoo.com',
  'mail.yahoo.com'
];

const PROTONMAIL_PATTERNS = [
  'protonmail.ch',
  'proton.ch',
  'protonmail.com'
];

const ZOHO_PATTERNS = [
  'zoho.com',
  'zohomail.com',
  'zoho.eu'
];

const AOL_PATTERNS = [
  'aol.com',
  'mx.aol.com',
  'mailin-0',
  'aolmail'
];

// Cache for MX record lookups to avoid repeated DNS queries
const mxCache: Record<string, string> = {};

async function getESPFromMXRecords(domain: string): Promise<string> {
  try {
    // Check cache first
    if (mxCache[domain]) {
      return mxCache[domain];
    }

    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      mxCache[domain] = 'Other';
      return 'Other';
    }

    // Sort by priority (lower is higher priority)
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMX = mxRecords[0].exchange.toLowerCase();

    let result = 'Other';
    // Check for Microsoft 365
    if (MICROSOFT_MX_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'Microsoft';
    }
    // Check for Google Workspace
    else if (GOOGLE_MX_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'Google';
    }
    // Check for Yahoo
    else if (YAHOO_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'Yahoo';
    }
    // Check for ProtonMail
    else if (PROTONMAIL_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'ProtonMail';
    }
    // Check for Zoho
    else if (ZOHO_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'Zoho';
    }
    // Check for AOL
    else if (AOL_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      result = 'AOL';
    }

    // Cache the result
    mxCache[domain] = result;
    return result;
  } catch {
    return 'Other';
  }
}

async function getESPCategory(email: string): Promise<string> {
  try {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !domain.includes('.')) {
      return 'Invalid';
    }
    return await getESPFromMXRecords(domain);
  } catch {
    return 'Invalid';
  }
}

function findEmailColumn(headers: string[], firstRow: Record<string, string>): string | null {
  // First try to find a column with "email" in the name
  const emailColumn = headers.find(header => 
    header.toLowerCase().includes('email')
  );
  if (emailColumn) return emailColumn;

  // If no email column found, look for a column containing an email address
  for (const header of headers) {
    const value = firstRow[header];
    if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
      return header;
    }
  }

  return null;
}

// Process records in batches to avoid memory issues
async function processBatch(
  records: Record<string, string>[],
  emailColumn: string,
  newHeaders: string[],
  startIdx: number,
  batchSize: number
): Promise<Record<string, string>[]> {
  const batch = records.slice(startIdx, startIdx + batchSize);
  return await Promise.all(batch.map(async (row) => {
    const email = row[emailColumn]?.toString().trim();
    const esp = email ? await getESPCategory(email) : 'Invalid';

    const newRow: Record<string, string> = {};
    newHeaders.forEach(header => {
      if (header === 'ESP Provider') {
        newRow[header] = esp;
      } else {
        newRow[header] = row[header];
      }
    });

    return newRow;
  }));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Increase file size limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const records = parse(text, {
      skip_empty_lines: true,
      trim: true,
      columns: true,
      bom: true
    }) as Record<string, string>[];

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Find the email column
    const headers = Object.keys(records[0]);
    const emailColumn = findEmailColumn(headers, records[0]);

    if (!emailColumn) {
      return NextResponse.json(
        { error: 'No email column found in CSV' },
        { status: 400 }
      );
    }

    // Create new headers with ESP column right after email column
    const emailColumnIndex = headers.indexOf(emailColumn);
    const newHeaders = [
      ...headers.slice(0, emailColumnIndex + 1),
      'ESP Provider',
      ...headers.slice(emailColumnIndex + 1)
    ];

    // Process records in batches of 100 to avoid memory issues
    const BATCH_SIZE = 100;
    const processedRecords: Record<string, string>[] = [];
    const summary = {
      total: 0,
      google: 0,
      microsoft: 0,
      yahoo: 0,
      protonmail: 0,
      zoho: 0,
      aol: 0,
      other: 0,
      invalid: 0
    };
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batchResults = await processBatch(records, emailColumn, newHeaders, i, BATCH_SIZE);
      processedRecords.push(...batchResults);
      
      // Update summary
      batchResults.forEach(row => {
        const esp = row['ESP Provider'].toLowerCase();
        summary.total++;
        summary[esp as keyof typeof summary]++;
      });
    }

    // Convert to CSV
    const csvContent = stringify(processedRecords, {
      header: true,
      columns: newHeaders
    });

    return NextResponse.json({
      success: true,
      summary,
      csvContent: csvContent,
      totalRecords: records.length,
      filename: file.name.replace('.csv', '_analyzed.csv')
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 