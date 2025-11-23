const docxGenerator = require('../../generators/docxGenerator');

describe('DOCX Generator', () => {
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

  test('should generate DOCX buffer', async () => {
    const buffer = await docxGenerator.generate(mockCvData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should handle missing optional fields', async () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@example.com'
    };
    const buffer = await docxGenerator.generate(minimalData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should handle empty arrays', async () => {
    const data = {
      fullName: 'Test User',
      email: 'test@example.com',
      experience: [],
      education: [],
      projects: [],
      certifications: []
    };
    const buffer = await docxGenerator.generate(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('should handle multiple entries in sections', async () => {
    const data = {
      fullName: 'Test User',
      email: 'test@example.com',
      experience: [
        { title: 'Job 1', company: 'Company 1' },
        { title: 'Job 2', company: 'Company 2' }
      ],
      education: [
        { degree: 'Degree 1', institution: 'School 1' },
        { degree: 'Degree 2', institution: 'School 2' }
      ]
    };
    const buffer = await docxGenerator.generate(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});

