const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

router.get('/', resultController.getResults);
router.post('/', resultController.addResult);
router.put('/:resultId', resultController.updateResult);
router.delete('/:resultId', resultController.deleteResult);

module.exports = router;

