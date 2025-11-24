import { NextRequest, NextResponse } from 'next/server';
const pdfGenerator = require('@/generators/pdfGenerator');

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

