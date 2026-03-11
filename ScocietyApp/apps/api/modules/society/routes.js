import { Router } from 'express';
import { societies } from '../../db/schema.js';

const router = Router();

// GET all societies
router.get('/', async (req, res) => {
  try {
    const allSocieties = await societies.findMany();
    res.status(200).json(allSocieties);
  } catch (error) {
    console.error('Error fetching societies:', error);
    res.status(500).json({ error: 'Error fetching societies' });
  }
});

export default router;