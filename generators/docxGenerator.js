const docx = require('docx');
const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = docx;
const { getLabel, getProficiencyLabel } = require('../lib/labels');

/**
 * @param {Object} cvData
 * @returns {Promise<Buffer>}
 */
function generate(cvData) {
  const layout = cvData.layout || 'classic';
  const children = [];

  // Sidebar Layout
  if (layout === 'sidebar') {
    const sidebarCells = [];
    const mainCells = [];

    // Sidebar content
    if (cvData.profilePhoto) {
      sidebarCells.push(
        new Paragraph({
          text: '[Profile Photo]',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );
    }
    
    sidebarCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.fullName || '',
            bold: true,
            size: 32,
            color: 'FFFFFF'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    if (cvData.currentJob) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.currentJob,
              size: 20,
              color: 'BFDBFE'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.email) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${getLabel(cvData, 'email')}:`, bold: true, size: 20, color: 'FFFFFF' })
          ],
          spacing: { after: 100 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.email, size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 200 }
        })
      );
    }

    if (cvData.phone) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${getLabel(cvData, 'phone')}:`, bold: true, size: 20, color: 'FFFFFF' })
          ],
          spacing: { after: 100 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.phone, size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 200 }
        })
      );
    }

    if (cvData.address) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${getLabel(cvData, 'address')}:`, bold: true, size: 20, color: 'FFFFFF' })
          ],
          spacing: { after: 100 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.address, size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 200 }
        })
      );
    }

    if (cvData.linkedin) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'LinkedIn:', bold: true, size: 20, color: 'FFFFFF' })
          ],
          spacing: { after: 100 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.linkedin, size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 200 }
        })
      );
    }

    if (cvData.website) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Website:', bold: true, size: 20, color: 'FFFFFF' })
          ],
          spacing: { after: 100 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.website, size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.skills && cvData.skills.length > 0) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'skills'), bold: true, size: 24, color: 'FFFFFF' })
          ],
          spacing: { after: 200 }
        })
      );
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: cvData.skills.join(', '), size: 18, color: 'E0E7FF' })
          ],
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.languages && cvData.languages.length > 0) {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'languages'), bold: true, size: 24, color: 'FFFFFF' })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.languages.forEach((l) => {
        sidebarCells.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${l.name} (${getProficiencyLabel(cvData, l.level)})`, size: 18, color: 'E0E7FF' })
            ],
            spacing: { after: 100 }
          })
        );
      });
    }

    // Main content
    if (cvData.summary) {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'professionalSummary'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      mainCells.push(
        new Paragraph({
          text: cvData.summary,
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.experience && cvData.experience.length > 0) {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'workExperience'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.experience.forEach((exp) => {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.title || '', bold: true, size: 24 })
            ],
            spacing: { after: 100 }
          })
        );
        const expText = [
          exp.company || '',
          exp.location || '',
          exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''
        ].filter(Boolean).join(' | ');
        if (expText) {
          mainCells.push(
            new Paragraph({
              text: expText,
              spacing: { after: 100 }
            })
          );
        }
        if (exp.description) {
          mainCells.push(
            new Paragraph({
              text: exp.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.education && cvData.education.length > 0) {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'education'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.education.forEach((edu) => {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree || '', bold: true, size: 24 })
            ],
            spacing: { after: 100 }
          })
        );
        const eduText = [
          edu.institution || '',
          edu.location || '',
          edu.year || '',
          edu.gpa ? `${getLabel(cvData, 'gpa')}: ${edu.gpa}` : ''
        ].filter(Boolean).join(' | ');
        if (eduText) {
          mainCells.push(
            new Paragraph({
              text: eduText,
              spacing: { after: 100 }
            })
          );
        }
        if (edu.description) {
          mainCells.push(
            new Paragraph({
              text: edu.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.projects && cvData.projects.length > 0) {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'projects'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.projects.forEach((project) => {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name || '', bold: true, size: 24 })
            ],
            spacing: { after: 100 }
          })
        );
        if (project.technologies) {
          mainCells.push(
            new Paragraph({
              text: `${getLabel(cvData, 'technologies')}: ${project.technologies}`,
              spacing: { after: 100 }
            })
          );
        }
        if (project.description) {
          mainCells.push(
            new Paragraph({
              text: project.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'certifications'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.certifications.forEach((cert) => {
        mainCells.push(
          new Paragraph({
            text: `${cert.name || ''}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`,
            spacing: { after: 100 }
          })
        );
      });
    }

    children.push(
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: sidebarCells,
                shading: { fill: '1e3a8a' },
                width: { size: 30, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: mainCells,
                width: { size: 70, type: WidthType.PERCENTAGE }
              })
            ]
          })
        ]
      })
    );
  }
  // Modern Layout
  else if (layout === 'modern') {
    // Header with photo placeholder
    if (cvData.profilePhoto) {
      children.push(
        new Paragraph({
          text: '[Profile Photo]',
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 }
        })
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.fullName || '',
            bold: true,
            size: 48
          })
        ],
        spacing: { after: 200 }
      })
    );

    if (cvData.currentJob) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cvData.currentJob,
              size: 28,
              color: '666666'
            })
          ],
          spacing: { after: 200 }
        })
      );
    }

    const contactParts = [cvData.email, cvData.phone, cvData.address, cvData.linkedin, cvData.website].filter(Boolean);
    children.push(
      new Paragraph({
        text: contactParts.join('  •  '),
        spacing: { after: 400 }
      })
    );

    if (cvData.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'professionalSummary'), bold: true, size: 32 })
          ],
          spacing: { after: 200 }
        })
      );
      children.push(
        new Paragraph({
          text: cvData.summary,
          spacing: { after: 400 }
        })
      );
    }

    // Two column table for modern layout
    const leftCol = [];
    const rightCol = [];

    if (cvData.experience && cvData.experience.length > 0) {
      leftCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'workExperience'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.experience.forEach((exp) => {
        leftCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.title || '', bold: true, size: 22 })
            ],
            spacing: { after: 100 }
          })
        );
        const expText = [
          exp.company || '',
          exp.location || '',
          exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''
        ].filter(Boolean).join(' • ');
        leftCol.push(
          new Paragraph({
            text: expText,
            spacing: { after: 100 }
          })
        );
        if (exp.description) {
          leftCol.push(
            new Paragraph({
              text: exp.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.education && cvData.education.length > 0) {
      leftCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'education'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.education.forEach((edu) => {
        leftCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree || '', bold: true, size: 22 })
            ],
            spacing: { after: 100 }
          })
        );
        const eduText = [
          edu.institution || '',
          edu.location || '',
          edu.year || '',
          edu.gpa ? `${getLabel(cvData, 'gpa')}: ${edu.gpa}` : ''
        ].filter(Boolean).join(' • ');
        leftCol.push(
          new Paragraph({
            text: eduText,
            spacing: { after: 100 }
          })
        );
        if (edu.description) {
          leftCol.push(
            new Paragraph({
              text: edu.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.skills && cvData.skills.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'skills'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      rightCol.push(
        new Paragraph({
          text: cvData.skills.join(', '),
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.projects && cvData.projects.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'projects'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.projects.forEach((project) => {
        rightCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name || '', bold: true, size: 22 })
            ],
            spacing: { after: 100 }
          })
        );
        if (project.technologies) {
          rightCol.push(
            new Paragraph({
              text: `${getLabel(cvData, 'technologies')}: ${project.technologies}`,
              spacing: { after: 100 }
            })
          );
        }
        if (project.description) {
          rightCol.push(
            new Paragraph({
              text: project.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'certifications'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.certifications.forEach((cert) => {
        rightCol.push(
          new Paragraph({
            text: `${cert.name || ''}${cert.issuer ? ' - ' + cert.issuer : ''}${cert.date ? ' (' + cert.date + ')' : ''}`,
            spacing: { after: 100 }
          })
        );
      });
    }

    if (cvData.languages && cvData.languages.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: getLabel(cvData, 'languages'), bold: true, size: 28 })
          ],
          spacing: { after: 200 }
        })
      );
      cvData.languages.forEach((l) => {
        rightCol.push(
          new Paragraph({
            text: `${l.name} (${getProficiencyLabel(cvData, l.level)})`,
            spacing: { after: 100 }
          })
        );
      });
    }

    children.push(
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: leftCol,
                width: { size: 50, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: rightCol,
                width: { size: 50, type: WidthType.PERCENTAGE }
              })
            ]
          })
        ]
      })
    );
  }
  // Compact Layout
  else if (layout === 'compact') {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.fullName || '',
            bold: true,
            size: 36
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    const contactInfo = [
      cvData.email,
      cvData.phone,
      cvData.address,
      cvData.currentJob
    ].filter(Boolean).join(' | ');

    children.push(
      new Paragraph({
        text: contactInfo,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({ text: contactInfo, size: 16 })
        ]
      })
    );

    if (cvData.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Professional Summary', bold: true, size: 20 })
          ],
          spacing: { after: 200 }
        })
      );
      children.push(
        new Paragraph({
          text: cvData.summary,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: cvData.summary, size: 16 })
          ]
        })
      );
    }

    const leftCol = [];
    const rightCol = [];

    if (cvData.experience && cvData.experience.length > 0) {
      leftCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Experience', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      cvData.experience.forEach((exp) => {
        leftCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.title || '', bold: true, size: 18 })
            ],
            spacing: { after: 80 }
          })
        );
        leftCol.push(
          new Paragraph({
            text: `${exp.company || ''}${exp.startDate && exp.endDate ? ', ' + exp.startDate + '-' + exp.endDate : ''}`,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${exp.company || ''}${exp.startDate && exp.endDate ? ', ' + exp.startDate + '-' + exp.endDate : ''}`, size: 14 })
            ]
          })
        );
        if (exp.description) {
          leftCol.push(
            new Paragraph({
              text: exp.description,
              spacing: { after: 150 },
              children: [
                new TextRun({ text: exp.description, size: 14 })
              ]
            })
          );
        }
      });
    }

    if (cvData.education && cvData.education.length > 0) {
      leftCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Education', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      cvData.education.forEach((edu) => {
        leftCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree || '', bold: true, size: 18 })
            ],
            spacing: { after: 80 }
          })
        );
        leftCol.push(
          new Paragraph({
            text: `${edu.institution || ''}${edu.year ? ', ' + edu.year : ''}`,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `${edu.institution || ''}${edu.year ? ', ' + edu.year : ''}`, size: 14 })
            ]
          })
        );
        if (edu.description) {
          rightCol.push(
            new Paragraph({
              text: edu.description,
              spacing: { after: 150 }
            })
          );
        }
      });
    }

    if (cvData.skills && cvData.skills.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Skills', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      rightCol.push(
        new Paragraph({
          text: cvData.skills.join(', '),
          spacing: { after: 300 },
          children: [
            new TextRun({ text: cvData.skills.join(', '), size: 14 })
          ]
        })
      );
    }

    if (cvData.projects && cvData.projects.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Projects', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      cvData.projects.forEach((project) => {
        rightCol.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name || '', bold: true, size: 18 })
            ],
            spacing: { after: 80 }
          })
        );
        if (project.description) {
          rightCol.push(
            new Paragraph({
              text: project.description,
              spacing: { after: 150 },
              children: [
                new TextRun({ text: project.description, size: 14 })
              ]
            })
          );
        }
      });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Certifications', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      cvData.certifications.forEach((cert) => {
        rightCol.push(
          new Paragraph({
            text: `${cert.name || ''}${cert.date ? ' (' + cert.date + ')' : ''}`,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `${cert.name || ''}${cert.date ? ' (' + cert.date + ')' : ''}`, size: 14 })
            ]
          })
        );
      });
    }

    if (cvData.languages && cvData.languages.length > 0) {
      rightCol.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Languages', bold: true, size: 20 })
          ],
          spacing: { after: 150 }
        })
      );
      cvData.languages.forEach((l) => {
        const langText = typeof l === 'string' ? l : `${l.name} (${getProficiencyLabel(cvData, l.level)})`;
        rightCol.push(
          new Paragraph({
            text: langText,
            children: [
              new TextRun({ text: langText, size: 14 })
            ],
            spacing: { after: 100 }
          })
        );
      });
    }

    children.push(
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: leftCol,
                width: { size: 50, type: WidthType.PERCENTAGE }
              }),
              new TableCell({
                children: rightCol,
                width: { size: 50, type: WidthType.PERCENTAGE }
              })
            ]
          })
        ]
      })
    );
  }
  // Classic Layout (default)
  else {
    if (cvData.profilePhoto) {
      children.push(
        new Paragraph({
          text: '[Profile Photo]',
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );
    }

    children.push(
      new Paragraph({
        text: cvData.fullName || '',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    const contactInfo = [
      cvData.email,
      cvData.phone,
      cvData.address,
      cvData.currentJob
    ].filter(Boolean).join(' | ');

    children.push(
      new Paragraph({
        text: contactInfo,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    if (cvData.summary) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'professionalSummary'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );
      children.push(
        new Paragraph({
          text: cvData.summary,
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.experience && cvData.experience.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'workExperience'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      cvData.experience.forEach((exp) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.title || '',
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 100 }
          })
        );

        const expText = [
          exp.company || '',
          exp.location || '',
          exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : ''
        ].filter(Boolean).join(' | ');

        if (expText) {
          children.push(
            new Paragraph({
              text: expText,
              spacing: { after: 100 }
            })
          );
        }

        if (exp.description) {
          children.push(
            new Paragraph({
              text: exp.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.education && cvData.education.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'education'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      cvData.education.forEach((edu) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree || '',
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 100 }
          })
        );

        const eduText = [
          edu.institution || '',
          edu.location || '',
          edu.year || '',
          edu.gpa ? `${getLabel(cvData, 'gpa')}: ${edu.gpa}` : ''
        ].filter(Boolean).join(' | ');

        if (eduText) {
          children.push(
            new Paragraph({
              text: eduText,
              spacing: { after: 100 }
            })
          );
        }
        if (edu.description) {
          children.push(
            new Paragraph({
              text: edu.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.skills && cvData.skills.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'skills'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );
      children.push(
        new Paragraph({
          text: cvData.skills.join(', '),
          spacing: { after: 400 }
        })
      );
    }

    if (cvData.projects && cvData.projects.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'projects'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      cvData.projects.forEach((project) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.name || '',
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 100 }
          })
        );

        if (project.technologies) {
          children.push(
            new Paragraph({
              text: `${getLabel(cvData, 'technologies')}: ${project.technologies}`,
              spacing: { after: 100 }
            })
          );
        }

        if (project.description) {
          children.push(
            new Paragraph({
              text: project.description,
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    if (cvData.certifications && cvData.certifications.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'certifications'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );

      cvData.certifications.forEach((cert) => {
        const certText = [
          cert.name || '',
          cert.issuer || '',
          cert.date || ''
        ].filter(Boolean).join(' - ');

        children.push(
          new Paragraph({
            text: certText,
            spacing: { after: 100 }
          })
        );
      });
    }

    if (cvData.languages && cvData.languages.length > 0) {
      children.push(
        new Paragraph({
          text: getLabel(cvData, 'languages'),
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 }
        })
      );
      cvData.languages.forEach((l) => {
        children.push(
          new Paragraph({
            text: `${l.name} (${getProficiencyLabel(cvData, l.level)})`,
            spacing: { after: 100 }
          })
        );
      });
    }
  }

  const doc = new DocxDocument({
    sections: [{
      children: children
    }]
  });

  return Packer.toBuffer(doc);
}

module.exports = { generate };

