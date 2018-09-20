'use strict';

const Boom = require('boom');
const { Model } = require('objection');
const { DbErrors } = require('objection-db-errors');

module.exports = class extends DbErrors(Model) {
  static get tableName() {
    return 'organizationType';
  }

  static createNotFoundError(queryContext) {
    return Boom.notFound(`Not Found`, { queryContext });
  }

  async $beforeUpdate(queryOptions, context) {
    await super.$beforeUpdate(queryOptions, context);
    this.updatedAt = new Date();
  }
};
