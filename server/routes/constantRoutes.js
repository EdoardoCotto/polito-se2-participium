"use strict"

const express = require('express');
const router = express.Router();
const categories = require('../constants/reportCategories')

router.get('/categories', (req, res) => {
  res.json(categories);
});

module.exports = router;