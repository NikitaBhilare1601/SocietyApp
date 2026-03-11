import { Router } from 'express';

const router = Router();

// Define master-related routes here
router.get('/', (req, res) => {
  res.send('Master module works!');
});

export default router;