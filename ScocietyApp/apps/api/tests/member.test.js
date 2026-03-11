import request from 'supertest';
import app from '../index';

describe('Member Management API Tests', () => {
  it('should fetch members', async () => {
    const response = await request(app).get('/api/member');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should add a new member', async () => {
    const newMember = {
      societyId: 1,
      wingId: 1,
      flatNumber: '103',
      memberType: 'Owner',
      gender: 'Male',
      mobileNumber: '9876543212',
      email: 'owner3@example.com',
    };
    const response = await request(app).post('/api/member').send(newMember);
    expect(response.status).toBe(201);
    expect(response.body.flatNumber).toBe(newMember.flatNumber);
  });

  it('should return 400 for invalid member data', async () => {
    const invalidMember = {
      societyId: 1,
      wingId: 1,
      flatNumber: '',
    };
    const response = await request(app).post('/api/member').send(invalidMember);
    expect(response.status).toBe(400);
  });
});