const pdfGenerator = require('../../generators/pdfGenerator');

describe('PDF Generator', () => {
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
        year: '2018'
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

  test('should generate PDF buffer', async () => {
    const buffer = await pdfGenerator.generate(mockCvData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test('should handle missing optional fields', async () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@example.com'
    };
    const buffer = await pdfGenerator.generate(minimalData);
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
    const buffer = await pdfGenerator.generate(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  test('should escape special characters in text', async () => {
    const data = {
      fullName: 'Test & User',
      email: 'test@example.com',
      summary: 'Special chars: <>&"\''
    };
    const buffer = await pdfGenerator.generate(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});

