'use strict';

const Joi = require('joi');
const Pkg = require('../package');

const internals = {
  schema: {
    plugin: {
      jwtSecretKey: Joi.string().required(),
      db: Joi.object().options({ allowUnknown: true }).required()
    }
  }
};


exports.plugin = {
  pkg: Pkg,
  register: async function (server, opts) {
    const options = Joi.attempt(opts, internals.schema.plugin, `Invalid "${this.name}@${this.version}" plugin options`);

    server.event({ name: 'organization', tags: true });

    await server.register({ plugin: require('./db'), options: options.db });
    await server.register({ plugin: require('./model') });
    await server.register({ plugin: require('./auth'), options: { jwtSecretKey: options.jwtSecretKey } });
    await server.register({ plugin: require('./rest'), routes: { prefix: '/api' } });

    server.events.on('start', () => server.log(['info'], `Server started and running on ${server.info.uri}`));
    server.events.on('stop', () => server.log(['info'], `Server stopped`));
  },
};
