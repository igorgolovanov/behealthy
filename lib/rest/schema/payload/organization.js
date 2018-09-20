'use strict';

const Joi = require('joi');

const TypeIdSchema = require('../id/organization-type');

module.exports = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(1000).allow('').optional(),
  url: Joi.string().max(2048).uri({ scheme: ['http', 'https'] }),
  type: TypeIdSchema
});
