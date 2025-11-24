/**
 * Parse inline markdown formatting (bold, italic) from a line
 */
function parseInlineMarkdown(line) {
  const segments = [];
  let currentIndex = 0;
  const lineLength = line.length;
  
  while (currentIndex < lineLength) {
    // Check for bold italic (***text***)
    if (line.substring(currentIndex, currentIndex + 3) === '***') {
      const endIndex = line.indexOf('***', currentIndex + 3);
      if (endIndex !== -1) {
        const content = line.substring(currentIndex + 3, endIndex);
        segments.push({ text: content, bold: true, italic: true });
        currentIndex = endIndex + 3;
        continue;
      }
    }
    
    // Check for bold (**text**)
    if (line.substring(currentIndex, currentIndex + 2) === '**') {
      const endIndex = line.indexOf('**', currentIndex + 2);
      if (endIndex !== -1) {
        const content = line.substring(currentIndex + 2, endIndex);
        segments.push({ text: content, bold: true, italic: false });
        currentIndex = endIndex + 2;
        continue;
      }
    }
    
    // Check for italic (*text*)
    if (line[currentIndex] === '*' && 
        (currentIndex === 0 || line[currentIndex - 1] !== '*') &&
        (currentIndex === lineLength - 1 || line[currentIndex + 1] !== '*')) {
      const endIndex = line.indexOf('*', currentIndex + 1);
      if (endIndex !== -1 && (endIndex === lineLength - 1 || line[endIndex + 1] !== '*')) {
        const content = line.substring(currentIndex + 1, endIndex);
        segments.push({ text: content, bold: false, italic: true });
        currentIndex = endIndex + 1;
        continue;
      }
    }
    
    // Regular text - find next formatting marker
    let nextMarker = lineLength;
    const markers = [
      line.indexOf('***', currentIndex),
      line.indexOf('**', currentIndex),
      line.indexOf('*', currentIndex)
    ].filter(idx => idx !== -1 && idx >= currentIndex);
    
    if (markers.length > 0) {
      nextMarker = Math.min(...markers);
    }
    
    if (nextMarker > currentIndex) {
      const content = line.substring(currentIndex, nextMarker);
      if (content) {
        segments.push({ text: content, bold: false, italic: false });
      }
      currentIndex = nextMarker;
    } else {
      // No more markers, add remaining text
      const content = line.substring(currentIndex);
      if (content) {
        segments.push({ text: content, bold: false, italic: false });
      }
      break;
    }
  }
  
  return segments;
}

/**
 * Parse Markdown text and return segments with formatting information
 * for PDF rendering. Handles headers and inline formatting.
 */
function parseMarkdownForPDF(text) {
  if (!text) return [{ text: '', bold: false, italic: false, headerLevel: 0 }];
  
  const allSegments = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for headers (#, ##, ###, ####)
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const headerLevel = headerMatch[1].length; // 1-4
      const headerText = headerMatch[2].trim();
      
      // Parse inline formatting within the header
      const inlineSegments = parseInlineMarkdown(headerText);
      inlineSegments.forEach(segment => {
        segment.headerLevel = headerLevel;
        allSegments.push(segment);
      });
      
      // Add line break after header
      if (i < lines.length - 1) {
        allSegments.push({ text: '\n', bold: false, italic: false, headerLevel: 0 });
      }
      continue;
    }
    
    // Regular line - parse inline formatting
    const inlineSegments = parseInlineMarkdown(line);
    inlineSegments.forEach(segment => {
      segment.headerLevel = 0;
      allSegments.push(segment);
    });
    
    // Add line break (except for last line)
    if (i < lines.length - 1) {
      allSegments.push({ text: '\n', bold: false, italic: false, headerLevel: 0 });
    }
  }
  
  return allSegments.length > 0 ? allSegments : [{ text: '', bold: false, italic: false, headerLevel: 0 }];
}

/**
 * Render Markdown text in PDF with proper formatting
 * Returns the Y position after rendering
 */
