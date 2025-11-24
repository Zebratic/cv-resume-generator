const { getLabel, getProficiencyLabel } = require('../lib/labels');
const { renderMarkdownText } = require('../lib/markdown-pdf');

/**
 * Safe wrapper for renderMarkdownText that falls back to plain text on error
 */
function safeRenderMarkdown(doc, text, x, y, options = {}) {
  try {
    const result = renderMarkdownText(doc, text, x, y, options);
    // Ensure we got a valid number
    if (isNaN(result) || result === undefined || result === null) {
      throw new Error('Invalid Y position returned');
    }
    return result;
  } catch (error) {
    console.error('Error in safeRenderMarkdown:', error, text);
    // Fallback to plain text
    const fontSize = options.fontSize || 10;
    const width = options.width;
    doc.font('Helvetica').fontSize(fontSize);
    if (width) {
      doc.text(String(text || ''), x, y, { width: width, align: options.align || 'left' });
      const lines = Math.ceil(String(text || '').length / (width / (fontSize * 0.6)));
      return y + lines * fontSize * 1.2;
    } else {
      doc.text(String(text || ''), x, y);
      return y + fontSize * 1.2;
    }
  }
}

// Dynamic require to ensure PDFKit loads correctly in Next.js
function getPDFDocument() {
  const pdfkit = require('pdfkit');
  return pdfkit.default || pdfkit;
}

/**
 * Strip Markdown formatting to plain text for PDF generation
 */
function markdownToPlainText(markdown) {
  if (!markdown) return '';
  
  // Remove markdown formatting
  let text = markdown
    // Remove bold/italic markers
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Bold italic
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/__(.*?)__/g, '$1') // Bold (underscore)
    .replace(/_(.*?)_/g, '$1') // Italic (underscore)
    // Remove inline code
    .replace(/`(.*?)`/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+(.*)$/gm, '$1')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove HTML tags (for font size spans)
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

/**
 * Estimate text height based on font size, text length, and width
 */
function estimateTextHeight(text, fontSize, width) {
  if (!text) return 0;
  const charsPerLine = Math.floor(width / (fontSize * 0.6));
  const lines = Math.ceil(text.length / charsPerLine);
  return lines * fontSize * 1.2;
}

/**
 * @param {Object} cvData
 * @returns {Promise<Buffer>}
 */
