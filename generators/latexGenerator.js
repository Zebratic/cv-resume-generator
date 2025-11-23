const { getLabel, getProficiencyLabel } = require('../lib/labels');

/**
 * @param {string} text
 * @returns {string}
 */
function escapeLatex(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/\&/g, '\\&')
    .replace(/\#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\_/g, '\\_')
    .replace(/\~/g, '\\textasciitilde{}')
    .replace(/\%/g, '\\%');
}

/**
 * @param {Object} cvData
 * @returns {Buffer}
 */
function generate(cvData) {
  const layout = cvData.layout || 'classic';
  let photoInclude = '';
  
  // Handle profile photo
  if (cvData.profilePhoto) {
    try {
      const base64Data = cvData.profilePhoto.split(',')[1];
      Buffer.from(base64Data, 'base64');
      // For LaTeX, we'll include the image as a data URI won't work
      // Instead, we'll add a placeholder comment
      photoInclude = `% Profile photo available - convert base64 to image file and include with:\\includegraphics[width=3cm]{photo.jpg}\n`;
    } catch (err) {
      console.error('Error processing photo for LaTeX:', err);
    }
  }
  
  let latex = '';
  
  // Sidebar Layout
  if (layout === 'sidebar') {
    latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{tabularx}
\\usepackage{colortbl}
${cvData.profilePhoto ? '\\usepackage{graphicx}' : ''}

% Custom colors
\\definecolor{sidebarcolor}{RGB}{30, 58, 138}
\\definecolor{sidebartext}{RGB}{255, 255, 255}
\\definecolor{sidebaraccent}{RGB}{191, 219, 254}
\\definecolor{primary}{RGB}{102, 126, 234}

% Section formatting
\\titleformat{\\section}
  {\\Large\\bfseries\\color{primary}}
  {}
  {0em}
  {}
  [\\titlerule[0.8pt]]

\\titlespacing*{\\section}{0pt}{1.5em}{1em}

\\begin{document}
\\noindent
\\begin{tabularx}{\\textwidth}{@{}p{0.3\\textwidth}@{}X@{}}
\\cellcolor{sidebarcolor}
\\begin{minipage}[t]{0.3\\textwidth}
\\textcolor{sidebartext}{
${cvData.profilePhoto ? photoInclude + '  % Add photo here: \\includegraphics[width=3cm]{photo.jpg}\\\\[1em]' : ''}
\\centering
{\\Large\\bfseries ${escapeLatex(cvData.fullName || '')}} \\\\[1em]
${cvData.currentJob ? `{\\large ${escapeLatex(cvData.currentJob)}} \\\\[2em]` : ''}
${cvData.email ? `\\textbf{${escapeLatex(getLabel(cvData, 'email'))}:}\\\\[0.5em]${escapeLatex(cvData.email)}\\\\[1em]` : ''}
${cvData.phone ? `\\textbf{${escapeLatex(getLabel(cvData, 'phone'))}:}\\\\[0.5em]${escapeLatex(cvData.phone)}\\\\[1em]` : ''}
${cvData.address ? `\\textbf{${escapeLatex(getLabel(cvData, 'address'))}:}\\\\[0.5em]${escapeLatex(cvData.address)}\\\\[1em]` : ''}
${cvData.linkedin ? `\\textbf{LinkedIn:}\\\\[0.5em]\\href{${escapeLatex(cvData.linkedin)}}{${escapeLatex(cvData.linkedin)}}\\\\[1em]` : ''}
${cvData.website ? `\\textbf{Website:}\\\\[0.5em]\\href{${escapeLatex(cvData.website)}}{${escapeLatex(cvData.website)}}\\\\[2em]` : ''}
${cvData.skills && cvData.skills.length > 0 ? `\\textbf{\\large ${escapeLatex(getLabel(cvData, 'skills'))}}\\\\[1em]${cvData.skills.map(s => escapeLatex(s)).join(', ')}\\\\[2em]` : ''}
${cvData.languages && cvData.languages.length > 0 ? `\\textbf{\\large ${escapeLatex(getLabel(cvData, 'languages'))}}\\\\[1em]${cvData.languages.map(l => escapeLatex(`${l.name} (${getProficiencyLabel(cvData, l.level)})`)).join('\\\\')}` : ''}
}
\\end{minipage}
&
\\begin{minipage}[t]{0.7\\textwidth}
`;
  }
  // Modern Layout
  else if (layout === 'modern') {
    latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{tabularx}
${cvData.profilePhoto ? '\\usepackage{graphicx}' : ''}

% Custom colors
\\definecolor{primary}{RGB}{102, 126, 234}
\\definecolor{graytext}{RGB}{102, 102, 102}

% Section formatting
\\titleformat{\\section}
  {\\Large\\bfseries\\color{primary}}
  {}
  {0em}
  {}
  [\\titlerule[0.8pt]]

\\titlespacing*{\\section}{0pt}{1.5em}{1em}

\\begin{document}

% Header
${cvData.profilePhoto ? photoInclude + '\\begin{minipage}{0.2\\textwidth}\\includegraphics[width=\\textwidth]{photo.jpg}\\end{minipage}\\hfill' : ''}
\\begin{minipage}{${cvData.profilePhoto ? '0.75' : '1'}\\textwidth}
{\\Huge\\bfseries ${escapeLatex(cvData.fullName || '')}} \\\\[0.5em]
${cvData.currentJob ? `{\\Large\\color{graytext}${escapeLatex(cvData.currentJob)}} \\\\[0.5em]` : ''}
\\small
${[
  cvData.email ? `\\href{mailto:${escapeLatex(cvData.email)}}{${escapeLatex(cvData.email)}}` : '',
  cvData.phone ? escapeLatex(cvData.phone) : '',
  cvData.address ? escapeLatex(cvData.address) : '',
  cvData.linkedin ? `\\href{${escapeLatex(cvData.linkedin)}}{LinkedIn}` : '',
  cvData.website ? `\\href{${escapeLatex(cvData.website)}}{Website}` : ''
].filter(Boolean).join(' $\\bullet$ ')}
\\end{minipage}

\\vspace{1.5em}

`;
  }
  // Compact Layout
  else if (layout === 'compact') {
    latex = `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{tabularx}
${cvData.profilePhoto ? '\\usepackage{graphicx}' : ''}

% Custom colors
\\definecolor{primary}{RGB}{102, 126, 234}

% Section formatting
\\titleformat{\\section}
  {\\large\\bfseries\\color{primary}}
  {}
  {0em}
  {}
  [\\titlerule[0.5pt]]

\\titlespacing*{\\section}{0pt}{1em}{0.5em}

\\begin{document}

% Header
\\begin{center}
  {\\Large\\bfseries ${escapeLatex(cvData.fullName || '')}} \\\\[0.3em]
  \\footnotesize
  ${[
    cvData.email ? `\\href{mailto:${escapeLatex(cvData.email)}}{${escapeLatex(cvData.email)}}` : '',
    cvData.phone ? escapeLatex(cvData.phone) : '',
    cvData.address ? escapeLatex(cvData.address) : '',
    cvData.currentJob ? escapeLatex(cvData.currentJob) : '',
    cvData.linkedin ? `\\href{${escapeLatex(cvData.linkedin)}}{LinkedIn}` : '',
    cvData.website ? `\\href{${escapeLatex(cvData.website)}}{Website}` : ''
  ].filter(Boolean).join(' $\\vert$ ')}
\\end{center}

\\vspace{0.5em}

\\begin{tabularx}{\\textwidth}{@{}p{0.48\\textwidth}@{}p{0.48\\textwidth}@{}}
\\begin{minipage}[t]{0.48\\textwidth}
`;
  }
  // Classic Layout (default)
  else {
    latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{hyperref}
${cvData.profilePhoto ? '\\usepackage{graphicx}' : ''}

% Custom colors
\\definecolor{primary}{RGB}{102, 126, 234}
\\definecolor{secondary}{RGB}{118, 75, 162}

% Section formatting
\\titleformat{\\section}
  {\\Large\\bfseries\\color{primary}}
  {}
  {0em}
  {}
  [\\titlerule[0.8pt]]

\\titlespacing*{\\section}{0pt}{1.5em}{1em}

\\begin{document}

% Header
\\begin{center}
  ${cvData.profilePhoto && layout === 'classic' ? photoInclude + '  % Add photo here: \\includegraphics[width=3cm]{photo.jpg}\\\\[1em]' : ''}
  {\\Huge\\bfseries ${escapeLatex(cvData.fullName || '')}} \\\\[0.5em]
  \\small
  ${[
    cvData.email ? `\\href{mailto:${escapeLatex(cvData.email)}}{${escapeLatex(cvData.email)}}` : '',
    cvData.phone ? escapeLatex(cvData.phone) : '',
    cvData.address ? escapeLatex(cvData.address) : '',
    cvData.currentJob ? escapeLatex(cvData.currentJob) : '',
    cvData.linkedin ? `\\href{${escapeLatex(cvData.linkedin)}}{LinkedIn}` : '',
    cvData.website ? `\\href{${escapeLatex(cvData.website)}}{Website}` : ''
  ].filter(Boolean).join(' $\\vert$ ')}
\\end{center}

\\vspace{1em}

`;
  }

  // Content sections - layout-specific
  if (layout === 'sidebar') {
    // Main content area for sidebar
    if (cvData.summary) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'professionalSummary'))}}
${escapeLatex(cvData.summary)}

`;
    }

    if (cvData.experience && cvData.experience.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'workExperience'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.experience.forEach((exp) => {
        latex += `\\item \\textbf{${escapeLatex(exp.title || '')}}`;
        if (exp.company || exp.location || exp.startDate || exp.endDate) {
          latex += ` \\hfill \\textit{`;
          const parts = [];
          if (exp.company) parts.push(escapeLatex(exp.company));
          if (exp.location) parts.push(escapeLatex(exp.location));
          if (exp.startDate && exp.endDate) parts.push(`${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}`);
          latex += parts.join(', ') + '}';
        }
        latex += `\n`;
        if (exp.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(exp.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.education && cvData.education.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'education'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.education.forEach((edu) => {
        latex += `\\item \\textbf{${escapeLatex(edu.degree || '')}}`;
        const parts = [];
        if (edu.institution) parts.push(escapeLatex(edu.institution));
        if (edu.location) parts.push(escapeLatex(edu.location));
        if (edu.year) parts.push(escapeLatex(edu.year));
        if (edu.gpa) parts.push(`${escapeLatex(getLabel(cvData, 'gpa'))}: ${escapeLatex(edu.gpa)}`);
        if (parts.length > 0) {
          latex += ` \\hfill \\textit{${parts.join(', ')}}`;
        }
        latex += `\n`;
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.projects && cvData.projects.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'projects'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.projects.forEach((project) => {
        latex += `\\item \\textbf{${escapeLatex(project.name || '')}}`;
        if (project.technologies) {
          latex += ` \\hfill \\textit{${escapeLatex(getLabel(cvData, 'technologies'))}: ${escapeLatex(project.technologies)}}`;
        }
        latex += `\n`;
        if (project.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(project.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'certifications'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.certifications.forEach((cert) => {
        const parts = [];
        if (cert.name) parts.push(`\\textbf{${escapeLatex(cert.name)}}`);
        if (cert.issuer) parts.push(escapeLatex(cert.issuer));
        if (cert.date) parts.push(`(${escapeLatex(cert.date)})`);
        latex += `\\item ${parts.join(' -- ')}\n`;
      });
      latex += `\\end{itemize}

`;
    }

    latex += `\\end{minipage}
\\end{tabularx}
`;
  }
  else if (layout === 'modern') {
    // Two column layout for modern
    if (cvData.summary) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'professionalSummary'))}}
${escapeLatex(cvData.summary)}

`;
    }

    latex += `\\begin{tabularx}{\\textwidth}{@{}p{0.48\\textwidth}@{}p{0.48\\textwidth}@{}}
\\begin{minipage}[t]{0.48\\textwidth}
`;

    if (cvData.experience && cvData.experience.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'workExperience'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.4em]
`;
      cvData.experience.forEach((exp) => {
        latex += `\\item \\textbf{${escapeLatex(exp.title || '')}}`;
        const parts = [];
        if (exp.company) parts.push(escapeLatex(exp.company));
        if (exp.location) parts.push(escapeLatex(exp.location));
        if (exp.startDate && exp.endDate) parts.push(`${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}`);
        if (parts.length > 0) {
          latex += ` \\\\ \\textit{${parts.join(' $\\bullet$ ')}}`;
        }
        latex += `\n`;
        if (exp.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(exp.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.education && cvData.education.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'education'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.4em]
`;
      cvData.education.forEach((edu) => {
        latex += `\\item \\textbf{${escapeLatex(edu.degree || '')}}`;
        const parts = [];
        if (edu.institution) parts.push(escapeLatex(edu.institution));
        if (edu.location) parts.push(escapeLatex(edu.location));
        if (edu.year) parts.push(escapeLatex(edu.year));
        if (edu.gpa) parts.push(`${escapeLatex(getLabel(cvData, 'gpa'))}: ${escapeLatex(edu.gpa)}`);
        if (parts.length > 0) {
          latex += ` \\\\ \\textit{${parts.join(' $\\bullet$ ')}}`;
        }
        latex += `\n`;
      });
      latex += `\\end{itemize}
`;
    }

    latex += `\\end{minipage}
&
\\begin{minipage}[t]{0.48\\textwidth}
`;

    if (cvData.skills && cvData.skills.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'skills'))}}
${cvData.skills.map(skill => escapeLatex(skill)).join(', ')}

`;
    }

    if (cvData.projects && cvData.projects.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'projects'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.4em]
`;
      cvData.projects.forEach((project) => {
        latex += `\\item \\textbf{${escapeLatex(project.name || '')}}`;
        if (project.technologies) {
          latex += ` \\\\ \\textit{${escapeLatex(getLabel(cvData, 'technologies'))}: ${escapeLatex(project.technologies)}}`;
        }
        latex += `\n`;
        if (project.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(project.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'certifications'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.certifications.forEach((cert) => {
        const parts = [];
        if (cert.name) parts.push(`\\textbf{${escapeLatex(cert.name)}}`);
        if (cert.issuer) parts.push(escapeLatex(cert.issuer));
        if (cert.date) parts.push(`(${escapeLatex(cert.date)})`);
        latex += `\\item ${parts.join(' -- ')}\n`;
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.languages && cvData.languages.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'languages'))}}
${cvData.languages.map(lang => escapeLatex(`${lang.name} (${getProficiencyLabel(cvData, lang.level)})`)).join('\\\\')}
`;
    }

    latex += `\\end{minipage}
\\end{tabularx}
`;
  }
  else if (layout === 'compact') {
    // Left column
    if (cvData.summary) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'professionalSummary'))}}
${escapeLatex(cvData.summary)}

`;
    }

    if (cvData.experience && cvData.experience.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'workExperience'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.experience.forEach((exp) => {
        latex += `\\item \\textbf{${escapeLatex(exp.title || '')}}`;
        const parts = [];
        if (exp.company) parts.push(escapeLatex(exp.company));
        if (exp.startDate && exp.endDate) parts.push(`${escapeLatex(exp.startDate)}-${escapeLatex(exp.endDate)}`);
        if (parts.length > 0) {
          latex += ` \\\\ \\textit{${parts.join(', ')}}`;
        }
        latex += `\n`;
        if (exp.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(exp.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.education && cvData.education.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'education'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.education.forEach((edu) => {
        latex += `\\item \\textbf{${escapeLatex(edu.degree || '')}}`;
        const parts = [];
        if (edu.institution) parts.push(escapeLatex(edu.institution));
        if (edu.year) parts.push(escapeLatex(edu.year));
        if (parts.length > 0) {
          latex += ` \\\\ \\textit{${parts.join(', ')}}`;
        }
        if (edu.description) {
          latex += ` \\\\ ${escapeLatex(edu.description)}`;
        }
        latex += `\n`;
      });
      latex += `\\end{itemize}
`;
    }

    latex += `\\end{minipage}
&
\\begin{minipage}[t]{0.48\\textwidth}
`;

    if (cvData.skills && cvData.skills.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'skills'))}}
${cvData.skills.map(skill => escapeLatex(skill)).join(', ')}

`;
    }

    if (cvData.projects && cvData.projects.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'projects'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.projects.forEach((project) => {
        latex += `\\item \\textbf{${escapeLatex(project.name || '')}}`;
        latex += `\n`;
        if (project.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(project.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'certifications'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.2em]
`;
      cvData.certifications.forEach((cert) => {
        const parts = [];
        if (cert.name) parts.push(`\\textbf{${escapeLatex(cert.name)}}`);
        if (cert.date) parts.push(`(${escapeLatex(cert.date)})`);
        latex += `\\item ${parts.join(' ')}\n`;
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.languages && cvData.languages.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'languages'))}}
${cvData.languages.map(lang => escapeLatex(`${lang.name} (${getProficiencyLabel(cvData, lang.level)})`)).join('\\\\')}
`;
    }

    latex += `\\end{minipage}
\\end{tabularx}
`;
  }
  else {
    // Classic layout
    if (cvData.summary) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'professionalSummary'))}}
${escapeLatex(cvData.summary)}

`;
    }

    if (cvData.experience && cvData.experience.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'workExperience'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.experience.forEach((exp) => {
        latex += `\\item \\textbf{${escapeLatex(exp.title || '')}}`;
        if (exp.company || exp.location || exp.startDate || exp.endDate) {
          latex += ` \\hfill \\textit{`;
          const parts = [];
          if (exp.company) parts.push(escapeLatex(exp.company));
          if (exp.location) parts.push(escapeLatex(exp.location));
          if (exp.startDate && exp.endDate) parts.push(`${escapeLatex(exp.startDate)} -- ${escapeLatex(exp.endDate)}`);
          latex += parts.join(', ') + '}';
        }
        latex += `\n`;
        if (exp.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(exp.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.education && cvData.education.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'education'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.education.forEach((edu) => {
        latex += `\\item \\textbf{${escapeLatex(edu.degree || '')}}`;
        const parts = [];
        if (edu.institution) parts.push(escapeLatex(edu.institution));
        if (edu.location) parts.push(escapeLatex(edu.location));
        if (edu.year) parts.push(escapeLatex(edu.year));
        if (edu.gpa) parts.push(`${escapeLatex(getLabel(cvData, 'gpa'))}: ${escapeLatex(edu.gpa)}`);
        if (parts.length > 0) {
          latex += ` \\hfill \\textit{${parts.join(', ')}}`;
        }
        latex += `\n`;
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.skills && cvData.skills.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'skills'))}}
${cvData.skills.map(skill => escapeLatex(skill)).join(', ')}

`;
    }

    if (cvData.projects && cvData.projects.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'projects'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.5em]
`;
      cvData.projects.forEach((project) => {
        latex += `\\item \\textbf{${escapeLatex(project.name || '')}}`;
        if (project.technologies) {
          latex += ` \\hfill \\textit{${escapeLatex(getLabel(cvData, 'technologies'))}: ${escapeLatex(project.technologies)}}`;
        }
        latex += `\n`;
        if (project.description) {
          latex += `\\begin{itemize}[leftmargin=*]\n\\item ${escapeLatex(project.description)}\n\\end{itemize}\n`;
        }
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'certifications'))}}
\\begin{itemize}[leftmargin=*,itemsep=0.3em]
`;
      cvData.certifications.forEach((cert) => {
        const parts = [];
        if (cert.name) parts.push(`\\textbf{${escapeLatex(cert.name)}}`);
        if (cert.issuer) parts.push(escapeLatex(cert.issuer));
        if (cert.date) parts.push(`(${escapeLatex(cert.date)})`);
        latex += `\\item ${parts.join(' -- ')}\n`;
      });
      latex += `\\end{itemize}

`;
    }

    if (cvData.languages && cvData.languages.length > 0) {
      latex += `\\section{${escapeLatex(getLabel(cvData, 'languages'))}}
${cvData.languages.map(lang => escapeLatex(`${lang.name} (${getProficiencyLabel(cvData, lang.level)})`)).join('\\\\')}

`;
    }
  }

  latex += `\\end{document}
`;

  return Buffer.from(latex, 'utf-8');
}

module.exports = { generate };