function renderMarkdownText(doc, text, x, y, options = {}) {
  if (!text) return y;
  
  // Convert to string if not already
  const textStr = String(text);
  if (!textStr.trim()) return y;
  
  const baseFontSize = options.fontSize || 10;
  const width = options.width;
  const align = options.align || 'left';
  
  // Calculate header font sizes relative to base
  const headerSizes = {
    1: baseFontSize * 2.0,  // # - biggest (title sized)
    2: baseFontSize * 1.6,  // ## - bit smaller
    3: baseFontSize * 1.3,  // ### - even smaller
    4: baseFontSize * 1.1   // #### - smallest but bigger than normal
  };
  
  try {
    const segments = parseMarkdownForPDF(textStr);
    if (!segments || segments.length === 0) {
      // Fallback to plain text
      return renderPlainText(doc, textStr, x, y, baseFontSize, width, align);
    }
    
    // If we have headers, we need to handle multi-line rendering
    const hasHeaders = segments.some(s => s.headerLevel > 0);
    
    if (!width && !hasHeaders) {
    // Single line - render segments horizontally
    let currentX = x;
    let totalWidth = 0;
    
    // Calculate total width for centering
    segments.forEach((segment) => {
      const segFontSize = segment.headerLevel > 0 ? headerSizes[segment.headerLevel] : baseFontSize;
      if (segment.bold && segment.italic) {
        doc.font('Helvetica-BoldOblique');
      } else if (segment.bold) {
        doc.font('Helvetica-Bold');
      } else if (segment.italic) {
        doc.font('Helvetica-Oblique');
      } else {
        doc.font('Helvetica');
      }
      doc.fontSize(segFontSize);
      totalWidth += doc.widthOfString(segment.text);
    });
    
    // Adjust X for center alignment
    if (align === 'center') {
      currentX = x - totalWidth / 2;
    }
    
    // Render segments
    segments.forEach((segment) => {
      const segFontSize = segment.headerLevel > 0 ? headerSizes[segment.headerLevel] : baseFontSize;
      // Set font
      if (segment.bold && segment.italic) {
        doc.font('Helvetica-BoldOblique');
      } else if (segment.bold) {
        doc.font('Helvetica-Bold');
      } else if (segment.italic) {
        doc.font('Helvetica-Oblique');
      } else {
        doc.font('Helvetica');
      }
      doc.fontSize(segFontSize);
      
      const textWidth = doc.widthOfString(segment.text);
      
      // Render text
      try {
        doc.text(segment.text, currentX, y);
      } catch (e) {
        // Fallback if text rendering fails
        console.error('Error rendering text segment:', e);
      }
      
      currentX += textWidth;
    });
    
    const resultY = y + baseFontSize * 1.2;
    return isNaN(resultY) ? y : resultY;
  }
  
  // Multi-line with wrapping (or headers)
  let currentY = y;
  let currentLineSegments = [];
  let currentLineWidth = 0;
  let lineStartX = x;
  let currentHeaderLevel = 0;
  let currentLineHeight = baseFontSize * 1.2;
  
  segments.forEach((segment) => {
    // Handle line breaks
    if (segment.text === '\n') {
      // Render current line before the break
      if (currentLineSegments.length > 0) {
        let renderX = lineStartX;
        if (align === 'center') {
          renderX = x + (width ? (width - currentLineWidth) / 2 : 0);
        }
        try {
          renderLine(doc, currentLineSegments, renderX, currentY, currentHeaderLevel > 0 ? headerSizes[currentHeaderLevel] : baseFontSize);
        } catch (e) {
          console.error('Error rendering line:', e);
        }
        currentY += currentLineHeight;
        currentLineSegments = [];
        currentLineWidth = 0;
        currentHeaderLevel = 0;
        currentLineHeight = baseFontSize * 1.2;
      } else {
        // Empty line, just add spacing
        currentY += currentLineHeight;
      }
      return;
    }
    
    // Update header level for this segment
    if (segment.headerLevel > 0) {
      currentHeaderLevel = segment.headerLevel;
      currentLineHeight = headerSizes[currentHeaderLevel] * 1.2;
    }
    
    const segFontSize = segment.headerLevel > 0 ? headerSizes[segment.headerLevel] : baseFontSize;
    
    // Set font for measuring
    if (segment.bold && segment.italic) {
      doc.font('Helvetica-BoldOblique');
    } else if (segment.bold) {
      doc.font('Helvetica-Bold');
    } else if (segment.italic) {
      doc.font('Helvetica-Oblique');
    } else {
      doc.font('Helvetica');
    }
    doc.fontSize(segFontSize);
    
    // If no width specified, render directly (but still handle headers)
    if (!width) {
      if (segment.text.trim()) {
        try {
          const segFontSize = segment.headerLevel > 0 ? headerSizes[segment.headerLevel] : baseFontSize;
          if (segment.bold && segment.italic) {
            doc.font('Helvetica-BoldOblique');
          } else if (segment.bold) {
            doc.font('Helvetica-Bold');
          } else if (segment.italic) {
            doc.font('Helvetica-Oblique');
          } else {
            doc.font('Helvetica');
          }
          doc.fontSize(segFontSize);
          doc.text(segment.text, x, currentY);
          currentY += (segment.headerLevel > 0 ? headerSizes[segment.headerLevel] : baseFontSize) * 1.2;
        } catch (e) {
          console.error('Error rendering segment:', e);
        }
      }
      return;
    }
    
    // Word wrapping logic
    const words = segment.text.split(/\s+/).filter(w => w.length > 0);
    
    words.forEach((word, wordIndex) => {
      const spaceWidth = wordIndex > 0 ? doc.widthOfString(' ') : 0;
      const wordWidth = doc.widthOfString(word);
      const testWidth = currentLineWidth + spaceWidth + wordWidth;
      
      if (testWidth > width && currentLineWidth > 0) {
        // Render current line (centered if needed)
        let renderX = lineStartX;
        if (align === 'center') {
          renderX = x + (width - currentLineWidth) / 2;
        }
        try {
          renderLine(doc, currentLineSegments, renderX, currentY, segFontSize);
        } catch (e) {
          console.error('Error rendering line:', e);
        }
        currentY += currentLineHeight;
        currentLineWidth = 0;
        currentLineSegments = [];
        lineStartX = x;
      }
      
      // Add word to current line
      currentLineSegments.push({
        text: word,
        bold: segment.bold,
        italic: segment.italic,
        headerLevel: segment.headerLevel,
        spaceBefore: wordIndex > 0 || currentLineSegments.length > 0
      });
      
      currentLineWidth += spaceWidth + wordWidth;
    });
  });
  
  // Render last line (centered if needed)
  if (currentLineSegments.length > 0) {
    let renderX = lineStartX;
    if (align === 'center') {
      renderX = x + (width ? (width - currentLineWidth) / 2 : 0);
    }
    try {
      renderLine(doc, currentLineSegments, renderX, currentY, currentHeaderLevel > 0 ? headerSizes[currentHeaderLevel] : baseFontSize);
    } catch (e) {
      console.error('Error rendering last line:', e);
    }
    currentY += currentLineHeight;
  }
  
    // Ensure we return a valid number
    const resultY = currentY || y;
    return isNaN(resultY) ? y + fontSize * 1.2 : resultY;
  } catch (error) {
    console.error('Error in renderMarkdownText:', error, text);
    // Fallback: render as plain text
    const fallbackY = renderPlainText(doc, textStr, x, y, fontSize, width, align);
    return isNaN(fallbackY) ? y + fontSize * 1.2 : fallbackY;
  }
}