function generate(cvData) {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = getPDFDocument();
      const layout = cvData.layout || 'classic';
      const doc = new PDFDocument({ margin: layout === 'sidebar' ? 0 : 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Sidebar Layout
      if (layout === 'sidebar') {
        const sidebarWidth = 180;
        const mainWidth = doc.page.width - sidebarWidth;
        
        // Sidebar background
        doc.rect(0, 0, sidebarWidth, doc.page.height)
           .fillColor('#1e3a8a')
           .fill();
        
        let sidebarY = 50;
        
        // Profile photo in sidebar
        if (cvData.profilePhoto) {
          try {
            const imageBuffer = Buffer.from(cvData.profilePhoto.split(',')[1], 'base64');
            const photoX = sidebarWidth / 2 - 50;
            const photoY = sidebarY;
            const photoSize = 100;
            const radius = photoSize / 2;
            const centerX = photoX + radius;
            const centerY = photoY + radius;
            
            // Draw circular border
            doc.circle(centerX, centerY, radius + 2)
               .lineWidth(3)
               .strokeColor('#ffffff')
               .stroke();
            
            // Clip to circle and draw image
            doc.save();
            doc.circle(centerX, centerY, radius);
            doc.clip();
            doc.image(imageBuffer, photoX, photoY, { 
              width: photoSize, 
              height: photoSize,
              fit: [photoSize, photoSize]
            });
            doc.restore();
            
            sidebarY += 120;
          } catch (err) {
            console.error('Error adding photo:', err);
          }
        }
        
        // Name in sidebar - centered with word wrapping
        if (cvData.fullName) {
          doc.fillColor('#ffffff')
             .fontSize(20);
          sidebarY = safeRenderMarkdown(doc, cvData.fullName, 20, sidebarY, {
            fontSize: 20,
            width: sidebarWidth - 40,
            align: 'center'
          });
          sidebarY += 16;
        }
        
        // Current job - centered below name
        if (cvData.currentJob) {
          doc.fontSize(12)
             .font('Helvetica')
             .fillColor('#bfdbfe')
             .text(cvData.currentJob, 20, sidebarY, { 
               width: sidebarWidth - 40,
               align: 'center'
             });
          sidebarY += estimateTextHeight(cvData.currentJob, 12, sidebarWidth - 40) + 16;
        }
        
        // Contact info in sidebar
        doc.fillColor('#ffffff');
        if (cvData.email) {
          doc.fontSize(11).font('Helvetica-Bold').text(`${getLabel(cvData, 'email')}:`, 20, sidebarY, { width: sidebarWidth - 40 });
          doc.fontSize(9).font('Helvetica').fillColor('#e0e7ff').text(cvData.email, 20, sidebarY + 12, { width: sidebarWidth - 40 });
          sidebarY += 30;
        }
        if (cvData.phone) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text(`${getLabel(cvData, 'phone')}:`, 20, sidebarY, { width: sidebarWidth - 40 });
          doc.fontSize(9).font('Helvetica').fillColor('#e0e7ff').text(cvData.phone, 20, sidebarY + 12, { width: sidebarWidth - 40 });
          sidebarY += 30;
        }
        if (cvData.address) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text(`${getLabel(cvData, 'address')}:`, 20, sidebarY, { width: sidebarWidth - 40 });
          doc.fontSize(9).font('Helvetica').fillColor('#e0e7ff').text(cvData.address, 20, sidebarY + 12, { width: sidebarWidth - 40 });
          sidebarY += 30;
        }
        if (cvData.linkedin) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text('LinkedIn:', 20, sidebarY, { width: sidebarWidth - 40 });
          doc.fontSize(9).font('Helvetica').fillColor('#e0e7ff').text(cvData.linkedin, 20, sidebarY + 12, { width: sidebarWidth - 40 });
          const linkedinHeight = estimateTextHeight(cvData.linkedin, 9, sidebarWidth - 40);
          sidebarY += 12 + linkedinHeight + 6; // Label height (12) + content height + margin
        }
        if (cvData.website) {
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff').text('Website:', 20, sidebarY, { width: sidebarWidth - 40 });
          doc.fontSize(9).font('Helvetica').fillColor('#e0e7ff').text(cvData.website, 20, sidebarY + 12, { width: sidebarWidth - 40 });
          sidebarY += 40;
        }
        
        // Skills in sidebar
        if (cvData.skills && (typeof cvData.skills === 'string' ? cvData.skills.trim() : cvData.skills.length > 0)) {
          sidebarY += 10;
          const skillsText = typeof cvData.skills === 'string' ? cvData.skills : cvData.skills.join(', ');
          doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'skills'), 20, sidebarY, { width: sidebarWidth - 40 });
          sidebarY += estimateTextHeight(getLabel(cvData, 'skills'), 18, sidebarWidth - 40) + 4;
          // Line splitter
          doc.moveTo(20, sidebarY).lineTo(sidebarWidth - 20, sidebarY)
             .strokeColor('#2563eb').lineWidth(1).stroke();
          sidebarY += 8;
          doc.fontSize(10).font('Helvetica').fillColor('#e0e7ff')
             .text(skillsText, 20, sidebarY, { width: sidebarWidth - 40 });
          sidebarY += estimateTextHeight(skillsText, 10, sidebarWidth - 40) + 20;
        }
        
        // Languages in sidebar
        if (cvData.languages && cvData.languages.length > 0) {
          sidebarY += 10;
          doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'languages'), 20, sidebarY, { width: sidebarWidth - 40 });
          sidebarY += estimateTextHeight(getLabel(cvData, 'languages'), 18, sidebarWidth - 40) + 4;
          // Line splitter
          doc.moveTo(20, sidebarY).lineTo(sidebarWidth - 20, sidebarY)
             .strokeColor('#2563eb').lineWidth(1).stroke();
          sidebarY += 8;
          doc.fontSize(10).font('Helvetica').fillColor('#e0e7ff');
          cvData.languages.forEach((l, i) => {
            doc.text(`${l.name} (${getProficiencyLabel(cvData, l.level)})`, 20, sidebarY, { width: sidebarWidth - 40 });
            sidebarY += 12;
          });
        }
        
        // Main content area
        let mainY = 50;
        doc.fillColor('#000000');
        
        // Summary
        if (cvData.summary) {
          doc.fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'professionalSummary'), sidebarWidth + 20, mainY);
          mainY += estimateTextHeight(getLabel(cvData, 'professionalSummary'), 18, mainWidth - 40) + 4;
          // Line splitter
          doc.moveTo(sidebarWidth + 20, mainY).lineTo(doc.page.width - 20, mainY)
             .strokeColor('#2563eb').lineWidth(2).stroke();
          mainY += 8;
          mainY = safeRenderMarkdown(doc, cvData.summary, sidebarWidth + 20, mainY, {
            fontSize: 10,
            width: mainWidth - 40,
            align: 'justify'
          });
          mainY += 20;
        }
        
        // Experience
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'workExperience'), sidebarWidth + 20, mainY);
          mainY += estimateTextHeight(getLabel(cvData, 'workExperience'), 18, mainWidth - 40) + 4;
          // Line splitter
          doc.moveTo(sidebarWidth + 20, mainY).lineTo(doc.page.width - 20, mainY)
             .strokeColor('#2563eb').lineWidth(2).stroke();
          mainY += 8;
          cvData.experience.forEach((exp) => {
            const title = exp.title || '';
            // If title has markdown, render it; otherwise render directly as bold
            if (title.includes('**') || title.includes('*') || title.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              mainY = safeRenderMarkdown(doc, title, sidebarWidth + 20, mainY, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(title, sidebarWidth + 20, mainY);
              mainY += 11 * 1.2;
            }
            // Grey italic text for company/location/date
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${exp.company || ''}${exp.location ? ' - ' + exp.location : ''}${exp.startDate && exp.endDate ? ' | ' + exp.startDate + ' - ' + exp.endDate : ''}`, 
                     sidebarWidth + 20, mainY)
               .font('Helvetica').fillColor('#000000');
            mainY += 10;
            if (exp.description) {
              mainY = safeRenderMarkdown(doc, exp.description, sidebarWidth + 20, mainY, {
                fontSize: 9,
                width: mainWidth - 40,
                align: 'justify'
              });
              mainY += 12;
            }
          });
          mainY += 10;
        }
        
        // Education
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'education'), sidebarWidth + 20, mainY);
          mainY += estimateTextHeight(getLabel(cvData, 'education'), 18, mainWidth - 40) + 4;
          // Line splitter
          doc.moveTo(sidebarWidth + 20, mainY).lineTo(doc.page.width - 20, mainY)
             .strokeColor('#2563eb').lineWidth(2).stroke();
          mainY += 8;
          cvData.education.forEach((edu) => {
            const degree = edu.degree || '';
            // If degree has markdown, render it; otherwise render directly as bold
            if (degree.includes('**') || degree.includes('*') || degree.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              mainY = safeRenderMarkdown(doc, degree, sidebarWidth + 20, mainY, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(degree, sidebarWidth + 20, mainY);
              mainY += 11 * 1.2;
            }
            // Grey italic text for institution/location/year
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${edu.institution || ''}${edu.location ? ' - ' + edu.location : ''}${edu.year ? ' | ' + edu.year : ''}`, 
                     sidebarWidth + 20, mainY)
               .font('Helvetica').fillColor('#000000');
            mainY += 10;
            if (edu.description) {
              mainY = safeRenderMarkdown(doc, edu.description, sidebarWidth + 20, mainY, {
                fontSize: 9,
                width: mainWidth - 40,
                align: 'left'
              });
              mainY += 10;
            }
            mainY += 6;
          });
        }
        
        // Projects
        if (cvData.projects && cvData.projects.length > 0) {
          doc.fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'projects'), sidebarWidth + 20, mainY);
          mainY += estimateTextHeight(getLabel(cvData, 'projects'), 18, mainWidth - 40) + 4;
          // Line splitter
          doc.moveTo(sidebarWidth + 20, mainY).lineTo(doc.page.width - 20, mainY)
             .strokeColor('#2563eb').lineWidth(2).stroke();
          mainY += 8;
          cvData.projects.forEach((project) => {
            const name = project.name || '';
            // If name has markdown, render it; otherwise render directly as bold
            if (name.includes('**') || name.includes('*') || name.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              mainY = safeRenderMarkdown(doc, name, sidebarWidth + 20, mainY, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(name, sidebarWidth + 20, mainY);
              mainY += 11 * 1.2;
            }
            if (project.technologies) {
              doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
                 .text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, sidebarWidth + 20, mainY)
                 .font('Helvetica').fillColor('#000000');
              mainY += 10;
            }
            if (project.description) {
              mainY = safeRenderMarkdown(doc, project.description, sidebarWidth + 20, mainY, {
                fontSize: 9,
                width: mainWidth - 40,
                align: 'justify'
              });
              mainY += 10;
            }
          });
        }
        
        // Certifications
        if (cvData.certifications && cvData.certifications.length > 0) {
          doc.fontSize(18).font('Helvetica-Bold')
             .text(getLabel(cvData, 'certifications'), sidebarWidth + 20, mainY);
          mainY += estimateTextHeight(getLabel(cvData, 'certifications'), 18, mainWidth - 40) + 4;
          // Line splitter
          doc.moveTo(sidebarWidth + 20, mainY).lineTo(doc.page.width - 20, mainY)
             .strokeColor('#2563eb').lineWidth(2).stroke();
          mainY += 8;
          cvData.certifications.forEach((cert) => {
            doc.fontSize(9).font('Helvetica')
               .text(`${cert.name || ''}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`, 
                     sidebarWidth + 20, mainY);
            mainY += 15;
          });
        }
      }
      // Modern Layout
      else if (layout === 'modern') {
        let y = 50;
        
        // Header with photo
        if (cvData.profilePhoto) {
          try {
            const imageBuffer = Buffer.from(cvData.profilePhoto.split(',')[1], 'base64');
            const photoX = 50;
            const photoY = y;
            const photoSize = 100;
            const radius = photoSize / 2;
            const centerX = photoX + radius;
            const centerY = photoY + radius;
            
            // Draw circular border
            doc.circle(centerX, centerY, radius + 2)
               .lineWidth(3)
               .strokeColor('#2563eb')
               .stroke();
            
            // Clip to circle and draw image
            doc.save();
            doc.circle(centerX, centerY, radius);
            doc.clip();
            doc.image(imageBuffer, photoX, photoY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
            doc.restore();
          } catch (err) {
            console.error('Error adding photo:', err);
          }
        }
        
        doc.fontSize(28);
        y = safeRenderMarkdown(doc, cvData.fullName || '', cvData.profilePhoto ? 170 : 50, y, { fontSize: 28 });
        y += 35;
        
        if (cvData.currentJob) {
          doc.fontSize(14).font('Helvetica')
             .fillColor('#666666')
             .text(cvData.currentJob, cvData.profilePhoto ? 170 : 50, y);
          y += 20;
        }
        
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        const contactParts = [cvData.email, cvData.phone, cvData.address, cvData.linkedin, cvData.website].filter(Boolean);
        doc.text(contactParts.join('  •  '), cvData.profilePhoto ? 170 : 50, y, { width: 400 });
        y += 40;
        
        // Summary
        if (cvData.summary) {
          doc.fontSize(16).font('Helvetica-Bold')
             .text(getLabel(cvData, 'professionalSummary'), 50, y);
          y += 20;
          y = safeRenderMarkdown(doc, cvData.summary, 50, y, {
            fontSize: 10,
            width: 500,
            align: 'justify'
          });
          y += 25;
        }
        
        // Two column layout
        const col1X = 50;
        const col2X = 320;
        const colWidth = 240;
        let col1Y = y;
        let col2Y = y;
        
        // Column 1: Experience, Education
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'workExperience'), col1X, col1Y);
          col1Y += 20;
          cvData.experience.forEach((exp) => {
            const title = exp.title || '';
            if (title.includes('**') || title.includes('*') || title.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              col1Y = safeRenderMarkdown(doc, title, col1X, col1Y, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(title, col1X, col1Y);
              col1Y += 11 * 1.2;
            }
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${exp.company || ''}${exp.location ? ' • ' + exp.location : ''}${exp.startDate && exp.endDate ? ' • ' + exp.startDate + ' - ' + exp.endDate : ''}`, 
                     col1X, col1Y, { width: colWidth })
               .font('Helvetica').fillColor('#000000');
            col1Y += 10;
            if (exp.description) {
              col1Y = safeRenderMarkdown(doc, exp.description, col1X, col1Y, {
                fontSize: 9,
                width: colWidth,
                align: 'justify'
              });
              col1Y += 10;
            }
          });
          col1Y += 15;
        }
        
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'education'), col1X, col1Y);
          col1Y += 20;
          cvData.education.forEach((edu) => {
            const degree = edu.degree || '';
            if (degree.includes('**') || degree.includes('*') || degree.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              col1Y = safeRenderMarkdown(doc, degree, col1X, col1Y, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(degree, col1X, col1Y);
              col1Y += 11 * 1.2;
            }
            doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${edu.institution || ''}${edu.location ? ' • ' + edu.location : ''}${edu.year ? ' • ' + edu.year : ''}`, 
                     col1X, col1Y, { width: colWidth })
               .font('Helvetica').fillColor('#000000');
            col1Y += 10;
            if (edu.description) {
              col1Y = safeRenderMarkdown(doc, edu.description, col1X, col1Y, {
                fontSize: 9,
                width: colWidth,
                align: 'justify'
              });
              col1Y += 8;
            }
            col1Y += 8;
          });
        }
        
        // Column 2: Skills, Projects, Certifications, Languages
        if (cvData.skills && cvData.skills.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'skills'), col2X, col2Y);
          col2Y += 20;
          doc.fontSize(9).font('Helvetica')
             .text(cvData.skills.join(', '), col2X, col2Y, { width: colWidth });
          col2Y += estimateTextHeight(cvData.skills.join(', '), 9, colWidth) + 20;
        }
        
        if (cvData.projects && cvData.projects.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'projects'), col2X, col2Y);
          col2Y += 20;
          cvData.projects.forEach((project) => {
            const name = project.name || '';
            if (name.includes('**') || name.includes('*') || name.includes('#')) {
              doc.fontSize(11).font('Helvetica-Bold');
              col2Y = safeRenderMarkdown(doc, name, col2X, col2Y, { fontSize: 11 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(11).font('Helvetica-Bold')
                 .text(name, col2X, col2Y);
              col2Y += 11 * 1.2;
            }
            if (project.technologies) {
              doc.fontSize(9).font('Helvetica-Oblique').fillColor('#4B5563')
                 .text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, col2X, col2Y, { width: colWidth })
                 .font('Helvetica').fillColor('#000000');
              col2Y += 10;
            }
            if (project.description) {
              col2Y = safeRenderMarkdown(doc, project.description, col2X, col2Y, {
                fontSize: 9,
                width: colWidth,
                align: 'justify'
              });
              col2Y += 10;
            }
          });
          col2Y += 15;
        }
        
        if (cvData.certifications && cvData.certifications.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'certifications'), col2X, col2Y);
          col2Y += 20;
          cvData.certifications.forEach((cert) => {
            doc.fontSize(9).font('Helvetica')
               .text(`${markdownToPlainText(cert.name || '')}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`, 
                     col2X, col2Y, { width: colWidth });
            col2Y += 15;
          });
        }
        
        if (cvData.languages && cvData.languages.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'languages'), col2X, col2Y);
          col2Y += 20;
          doc.fontSize(9).font('Helvetica');
          cvData.languages.forEach((l) => {
            doc.text(`${l.name} (${getProficiencyLabel(cvData, l.level)})`, col2X, col2Y, { width: colWidth });
            col2Y += 12;
          });
        }
      }
      // Compact Layout
      else if (layout === 'compact') {
        let y = 40;
        doc.fontSize(9);
        
        // Header
        doc.fontSize(18);
        y = safeRenderMarkdown(doc, cvData.fullName || '', doc.page.width / 2, y, { fontSize: 18, align: 'center' });
        y += 15;
        
        const contactInfo = [
          cvData.email,
          cvData.phone,
          cvData.address,
          cvData.currentJob,
          cvData.linkedin,
          cvData.website,
          cvData.linkedin,
          cvData.website
        ].filter(Boolean).join(' | ');
        doc.fontSize(8).font('Helvetica')
           .text(contactInfo, { align: 'center', y: y });
        y += 20;
        
        // Two columns
        const col1X = 50;
        const col2X = 320;
        const colWidth = 240;
        let col1Y = y;
        let col2Y = y;
        
        // Summary (full width)
        if (cvData.summary) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'professionalSummary'), col1X, col1Y);
          col1Y += 12;
          col1Y = safeRenderMarkdown(doc, cvData.summary, col1X, col1Y, {
            fontSize: 8,
            width: 500,
            align: 'justify'
          });
          col1Y += 15;
          col2Y = col1Y;
        }
        
        // Column 1: Experience, Education
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'workExperience'), col1X, col1Y);
          col1Y += 12;
          cvData.experience.forEach((exp) => {
            const title = exp.title || '';
            if (title.includes('**') || title.includes('*') || title.includes('#')) {
              doc.fontSize(9).font('Helvetica-Bold');
              col1Y = safeRenderMarkdown(doc, title, col1X, col1Y, { fontSize: 9 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(9).font('Helvetica-Bold')
                 .text(title, col1X, col1Y);
              col1Y += 9 * 1.2;
            }
            col1Y += 2;
            doc.fontSize(7).font('Helvetica')
               .text(`${exp.company || ''}${exp.startDate && exp.endDate ? ', ' + exp.startDate + '-' + exp.endDate : ''}`, 
                     col1X, col1Y, { width: colWidth });
            col1Y += 9;
            if (exp.description) {
              col1Y = safeRenderMarkdown(doc, exp.description, col1X, col1Y, {
                fontSize: 7,
                width: colWidth,
                align: 'justify'
              });
              col1Y += 8;
            }
          });
          col1Y += 10;
        }
        
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'education'), col1X, col1Y);
          col1Y += 12;
          cvData.education.forEach((edu) => {
            const degree = edu.degree || '';
            if (degree.includes('**') || degree.includes('*') || degree.includes('#')) {
              doc.fontSize(9).font('Helvetica-Bold');
              col1Y = safeRenderMarkdown(doc, degree, col1X, col1Y, { fontSize: 9 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(9).font('Helvetica-Bold')
                 .text(degree, col1X, col1Y);
              col1Y += 9 * 1.2;
            }
            col1Y += 2;
            doc.fontSize(7).font('Helvetica')
               .text(`${edu.institution || ''}${edu.year ? ', ' + edu.year : ''}`, 
                     col1X, col1Y, { width: colWidth });
            col1Y += 10;
            if (edu.description) {
              col1Y = safeRenderMarkdown(doc, edu.description, col1X, col1Y, {
                fontSize: 7,
                width: colWidth
              });
              col1Y += 5;
            }
            col1Y += 5;
          });
        }
        
        // Column 2: Skills, Projects, Certifications, Languages
        if (cvData.skills && cvData.skills.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'skills'), col2X, col2Y);
          col2Y += 12;
          doc.fontSize(7).font('Helvetica')
             .text(cvData.skills.join(', '), col2X, col2Y, { width: colWidth });
          col2Y += estimateTextHeight(cvData.skills.join(', '), 7, colWidth) + 15;
        }
        
        if (cvData.projects && cvData.projects.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'projects'), col2X, col2Y);
          col2Y += 12;
          cvData.projects.forEach((project) => {
            const name = project.name || '';
            if (name.includes('**') || name.includes('*') || name.includes('#')) {
              doc.fontSize(9).font('Helvetica-Bold');
              col2Y = safeRenderMarkdown(doc, name, col2X, col2Y, { fontSize: 9 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(9).font('Helvetica-Bold')
                 .text(name, col2X, col2Y);
              col2Y += 9 * 1.2;
            }
            col2Y += 4;
            if (project.description) {
              col2Y = safeRenderMarkdown(doc, project.description, col2X, col2Y, {
                fontSize: 7,
                width: colWidth,
                align: 'justify'
              });
              col2Y += 8;
            }
          });
          col2Y += 10;
        }
        
        if (cvData.certifications && cvData.certifications.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'certifications'), col2X, col2Y);
          col2Y += 12;
          cvData.certifications.forEach((cert) => {
            doc.fontSize(7).font('Helvetica')
               .text(`${markdownToPlainText(cert.name || '')}${cert.date ? ' (' + cert.date + ')' : ''}`, 
                     col2X, col2Y, { width: colWidth });
            col2Y += 10;
          });
        }
        
        if (cvData.languages && cvData.languages.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'languages'), col2X, col2Y);
          col2Y += 12;
          doc.fontSize(7).font('Helvetica');
          cvData.languages.forEach((l) => {
            const langText = typeof l === 'string' ? l : `${l.name} (${getProficiencyLabel(cvData, l.level)})`;
            doc.text(langText, col2X, col2Y, { width: colWidth });
            col2Y += 10;
          });
        }
      }
      // Classic Layout (default)
      else {
        let y = 50;
        
        // Profile photo
        if (cvData.profilePhoto) {
          try {
            const imageBuffer = Buffer.from(cvData.profilePhoto.split(',')[1], 'base64');
            const photoX = doc.page.width / 2 - 50;
            const photoY = y;
            const photoSize = 100;
            const radius = photoSize / 2;
            const centerX = photoX + radius;
            const centerY = photoY + radius;
            
            // Draw circular border
            doc.circle(centerX, centerY, radius + 2)
               .lineWidth(3)
               .strokeColor('#2563eb')
               .stroke();
            
            // Clip to circle and draw image
            doc.save();
            doc.circle(centerX, centerY, radius);
            doc.clip();
            doc.image(imageBuffer, photoX, photoY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
            doc.restore();
            
            y += 120;
          } catch (err) {
            console.error('Error adding photo:', err);
          }
        }
        
        // Header
        doc.fontSize(24);
        y = safeRenderMarkdown(doc, cvData.fullName || '', doc.page.width / 2, y, { fontSize: 24, align: 'center' });
        y += 30;
        
        // Contact Information
        doc.fontSize(10).font('Helvetica');
        const contactInfo = [
          cvData.email,
          cvData.phone,
          cvData.address,
          cvData.linkedin,
          cvData.website,
          cvData.currentJob
        ].filter(Boolean).join(' | ');
        doc.text(contactInfo, { align: 'center', y: y });
        y += 30;

        // Professional Summary
        if (cvData.summary) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'professionalSummary'), { underline: true, y: y });
          y += 20;
          y = safeRenderMarkdown(doc, cvData.summary, 50, y, {
            fontSize: 11,
            width: 500,
            align: 'justify'
          });
          y += 20;
        }

        // Work Experience
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'workExperience'), { underline: true, y: y });
          y += 20;
          cvData.experience.forEach((exp, index) => {
            if (index > 0) y += 10;
            const title = exp.title || '';
            if (title.includes('**') || title.includes('*') || title.includes('#')) {
              doc.fontSize(12).font('Helvetica-Bold');
              y = safeRenderMarkdown(doc, title, 50, y, { fontSize: 12 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(12).font('Helvetica-Bold')
                 .text(title, 50, y);
              y += 12 * 1.2;
            }
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${exp.company || ''}${exp.location ? ' - ' + exp.location : ''}${exp.startDate && exp.endDate ? ' | ' + exp.startDate + ' - ' + exp.endDate : ''}`, { y: y })
               .font('Helvetica').fillColor('#000000');
            y += 10;
            if (exp.description) {
              y = safeRenderMarkdown(doc, exp.description, 50, y, {
                fontSize: 10,
                width: 500,
                align: 'justify'
              });
              y += 10;
            }
          });
          y += 10;
        }

        // Education
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'education'), { underline: true, y: y });
          y += 20;
          cvData.education.forEach((edu, index) => {
            if (index > 0) y += 10;
            const degree = edu.degree || '';
            if (degree.includes('**') || degree.includes('*') || degree.includes('#')) {
              doc.fontSize(12).font('Helvetica-Bold');
              y = safeRenderMarkdown(doc, degree, 50, y, { fontSize: 12 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(12).font('Helvetica-Bold')
                 .text(degree, 50, y);
              y += 12 * 1.2;
            }
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#4B5563')
               .text(`${edu.institution || ''}${edu.location ? ' - ' + edu.location : ''}${edu.year ? ' | ' + edu.year : ''}`, { y: y })
               .font('Helvetica').fillColor('#000000');
            y += 10;
            if (edu.description) {
              y = safeRenderMarkdown(doc, edu.description, 50, y, {
                fontSize: 10,
                width: 500,
                align: 'justify'
              });
              y += 10;
            }
          });
          y += 10;
        }

        // Skills
        if (cvData.skills && cvData.skills.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'skills'), { underline: true, y: y });
          y += 20;
          doc.fontSize(10).font('Helvetica').text(cvData.skills.join(', '), { y: y, width: 500 });
          y += 20;
        }

        // Projects
        if (cvData.projects && cvData.projects.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'projects'), { underline: true, y: y });
          y += 20;
          cvData.projects.forEach((project, index) => {
            if (index > 0) y += 10;
            const name = project.name || '';
            if (name.includes('**') || name.includes('*') || name.includes('#')) {
              doc.fontSize(12).font('Helvetica-Bold');
              y = safeRenderMarkdown(doc, name, 50, y, { fontSize: 12 });
              doc.font('Helvetica');
            } else {
              doc.fontSize(12).font('Helvetica-Bold')
                 .text(name, 50, y);
              y += 12 * 1.2;
            }
            y += 6;
            if (project.technologies) {
              doc.fontSize(10).font('Helvetica-Oblique').fillColor('#4B5563')
                 .text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, { y: y })
                 .font('Helvetica').fillColor('#000000');
              y += 10;
            }
            if (project.description) {
              y = safeRenderMarkdown(doc, project.description, 50, y, {
                fontSize: 10,
                width: 500,
                align: 'justify'
              });
              y += 10;
            }
          });
          y += 10;
        }

        // Certifications
        if (cvData.certifications && cvData.certifications.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'certifications'), { underline: true, y: y });
          y += 20;
          cvData.certifications.forEach((cert) => {
            doc.fontSize(10).font('Helvetica').text(`${markdownToPlainText(cert.name || '')}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`, { y: y });
            y += 15;
          });
          y += 10;
        }

        // Languages
        if (cvData.languages && cvData.languages.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'languages'), { underline: true, y: y });
          y += 20;
          doc.fontSize(10).font('Helvetica');
          cvData.languages.forEach((l) => {
            doc.text(`${l.name} (${getProficiencyLabel(cvData, l.level)})`, { y: y, width: 500 });
            y += 12;
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generate };

