'use strict';

exports.up = async (db) => {
  await db.schema.createTable('organization_type', (table) => {
    table.increments('id').primary();
    table.string('key', 20).unique();
  });
  await db.schema.createTable('organization', (table) => {
    table.increments('id').primary();
    table.integer('type_id').unsigned().notNullable();
    table.foreign('type_id').references('id').inTable('organization_type').onDelete('RESTRICT').onUpdate('CASCADE');
    table.string('name', 100).notNullable();
    table.string('url', 2048).notNullable();
    table.text('description').nullable();
    table.timestamps(true, true);
  });
  await db.insert([
    { key: 'employer' },
    { key: 'insurance' },
    { key: 'health-system' }
  ]).into('organization_type');
};

exports.down = async (db) => {
  await db.schema.dropTable('organization');
  await db.schema.dropTable('organization_type');
};
