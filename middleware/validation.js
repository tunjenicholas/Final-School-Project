const { body, validationResult } = require('express-validator');

exports.validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.addResultValidation = [
  body('studentClassId').isInt().withMessage('Student class ID must be an integer'),
  body('subjectId').isInt().withMessage('Subject ID must be an integer'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be a number between 0 and 100'),
  body('grade').isString().isLength({ min: 1, max: 2 }).withMessage('Grade must be a string with 1 or 2 characters'),
  body('term').isIn(['First', 'Second', 'Third']).withMessage('Term must be First, Second, or Third'),
];

exports.updateResultValidation = [
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be a number between 0 and 100'),
  body('grade').isString().isLength({ min: 1, max: 2 }).withMessage('Grade must be a string with 1 or 2 characters'),
];