'use strict';

const Joi = require('joi');
const Pkg = require('../../package');

const internals = {
  schema: {
    plugin: {}
  }
};

exports.plugin = {
  name: `${Pkg.name}/model`,
  version: Pkg.version,
  dependencies: [`${Pkg.name}/db`],
  register: async function (server, opts) {
    const options = Joi.attempt(opts, internals.schema.plugin, `Invalid "${this.name}@${this.version}" plugin options`);
    const models = new Map();
    const connection = server.plugins[`${Pkg.name}/db`].connection;

    models.set('Organization', require('./organization').bindKnex(connection));
    models.set('OrganizationType', require('./organization-type').bindKnex(connection));
    models.set('User', require('./user').bindKnex(connection));

    server.decorate('server', 'models', models);
  }
};
