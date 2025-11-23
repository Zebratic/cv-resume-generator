const request = require('supertest');
const express = require('express');
const apiRoutes = require('../../routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {
  const validCvData = {
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

  test('POST /api/generate should return 200 with valid data', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send(validCvData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/zip/);
    expect(response.body).toBeDefined();
    expect(Buffer.isBuffer(response.body) || typeof response.body === 'object').toBe(true);
  }, 10000);

  test('POST /api/generate should return 400 without fullName', async () => {
    const invalidData = { ...validCvData };
    delete invalidData.fullName;

    const response = await request(app)
      .post('/api/generate')
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  test('POST /api/generate should return 400 without email', async () => {
    const invalidData = { ...validCvData };
    delete invalidData.email;

    const response = await request(app)
      .post('/api/generate')
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  test('POST /api/generate should handle minimal data', async () => {
    const minimalData = {
      fullName: 'Jane Doe',
      email: 'jane@example.com'
    };

    const response = await request(app)
      .post('/api/generate')
      .send(minimalData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/zip/);
    expect(response.body).toBeDefined();
  }, 10000);

  test('POST /api/generate should handle empty arrays', async () => {
    const dataWithEmptyArrays = {
      fullName: 'Test User',
      email: 'test@example.com',
      experience: [],
      education: [],
      projects: [],
      certifications: []
    };

    const response = await request(app)
      .post('/api/generate')
      .send(dataWithEmptyArrays)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/zip/);
    expect(response.body).toBeDefined();
  }, 10000);

  test('POST /api/generate/pdf should return PDF', async () => {
    const response = await request(app)
      .post('/api/generate/pdf')
      .send(validCvData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    expect(response.body).toBeDefined();
  }, 10000);

  test('POST /api/generate/docx should return DOCX', async () => {
    const response = await request(app)
      .post('/api/generate/docx')
      .send(validCvData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/wordprocessingml/);
    expect(response.body).toBeDefined();
  }, 10000);

  test('POST /api/generate/latex should return LaTeX', async () => {
    const response = await request(app)
      .post('/api/generate/latex')
      .send(validCvData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.body).toBeDefined();
  }, 10000);
});

