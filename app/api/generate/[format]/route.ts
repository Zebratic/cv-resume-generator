import { NextRequest, NextResponse } from 'next/server';
const pdfGenerator = require('@/generators/pdfGenerator');
const docxGenerator = require('@/generators/docxGenerator');
const latexGenerator = require('@/generators/latexGenerator');

export async function POST(
  request: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const cvData = await request.json();
    const format = params.format;

    if (!cvData.fullName || !cvData.email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const nameBase = cvData.fullName.replace(/\s+/g, '_');
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'pdf':
        buffer = await pdfGenerator.generate(cvData);
        contentType = 'application/pdf';
        filename = `${nameBase}_CV.pdf`;
        break;
      case 'docx':
        buffer = await docxGenerator.generate(cvData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${nameBase}_CV.docx`;
        break;
      case 'latex':
        buffer = latexGenerator.generate(cvData);
        contentType = 'text/plain';
        filename = `${nameBase}_CV.tex`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error(`${params.format} generation error:`, error);
    return NextResponse.json(
      { error: `Failed to generate ${params.format}`, details: error.message },
      { status: 500 }
    );
  }
}

