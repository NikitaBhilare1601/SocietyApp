import { Router } from 'express';
import { members } from '../../db/schema.js';
import { upload, importCSV } from './csvHandler.js';
import { eq } from 'drizzle-orm';

const router = Router();

// GET all members
router.get('/', async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'];
    
    if (!societyId) {
      return res.status(400).json({ error: 'Society ID is required' });
    }

    const allMembers = await members.findMany({
      where: eq(members.societyId, parseInt(societyId)),
    });

    res.status(200).json(allMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Error fetching members' });
  }
});

// POST bulk create members
router.post('/bulk-create', async (req, res) => {
  try {
    const dataToImport = req.body;

    if (!Array.isArray(dataToImport) || dataToImport.length === 0) {
      return res.status(400).json({ error: 'No data to import' });
    }

    // Insert all records
    for (const row of dataToImport) {
      await members.insert({
        name: row.name,
        societyId: row.societyId,
        societyName: row.societyName,
        wingId: row.wingId,
        wingName: row.wingName,
        flatNumber: row.flatNumber,
        memberType: row.memberType,
        ownerName: row.ownerName,
        vehicleType: row.vehicleType,
        vehicleNumber: row.vehicleNumber,
        gender: row.gender,
        mobileNumber: row.mobileNumber,
        email: row.email,
        idProof: row.idProof,
      });
    }

    res.status(200).json({ message: 'Members imported successfully' });
  } catch (error) {
    console.error('Error importing members:', error);
    res.status(500).json({ error: 'Error importing members' });
  }
});

// POST import from CSV file
router.post('/import-csv', upload.single('file'), importCSV);

export default router;