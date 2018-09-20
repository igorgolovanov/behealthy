'use strict';

const Joi = require('joi');
const Boom = require('boom');
const { transaction } = require('objection');

const PayloadSchemaBase = require('../../schema/payload/organization');
const OrganizationIdSchema = require('../../schema/id/organization');
const PayloadSchema = PayloadSchemaBase.keys({ id: Joi.any().strip() }).min(1);

module.exports = (server) => ({
  id: 'organization:updateById',
  description: 'Updates the organization by ID',
  tags: ['api', 'organization'],
  auth: {
    access: [
      {
        scope: ['editor']
      },
      {
        scope: ['+user', '+organization[{params.organizationId}]:update']
      }
    ]
  },
  validate: {
    params: {
      organizationId: OrganizationIdSchema
    },
    payload: async function (payload, options) {
      payload = await Joi.validate(payload, PayloadSchema, { ...options, presence: 'optional', stripUnknown: true });

      if (payload.type) {
        if (await server.models.get('OrganizationType').query().findOne({ key: payload.type }).resultSize() === 0) {
          throw Boom.badRequest(`Invalid Type`, {
            type: payload.type
          });
        }
      }
      return payload;
    }
  },
  plugins: {
    'hapi-swagger': {
      validate: {
        headers: {
          authorization: Joi.string()
        },
        payload: PayloadSchema.options({ presence: 'optional' })
      }
    }
  },
  ext: {
    onCredentials: {
      method: async function (request, h) {
        const item = await server.models.get('Organization')
          .query()
          .select('createdById')
          .findById(request.params.organizationId);

        if (item && item.createdById === request.auth.credentials.user.id) {
          request.auth.credentials.scope = [
            ...request.auth.credentials.scope,
            `organization[${request.params.organizationId}]:update`
          ];
        }
        return h.continue;
      }
    }
  },
  response: {
    schema: false
  },
  handler: async function (request, h) {

    await transaction(server.models.get('Organization'), async (model) => {
      const organization = await model.query()
        .findById(request.params.organizationId)
        .forUpdate()
        .throwIfNotFound();

      if (request.payload.type) {
        await organization.$relatedQuery('type')
          .relate(await model.relatedQuery('type').findOne({ key: request.payload.type }).throwIfNotFound());
      }
      await organization.$relatedQuery('updatedBy').relate(request.auth.credentials.user.id);
      await organization.$query().patch({ ...request.payload });
    });

    server.events.emit({ name: 'organization', tags: 'update' }, { id: request.params.organizationId });

    return h.response().code(202);
  }
});
