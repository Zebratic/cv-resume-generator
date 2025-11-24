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

  test('POST /api/generate/pdf should return PDF', async () => {
    const response = await request(app)
      .post('/api/generate/pdf')
      .send(validCvData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/pdf/);
    expect(response.body).toBeDefined();
  }, 10000);
});

