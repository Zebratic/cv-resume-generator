import { NextRequest, NextResponse } from 'next/server';
const pdfGenerator = require('@/generators/pdfGenerator');
const docxGenerator = require('@/generators/docxGenerator');
const latexGenerator = require('@/generators/latexGenerator');
const archiver = require('archiver');
const { Readable } = require('stream');

export async function POST(request: NextRequest) {
  try {
    const cvData = await request.json();

    if (!cvData.fullName || !cvData.email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const pdfBuffer = await pdfGenerator.generate(cvData);
    const docxBuffer = await docxGenerator.generate(cvData);
    const latexBuffer = latexGenerator.generate(cvData);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    const nameBase = cvData.fullName.replace(/\s+/g, '_');
    archive.append(Readable.from(pdfBuffer), { name: `${nameBase}_CV.pdf` });
    archive.append(Readable.from(docxBuffer), { name: `${nameBase}_CV.docx` });
    archive.append(Readable.from(latexBuffer), { name: `${nameBase}_CV.tex` });

    await new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="cv-resume.zip"`,
      },
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate documents', details: error.message },
      { status: 500 }
    );
  }
}

