const express = require('express');
const router = express.Router();
const path = require('path');

// Ruta principal
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Ruta de fallback para cualquier otra URL
router.get('*', (req, res) => {
  res.redirect('/');
});

module.exports = router;
