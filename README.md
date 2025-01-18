# ESP Domain Analyzer

A modern web application that analyzes email lists to identify and categorize email service providers (ESPs). Built with Next.js and TypeScript, featuring a clean, dark-themed UI.

## Features

- **CSV File Analysis**: Upload CSV files containing email addresses (up to 50MB)
- **ESP Detection**: Identifies major email service providers including:
  - Google Workspace
  - Microsoft 365
  - Yahoo
  - ProtonMail
  - Zoho
  - AOL
- **MX Record Analysis**: Uses DNS MX record lookups for accurate provider detection
- **Results Summary**: Visual breakdown of email providers in your list
- **Enhanced CSV**: Downloads your original CSV with an added "ESP Provider" column

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **DNS Lookups**: Node.js DNS module
- **File Processing**: Server-side CSV parsing and analysis

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/derrtaderr/ESP.git
cd ESP/esp-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload a CSV file containing email addresses
2. Wait for the analysis to complete
3. View the breakdown of email service providers
4. Download the enhanced CSV with ESP information

## Development

- Built with Next.js 14 App Router
- Uses server-side actions for file processing
- Implements modern React patterns and TypeScript
- Features a responsive, accessible UI

## License

MIT License - feel free to use and modify as needed.
