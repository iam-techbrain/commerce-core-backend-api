const express = require('express');
const LookupController = require('../controllers/Lookup.controller');
const verifyToken = require('../middleware/Auth.middleware');

const router = express.Router();

router.get('/', LookupController.getAll);
router.post('/', verifyToken, LookupController.create);
router.put('/:id', verifyToken, LookupController.update);
router.delete('/:id', verifyToken, LookupController.delete);

module.exports = router;
