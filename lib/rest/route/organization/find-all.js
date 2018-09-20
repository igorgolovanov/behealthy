'use strict';

const Joi = require('joi');

const PageNumberSchema = require('../../schema/util/page-number');
const PageSizeSchema = require('../../schema/util/page-size');
const OrderBySchema = require('../../schema/util/order-by');

module.exports = (server) => ({
  id: 'organization:findAll',
  description: 'Finds all organizations',
  tags: ['api', 'organization'],
  auth: {
    scope: [
      'editor', 'viewer', 'user'
    ]
  },
  validate: {
    query: {
      pageId: PageNumberSchema,
      pageSize: PageSizeSchema,
      orderBy: OrderBySchema
    }
  },
  plugins: {
    'hapi-swagger': {
      validate: {
        headers: {
          authorization: Joi.string()
        }
      }
    }
  },
  response: {
    schema: {
      total: Joi.number(),
      count: Joi.number(),
      items: Joi.array().items(Joi.object()).max(Joi.ref('$query.pageSize'))
    }
  },
  handler: async function (request, h) {
    const query = server.models.get('Organization')
      .query()
      .eager('[type]')
      .page(request.query.pageId - 1, request.query.pageSize);

    for (const orderBy of request.query.orderBy) {
      let [, field, , direction] = /([a-z0-9]+)([.]([a-z0-9]+))?/i.exec(orderBy);
      switch (field) {
        case 'name':
        case 'description':
        case 'url':
          direction = direction ? direction.toLowerCase() : 'asc';
          if (!['asc', 'desc'].includes(direction)) {
            direction = 'asc';
          }
          query.orderBy(field, direction);
          break;
      }
    }

    const { total, results } = await query;

    return h
      .response({
        total,
        count: results.length,
        items: results.map((item) => ({
          ...item.$clone().$pick(['id', 'name', 'description', 'url']).toJSON(),
          type: item.type.key
        }))
      })
      .code(results.length > 0 ? 200 : 404);
  }
});
