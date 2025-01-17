import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
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
  'gmr-smtp-in.l.google.com'
];

async function getESPFromMXRecords(domain: string): Promise<string> {
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return 'Other';

    // Sort by priority (lower is higher priority)
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMX = mxRecords[0].exchange.toLowerCase();

    // Check for Microsoft 365
    if (MICROSOFT_MX_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      return 'Microsoft';
    }

    // Check for Google Workspace
    if (GOOGLE_MX_PATTERNS.some(pattern => primaryMX.includes(pattern))) {
      return 'Google';
    }

    return 'Other';
  } catch {
    return 'Other';
  }
}

async function getESPCategory(email: string): Promise<string> {
  try {
    const domain = email.split('@')[1].toLowerCase();
    if (!domain || !domain.includes('.')) return 'Invalid';
    
    return await getESPFromMXRecords(domain);
  } catch {
    return 'Invalid';
  }
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

    const text = await file.text();
    const records = parse(text, {
      skip_empty_lines: true,
      trim: true
    });

    if (records.length > 1000) {
      return NextResponse.json(
        { error: 'File contains more than 1000 records' },
        { status: 400 }
      );
    }

    // Analyze emails and categorize them
    const results = {
      emails: [] as Array<{ email: string; esp: string }>,
      summary: {
        total: 0,
        microsoft: 0,
        google: 0,
        other: 0,
        invalid: 0
      }
    };

    // Process each row
    for (const row of records) {
      const email = row[0]?.trim();
      if (!email) continue;

      const esp = await getESPCategory(email);
      results.emails.push({ email, esp });
      results.summary.total++;

      switch (esp) {
        case 'Microsoft':
          results.summary.microsoft++;
          break;
        case 'Google':
          results.summary.google++;
          break;
        case 'Other':
          results.summary.other++;
          break;
        case 'Invalid':
          results.summary.invalid++;
          break;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 