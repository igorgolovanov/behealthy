'use strict';

const Joi = require('joi');

module.exports = Joi
  .number()
  .integer()
  .positive()
  .default(1)
  .label('Page Number')
  .description('the index of the page of results');
