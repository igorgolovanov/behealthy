'use strict';

const Joi = require('joi');

module.exports = Joi.array()
  .items(Joi.string().regex(/([a-z0-9]+)([.]([a-z0-9]+))?/i, { name: 'orderBy' }))
  .single()
  .default([])
  .label('Order By');
