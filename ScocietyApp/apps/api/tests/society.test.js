import request from 'supertest';
import app from '../index';

describe('Society Management API Tests', () => {
  it('should fetch societies', async () => {
    const response = await request(app).get('/api/society');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should add a new society', async () => {
    const newSociety = {
      name: 'Test Society',
      numberOfWings: 2,
    };
    const response = await request(app).post('/api/society').send(newSociety);
    expect(response.status).toBe(201);
    expect(response.body.name).toBe(newSociety.name);
  });

  it('should return 404 for invalid route', async () => {
    const response = await request(app).get('/api/invalid');
    expect(response.status).toBe(404);
  });
});