'use strict';

const Joi = require('joi');

module.exports = Joi.object({
  username: Joi.string(),
  password: Joi.string()
});
