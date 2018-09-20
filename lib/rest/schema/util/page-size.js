'use strict';

const Joi = require('joi');

module.exports = Joi.number()
  .integer()
  .min(1)
  .max(200)
  .default(10)
  .label('Page Size')
  .description('the maximum number of items that can be returned per page');