/**
 * Fallback function to render plain text when markdown rendering fails
 */
function renderPlainText(doc, text, x, y, fontSize, width, align) {
  try {
    if (!text) return y;
    
    doc.font('Helvetica').fontSize(fontSize);
    if (width) {
      doc.text(String(text), x, y, { width: width, align: align || 'left' });
      // Estimate height
      const textLength = String(text).length;
      const charsPerLine = Math.floor(width / (fontSize * 0.6));
      const lines = Math.max(1, Math.ceil(textLength / charsPerLine));
      const resultY = y + lines * fontSize * 1.2;
      return isNaN(resultY) ? y + fontSize * 1.2 : resultY;
    } else {
      doc.text(String(text), x, y);
      const resultY = y + fontSize * 1.2;
      return isNaN(resultY) ? y : resultY;
    }
  } catch (fallbackError) {
    console.error('Fallback rendering also failed:', fallbackError);
    // Return at least a valid Y position
    const resultY = y + fontSize * 1.2;
    return isNaN(resultY) ? y : resultY;
  }
}

/**
 * Render a single line of text segments
 */
function renderLine(doc, segments, x, y, fontSize) {
  if (!segments || segments.length === 0) return;
  
  let currentX = x;
  
  segments.forEach((segment) => {
    if (!segment || !segment.text) return;
    
    try {
      // Use segment's header level font size if available, otherwise use provided fontSize
      const segFontSize = segment.headerLevel > 0 
        ? fontSize * (segment.headerLevel === 1 ? 2.0 : segment.headerLevel === 2 ? 1.6 : segment.headerLevel === 3 ? 1.3 : 1.1)
        : fontSize;
      
      // Set font
      if (segment.bold && segment.italic) {
        doc.font('Helvetica-BoldOblique');
      } else if (segment.bold) {
        doc.font('Helvetica-Bold');
      } else if (segment.italic) {
        doc.font('Helvetica-Oblique');
      } else {
        doc.font('Helvetica');
      }
      doc.fontSize(segFontSize);
      
      // Add space if needed
      if (segment.spaceBefore) {
        const spaceWidth = doc.widthOfString(' ');
        doc.text(' ', currentX, y);
        currentX += spaceWidth;
      }
      
      // Render text
      const textWidth = doc.widthOfString(segment.text);
      doc.text(segment.text, currentX, y);
      currentX += textWidth;
    } catch (e) {
      console.error('Error rendering segment:', e, segment);
      // Continue with next segment - render as plain text
      try {
        doc.font('Helvetica').fontSize(fontSize);
        doc.text(segment.text || '', currentX, y);
        currentX += doc.widthOfString(segment.text || '');
      } catch (fallbackError) {
        // Skip this segment
      }
    }
  });
}

module.exports = { parseMarkdownForPDF, renderMarkdownText };
