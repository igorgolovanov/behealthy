'use strict';

const Joi = require('joi');
const Knex = require('knex');
const Hoek = require('hoek');
const { knexSnakeCaseMappers } = require('objection');

const Pkg = require('../package');

const internals = {
  schema: {
    plugin: {
      client: Joi.string().required(),
      connection: Joi.object().required(),
      pool: Joi.object({
        min: Joi.number().integer(),
        max: Joi.number().integer(),
        acquireTimeoutMillis: Joi.number().integer(),
        createTimeoutMillis: Joi.number().integer(),
        idleTimeoutMillis: Joi.number().integer(),
        reapIntervalMillis: Joi.number().integer(),
        createRetryIntervalMillis: Joi.number().integer(),
        propagateCreateError: Joi.boolean()
      }),
      migrations: Joi.object(),
      postProcessResponse: Joi.func(),
      wrapIdentifier: Joi.func(),
      acquireConnectionTimeout: Joi.number().integer(),
      useNullAsDefault: Joi.boolean(),
      snakeCaseMapping: Joi.boolean()
    }
  }
};

internals.typeCastMySql = (field, next) => {
  switch (field.type) {
    case 'TINY':
      // convert TINYINT(1) -> Boolean
      if (field.length === 1) {
        return field.string() === '1';
      }
      break;
  }
  return next();
};

internals.snakeCaseMapping = (options) => {
  let postProcessResponse;
  let wrapIdentifier;

  const { postProcessResponse: knexPostProcessResponse, wrapIdentifier: knexWrapIdentifier } = knexSnakeCaseMappers();

  if (options.postProcessResponse) {
    const postProcessResponseCustom = options.postProcessResponse;
    postProcessResponse = (result, queryContext) => postProcessResponseCustom(knexPostProcessResponse(result, queryContext), queryContext);
  } else {
    postProcessResponse = knexPostProcessResponse;
  }
  if (options.wrapIdentifier) {
    const wrapIdentifierCustom = options.wrapIdentifier;
    wrapIdentifier = (value, origImpl, queryContext) => wrapIdentifierCustom(value, (v) => knexWrapIdentifier(v, origImpl, queryContext), queryContext);
  } else {
    wrapIdentifier = knexWrapIdentifier;
  }
  return {
    postProcessResponse,
    wrapIdentifier
  };
};

exports.plugin = {
  name: `${Pkg.name}/db`,
  version: Pkg.version,
  register: async function (server, opts) {
    const options = Joi.attempt(opts, internals.schema.plugin, `Invalid "${this.name}@${this.version}" plugin options`);
    const knexOpts = Hoek.cloneWithShallow(options, [
      'client', 'pool', 'connection', 'wrapIdentifier', 'postProcessResponse', 'migrations'
    ]);

    Object.entries(knexOpts.connection).forEach(([k, v]) => {
      if (v === null || v === undefined) {
        delete knexOpts.connection[k];
      }
    });

    if (['mysql2', 'mysql'].includes(knexOpts.client)) {
      knexOpts.connection.timezone = knexOpts.connection.timezone || 'UTC';
      if (knexOpts.connection.typeCast || knexOpts.connection.typeCast === undefined) {
        knexOpts.connection.typeCast = internals.typeCastMySql;
      }
    }

    if (options.snakeCaseMapping) {
      const { postProcessResponse, wrapIdentifier } = internals.snakeCaseMapping(options);

      knexOpts.postProcessResponse = postProcessResponse;
      knexOpts.wrapIdentifier = wrapIdentifier;
    }

    const knex = new Knex(knexOpts);

    if (knexOpts.migrations && knexOpts.migrations.auto) {
      server.ext({
        type: 'onPreStart',
        method: async () => {
          await knex.migrate.latest();
          server.log(['db', 'migration', 'info'], 'Database successful migrated to the latest version');
        }
      });
    }

    // ping
    try {
      await knex.raw('/* ping */ SELECT 1');
    } catch (err) {
      server.log(['db', 'error'], err.sqlMessage || err.message);
      throw new Error(`Database error: ${err.sqlMessage || err.message}`);
    }
    server.expose('connection', knex);
  }
};
