'use strict';

const Boom = require('boom');
const { Model, BelongsToOneRelation } = require('objection');
const { DbErrors } = require('objection-db-errors');

module.exports = class extends DbErrors(Model) {
  static get tableName() {
    return 'organization';
  }

  static get relationMappings() {
    return {
      type: {
        modelClass: require('./organization-type'),
        relation: BelongsToOneRelation,
        join: {
          from: 'organization.typeId',
          to: 'organizationType.id'
        }
      },
      createdBy: {
        modelClass: require('./user'),
        relation: BelongsToOneRelation,
        join: {
          from: 'organization.createdById',
          to: 'user.id'
        }
      },
      updatedBy: {
        modelClass: require('./user'),
        relation: BelongsToOneRelation,
        join: {
          from: 'organization.updatedById',
          to: 'user.id'
        }
      }
    };
  }

  static createNotFoundError(queryContext) {
    return Boom.notFound(`Not Found`, { queryContext });
  }

  async $beforeUpdate(queryOptions, context) {
    await super.$beforeUpdate(queryOptions, context);
    this.updatedAt = new Date();
  }
};
