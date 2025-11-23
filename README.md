# CV Resume Generator

Lightweight CV and Resume Generator that outputs both PDF and DOCX documents. Self-hostable web application built with Node.js and Express.

## Features

- Generate professional CV/Resume in PDF and DOCX formats
- Simple web-based form interface
- No database required (in-memory processing)
- Lightweight and easy to deploy
- Self-hostable on Proxmox or any Docker environment

## Quick Start

### Development (with PM2)

1. Install dependencies:
```bash
npm install
```

2. Start with PM2:
```bash
npm run dev
```

3. Access at `http://localhost:3000`

4. Stop PM2:
```bash
npm run dev:stop
```

### Docker Deployment (One-liner)

Build and run:
```bash
docker build -t cv-generator . && docker run -d -p 3000:3000 --name cv-generator cv-generator
```

Or use docker-compose:
```bash
docker-compose up -d
```

### Proxmox Deployment

1. SSH into your Proxmox node
2. Create a container or VM
3. Install Docker (if not already installed)
4. Run the one-liner command above

## Project Structure

```
cv-resume-generator/
├── server.js              # Express server
├── routes/
│   └── api.js            # API routes
├── generators/
│   ├── pdfGenerator.js   # PDF generation
│   └── docxGenerator.js  # DOCX generation
├── public/
│   ├── index.html        # Web interface
│   ├── style.css         # Styling
│   └── app.js            # Frontend logic
├── ecosystem.config.js   # PM2 config
└── Dockerfile            # Docker config
```

## API

### POST /api/generate

Generates PDF and DOCX files from CV data.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "currentJob": "Software Engineer",
  "summary": "Professional summary...",
  "experience": [...],
  "education": [...],
  "skills": ["JavaScript", "Python"],
  "projects": [...],
  "certifications": [...],
  "languages": ["English", "Spanish"]
}
```

**Response:** ZIP file containing both PDF and DOCX

## Technologies

- Node.js + Express
- PDFKit (PDF generation)
- docx (DOCX generation)
- PM2 (process management)
- Docker (containerization)

## License

MIT

