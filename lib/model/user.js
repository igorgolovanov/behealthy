'use strict';

const Boom = require('boom');
const { Model } = require('objection');
const { DbErrors } = require('objection-db-errors');
const Bcrypt = require('bcrypt');
const Hoek = require('hoek');

module.exports = class extends DbErrors(Model) {
  static get tableName() {
    return 'user';
  }

  static createNotFoundError(queryContext) {
    return Boom.notFound(`Not Found`, { queryContext });
  }

  static isBcryptHash(str) {
    return /^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/.test(str);
  }

  async verifyPassword(password) {
    return Bcrypt.compare(password, this.password);
  }

  async $beforeInsert(context) {
    await super.$beforeInsert(context);
    Hoek.assert(!this.constructor.isBcryptHash(this.password), 'already hashed');
    this.password = await Bcrypt.hash(password, 14);
  }

  async $beforeUpdate(queryOptions, context) {
    await super.$beforeUpdate(queryOptions, context);
    this.updatedAt = new Date();

    if (queryOptions.patch && this.password === undefined) {
      return;
    }

    if (this.password) {
      Hoek.assert(!this.constructor.isBcryptHash(this.password), 'already hashed');
      this.password = await Bcrypt.hash(password, 14);
    }
  }
};
