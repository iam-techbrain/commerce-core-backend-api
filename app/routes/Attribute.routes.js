const express = require('express');
const AttributeController = require('../controllers/Attribute.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

// 1. Get all attributes with their values (Public/Admin)
router.get('/', AttributeController.getAll);

// 2. Create a new master attribute (Protected Admin)
router.post('/', verifyToken, AttributeController.createAttribute);

// 3. Add a value to an attribute (Protected Admin)
router.post('/:id/values', verifyToken, AttributeController.addValue);

// 4. Delete an attribute value (Protected Admin)
router.delete('/values/:valueId', verifyToken, AttributeController.deleteValue);

// 5. Delete an attribute (Protected Admin)
router.delete('/:id', verifyToken, AttributeController.deleteAttribute);

module.exports = router;
