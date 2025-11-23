const latexGenerator = require('../../generators/latexGenerator');

describe('LaTeX Generator', () => {
  const mockCvData = {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    currentJob: 'Software Engineer',
    summary: 'Experienced developer',
    experience: [
      {
        title: 'Senior Developer',
        company: 'Tech Corp',
        location: 'San Francisco',
        startDate: '2020',
        endDate: 'Present',
        description: 'Led development team'
      }
    ],
    education: [
      {
        degree: 'BS Computer Science',
        institution: 'University',
        location: 'City',
        year: '2018',
        gpa: '3.8'
      }
    ],
    skills: ['JavaScript', 'Python'],
    projects: [
      {
        name: 'Project 1',
        technologies: 'React, Node.js',
        description: 'A great project'
      }
    ],
    certifications: [
      {
        name: 'AWS Certified',
        issuer: 'Amazon',
        date: '2023'
      }
    ],
    languages: ['English', 'Spanish']
  };

  test('should generate LaTeX buffer', () => {
    const buffer = latexGenerator.generate(mockCvData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should contain valid LaTeX structure', () => {
    const buffer = latexGenerator.generate(mockCvData);
    const latex = buffer.toString('utf-8');
    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');
  });

  test('should escape special LaTeX characters', () => {
    const data = {
      fullName: 'Test & User',
      email: 'test@example.com',
      summary: 'Special: $ % # _ { } \\'
    };
    const buffer = latexGenerator.generate(data);
    const latex = buffer.toString('utf-8');
    expect(latex).toContain('\\&');
    expect(latex).toContain('\\$');
    expect(latex).toContain('\\%');
    expect(latex).toContain('\\#');
    expect(latex).toContain('\\_');
  });

  test('should handle missing optional fields', () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@example.com'
    };
    const buffer = latexGenerator.generate(minimalData);
    expect(buffer).toBeInstanceOf(Buffer);
    const latex = buffer.toString('utf-8');
    expect(latex).toContain('Jane Doe');
    expect(latex).toContain('jane@example.com');
  });

  test('should handle empty arrays', () => {
    const data = {
      fullName: 'Test User',
      email: 'test@example.com',
      experience: [],
      education: [],
      projects: [],
      certifications: []
    };
    const buffer = latexGenerator.generate(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('should include all sections when present', () => {
    const buffer = latexGenerator.generate(mockCvData);
    const latex = buffer.toString('utf-8');
    expect(latex).toContain('Professional Summary');
    expect(latex).toContain('Work Experience');
    expect(latex).toContain('Education');
    expect(latex).toContain('Skills');
    expect(latex).toContain('Projects');
    expect(latex).toContain('Certifications');
    expect(latex).toContain('Languages');
  });
});

