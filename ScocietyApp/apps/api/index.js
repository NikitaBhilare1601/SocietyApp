import express from 'express';

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Society Module Routes
app.use('/api/society', require('./modules/society/routes'));

// Member Module Routes
app.use('/api/member', require('./modules/member/routes'));

// Master Module Routes
app.use('/api/master', require('./modules/master/routes'));

// Default Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});