'use strict';

const Bcrypt = require('bcrypt');

exports.up = async (db) => {
  await db.schema.createTable('user', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('password', 60).notNullable();
    table.enum('role', ['user', 'viewer', 'editor']).notNullable().defaultTo('user');
    table.timestamps(true, true);
  });
  await db.schema.alterTable('organization', (table) => {
    table.integer('created_by_id').unsigned().notNullable();
    table.foreign('created_by_id').references('id').inTable('user').onDelete('RESTRICT').onUpdate('CASCADE');
    table.integer('updated_by_id').unsigned().nullable();
    table.foreign('updated_by_id').references('id').inTable('user').onDelete('SET NULL').onUpdate('CASCADE');
  });
  await db.insert([
    { username: 'user1', password: await Bcrypt.hash('user1', 14) },
    { username: 'user2', password: await Bcrypt.hash('user2', 14) },
    { username: 'user3', password: await Bcrypt.hash('user3', 14) },
    { username: 'onlyview1', password: await Bcrypt.hash('onlyview1', 14), role: 'viewer' },
    { username: 'onlyview2', password: await Bcrypt.hash('onlyview2', 14), role: 'viewer' },
    { username: 'superedit', password: await Bcrypt.hash('superedit', 14), role: 'editor' },
  ]).into('user');
};

exports.down = async (db) => {
  await db.schema.alterTable('organization', (table) => {
    table.dropForeign('created_by_id');
    table.dropForeign('updated_by_id');
    table.dropColumn('created_by_id');
    table.dropColumn('updated_by_id');
  });
  await db.schema.dropTable('user');
};
