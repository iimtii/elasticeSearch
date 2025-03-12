const express = require('express');
const app = express();
const elasticRoutes = require('./routes/elasticRoutes');

app.use(express.json());
app.use('/api', elasticRoutes);

module.exports = app;
