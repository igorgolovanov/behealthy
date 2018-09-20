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
    access: {
      scope: ['editor', 'user']
    }
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
  response: {
    schema: false
  },
  handler: async function (request, h) {
    await transaction(server.models.get('Organization'), async (model) => {
      const organization = await model.query()
        .findById(request.params.organizationId)
        .forUpdate()
        .throwIfNotFound();

      await organization.$query().upsertGraph({
        ...request.payload,
        updatedBy: { id: request.auth.credentials.user.id }
      }, { relate: ['updatedBy', 'type'] });
    });

    server.events.emit({ name: 'organization', tags: 'update' }, { id: request.params.organizationId });

    return h.response().code(202);
  }
});
