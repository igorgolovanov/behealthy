'use strict';

const Joi = require('joi');
const Hoek = require('hoek');
const JWT = require('jsonwebtoken');

const Pkg = require('../package');

const internals = {
  schema: {
    plugin: {
      jwtSecretKey: Joi.string().required()
    },
    sign: Joi.object({
      algorithm: Joi.string(),
      expiresIn: Joi.alternatives().try([Joi.string(), Joi.number()]),
      notBefore: Joi.alternatives().try([Joi.string(), Joi.number()]),
      audience: Joi.string(),
      issuer: Joi.string(),
      jwtid: Joi.string(),
      subject: Joi.string(),
      noTimestamp: Joi.boolean(),
      header: Joi.string(),
      keyid: Joi.string(),
      mutatePayload: Joi.boolean(),
    })
  },
  defaults: {
    sign: {
      algorithm: 'HS256'
    }
  }
};

internals.sign = async function (payload, options = {}) {
  const results = Joi.validate(options, internals.schema.sign, { presence: 'optional' });
  Hoek.assert(!results.error, results.error);
  const opts = Hoek.applyToDefaults(internals.defaults.sign, results.value);

  return new Promise((resolve, reject) => {
    JWT.sign(payload, this.jwtSecretKey, opts, (err, token) => {
      if (err) {
        return reject(err);
      }
      return resolve(token);
    });
  });
};

internals.validate = async function (decoded, request) {
  return {
    isValid: !!decoded.id,
    credentials: {
      user: {
        id: decoded.id
      },
      scope: decoded.scope
    }
  };
};


exports.plugin = {
  name: `${Pkg.name}/auth`,
  version: Pkg.version,
  register: async function (server, opts) {
    const options = Joi.attempt(opts, internals.schema.plugin, `Invalid "${this.name}@${this.version}" plugin options`);
    await server.register(require('hapi-auth-jwt2'), { once: true });

    server.auth.strategy('jwt', 'jwt', {
      validate: internals.validate,
      key: options.jwtSecretKey,
      verifyOptions: { algorithms: ['HS256'] }
    });
    server.auth.default('jwt');

    server.method('jwtSign', internals.sign, { bind: { jwtSecretKey: options.jwtSecretKey } });
  }
};
