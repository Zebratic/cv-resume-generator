const { getLabel, getProficiencyLabel } = require('../lib/labels');

// Dynamic require to ensure PDFKit loads correctly in Next.js
function getPDFDocument() {
  const pdfkit = require('pdfkit');
  return pdfkit.default || pdfkit;
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
        
        // Name in sidebar - centered
        if (cvData.fullName) {
          doc.fillColor('#ffffff')
             .fontSize(20)
             .font('Helvetica-Bold')
             .text(cvData.fullName, 20, sidebarY, { 
               width: sidebarWidth - 40,
               align: 'center'
             });
          sidebarY += estimateTextHeight(cvData.fullName, 20, sidebarWidth - 40) + 16;
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
          sidebarY += 30;
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
          doc.fontSize(10).font('Helvetica')
             .text(cvData.summary, sidebarWidth + 20, mainY, { 
               width: mainWidth - 40,
               align: 'justify'
             });
          mainY += estimateTextHeight(cvData.summary, 10, mainWidth - 40) + 20;
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
            doc.fontSize(11).font('Helvetica-Bold')
               .text(exp.title || '', sidebarWidth + 20, mainY);
            mainY += 15;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(`${exp.company || ''}${exp.location ? ' - ' + exp.location : ''}${exp.startDate && exp.endDate ? ' | ' + exp.startDate + ' - ' + exp.endDate : ''}`, 
                     sidebarWidth + 20, mainY)
               .font('Helvetica');
            mainY += 12;
            if (exp.description) {
              doc.fontSize(9).text(exp.description, sidebarWidth + 20, mainY, { 
                width: mainWidth - 40,
                align: 'justify'
              });
              mainY += estimateTextHeight(exp.description, 9, mainWidth - 40) + 10;
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
            doc.fontSize(11).font('Helvetica-Bold')
               .text(edu.degree || '', sidebarWidth + 20, mainY);
            mainY += 15;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(`${edu.institution || ''}${edu.location ? ' - ' + edu.location : ''}${edu.year ? ' | ' + edu.year : ''}${edu.gpa ? ' | ' + getLabel(cvData, 'gpa') + ': ' + edu.gpa : ''}`, 
                     sidebarWidth + 20, mainY)
               .font('Helvetica');
            mainY += 12;
            if (edu.description) {
              doc.fontSize(9).text(edu.description, sidebarWidth + 20, mainY, { 
                width: mainWidth - 40,
                align: 'left'
              });
              mainY += estimateTextHeight(edu.description, 9, mainWidth - 40) + 8;
            }
            mainY += 8;
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
            doc.fontSize(11).font('Helvetica-Bold')
               .text(project.name || '', sidebarWidth + 20, mainY);
            mainY += 15;
            if (project.technologies) {
              doc.fontSize(9).font('Helvetica-Oblique')
                 .text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, sidebarWidth + 20, mainY)
                 .font('Helvetica');
              mainY += 12;
            }
            if (project.description) {
              doc.fontSize(9).font('Helvetica').text(project.description, sidebarWidth + 20, mainY, { 
                width: mainWidth - 40,
                align: 'justify'
              });
              mainY += estimateTextHeight(project.description, 9, mainWidth - 40) + 10;
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
        
        doc.fontSize(28).font('Helvetica-Bold')
           .text(cvData.fullName || '', cvData.profilePhoto ? 170 : 50, y);
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
          doc.fontSize(10).font('Helvetica')
             .text(cvData.summary, 50, y, { width: 500, align: 'justify' });
          y += estimateTextHeight(cvData.summary, 10, 500) + 25;
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
            doc.fontSize(11).font('Helvetica-Bold')
               .text(exp.title || '', col1X, col1Y);
            col1Y += 15;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(`${exp.company || ''}${exp.location ? ' • ' + exp.location : ''}${exp.startDate && exp.endDate ? ' • ' + exp.startDate + ' - ' + exp.endDate : ''}`, 
                     col1X, col1Y, { width: colWidth })
               .font('Helvetica');
            col1Y += 12;
            if (exp.description) {
              doc.fontSize(9).text(exp.description, col1X, col1Y, { width: colWidth, align: 'justify' });
              col1Y += estimateTextHeight(exp.description, 9, colWidth) + 10;
            }
          });
          col1Y += 15;
        }
        
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold')
             .text(getLabel(cvData, 'education'), col1X, col1Y);
          col1Y += 20;
          cvData.education.forEach((edu) => {
            doc.fontSize(11).font('Helvetica-Bold')
               .text(edu.degree || '', col1X, col1Y);
            col1Y += 15;
            doc.fontSize(9).font('Helvetica-Oblique')
               .text(`${edu.institution || ''}${edu.location ? ' • ' + edu.location : ''}${edu.year ? ' • ' + edu.year : ''}${edu.gpa ? ' • ' + getLabel(cvData, 'gpa') + ': ' + edu.gpa : ''}`, 
                     col1X, col1Y, { width: colWidth })
               .font('Helvetica');
            col1Y += 12;
            if (edu.description) {
              doc.fontSize(9).text(edu.description, col1X, col1Y, { width: colWidth, align: 'justify' });
              col1Y += estimateTextHeight(edu.description, 9, colWidth) + 8;
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
            doc.fontSize(11).font('Helvetica-Bold')
               .text(project.name || '', col2X, col2Y);
            col2Y += 15;
            if (project.technologies) {
              doc.fontSize(9).font('Helvetica-Oblique')
                 .text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, col2X, col2Y, { width: colWidth })
                 .font('Helvetica');
              col2Y += 12;
            }
            if (project.description) {
              doc.fontSize(9).font('Helvetica').text(project.description, col2X, col2Y, { width: colWidth, align: 'justify' });
              col2Y += estimateTextHeight(project.description, 9, colWidth) + 10;
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
               .text(`${cert.name || ''}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`, 
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
        doc.fontSize(18).font('Helvetica-Bold')
           .text(cvData.fullName || '', { align: 'center', y: y });
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
          doc.fontSize(8).font('Helvetica')
             .text(cvData.summary, col1X, col1Y, { width: 500, align: 'justify' });
          col1Y += estimateTextHeight(cvData.summary, 8, 500) + 15;
          col2Y = col1Y;
        }
        
        // Column 1: Experience, Education
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'workExperience'), col1X, col1Y);
          col1Y += 12;
          cvData.experience.forEach((exp) => {
            doc.fontSize(9).font('Helvetica-Bold')
               .text(exp.title || '', col1X, col1Y);
            col1Y += 10;
            doc.fontSize(7).font('Helvetica')
               .text(`${exp.company || ''}${exp.startDate && exp.endDate ? ', ' + exp.startDate + '-' + exp.endDate : ''}`, 
                     col1X, col1Y, { width: colWidth });
            col1Y += 9;
            if (exp.description) {
              doc.fontSize(7).text(exp.description, col1X, col1Y, { width: colWidth, align: 'justify' });
              col1Y += estimateTextHeight(exp.description, 7, colWidth) + 8;
            }
          });
          col1Y += 10;
        }
        
        if (cvData.education && cvData.education.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold')
             .text(getLabel(cvData, 'education'), col1X, col1Y);
          col1Y += 12;
          cvData.education.forEach((edu) => {
            doc.fontSize(9).font('Helvetica-Bold')
               .text(edu.degree || '', col1X, col1Y);
            col1Y += 10;
            doc.fontSize(7).font('Helvetica')
               .text(`${edu.institution || ''}${edu.year ? ', ' + edu.year : ''}`, 
                     col1X, col1Y, { width: colWidth });
            col1Y += 10;
            if (edu.description) {
              doc.fontSize(7).text(edu.description, col1X, col1Y, { width: colWidth });
              col1Y += estimateTextHeight(edu.description, 7, colWidth) + 5;
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
            doc.fontSize(9).font('Helvetica-Bold')
               .text(project.name || '', col2X, col2Y);
            col2Y += 10;
            if (project.description) {
              doc.fontSize(7).text(project.description, col2X, col2Y, { width: colWidth, align: 'justify' });
              col2Y += estimateTextHeight(project.description, 7, colWidth) + 8;
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
               .text(`${cert.name || ''}${cert.date ? ' (' + cert.date + ')' : ''}`, 
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
        doc.fontSize(24).font('Helvetica-Bold')
           .text(cvData.fullName || '', { align: 'center', y: y });
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
          doc.fontSize(11).font('Helvetica').text(cvData.summary, { y: y, width: 500, align: 'justify' });
          y += estimateTextHeight(cvData.summary, 11, 500) + 20;
        }

        // Work Experience
        if (cvData.experience && cvData.experience.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'workExperience'), { underline: true, y: y });
          y += 20;
          cvData.experience.forEach((exp, index) => {
            if (index > 0) y += 10;
            doc.fontSize(12).font('Helvetica-Bold').text(exp.title || '', { y: y });
            y += 15;
            doc.fontSize(10).font('Helvetica-Oblique').text(`${exp.company || ''}${exp.location ? ' - ' + exp.location : ''}${exp.startDate && exp.endDate ? ' | ' + exp.startDate + ' - ' + exp.endDate : ''}`, { y: y }).font('Helvetica');
            y += 12;
            if (exp.description) {
              doc.fontSize(10).text(exp.description, { y: y, width: 500, align: 'justify' });
              y += estimateTextHeight(exp.description, 10, 500) + 10;
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
            doc.fontSize(12).font('Helvetica-Bold').text(edu.degree || '', { y: y });
            y += 15;
            doc.fontSize(10).font('Helvetica-Oblique').text(`${edu.institution || ''}${edu.location ? ' - ' + edu.location : ''}${edu.year ? ' | ' + edu.year : ''}`, { y: y }).font('Helvetica');
            y += 12;
            if (edu.gpa) {
              doc.fontSize(10).text(`${getLabel(cvData, 'gpa')}: ${edu.gpa}`, { y: y });
              y += 12;
            }
            if (edu.description) {
              doc.fontSize(10).text(edu.description, { y: y, width: 500, align: 'justify' });
              y += estimateTextHeight(edu.description, 10, 500) + 10;
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
            doc.fontSize(12).font('Helvetica-Bold').text(project.name || '', { y: y });
            y += 15;
            if (project.technologies) {
              doc.fontSize(10).font('Helvetica-Oblique').text(`${getLabel(cvData, 'technologies')}: ${project.technologies}`, { y: y }).font('Helvetica');
              y += 12;
            }
            if (project.description) {
              doc.fontSize(10).font('Helvetica').text(project.description, { y: y, width: 500, align: 'justify' });
              y += estimateTextHeight(project.description, 10, 500) + 10;
            }
          });
          y += 10;
        }

        // Certifications
        if (cvData.certifications && cvData.certifications.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text(getLabel(cvData, 'certifications'), { underline: true, y: y });
          y += 20;
          cvData.certifications.forEach((cert) => {
            doc.fontSize(10).font('Helvetica').text(`${cert.name || ''}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`, { y: y });
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

