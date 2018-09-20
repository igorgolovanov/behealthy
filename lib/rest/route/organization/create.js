'use strict';

const Joi = require('joi');
const Boom = require('boom');

const PayloadSchema = require('../../schema/payload/organization');
const OrganizationIdSchema = require('../../schema/id/organization');

module.exports = (server) => ({
  id: 'organization:create',
  description: 'Creates the new organization',
  tags: ['api', 'organization'],
  auth: {
    access: {
      scope: ['editor', 'user']
    }
  },
  plugins: {
    'hapi-swagger': {
      validate: {
        headers: {
          authorization: Joi.string()
        },
        payload: PayloadSchema.options({ presence: 'required' })
      }
    }
  },
  validate: {
    payload: async function (payload, options) {
      payload = await Joi.validate(payload, PayloadSchema, { ...options, presence: 'required', stripUnknown: true });

      if (await server.models.get('OrganizationType').query().findOne({ key: payload.type }).resultSize() === 0) {
        throw Boom.badRequest(`Invalid Type`, {
          type: payload.type
        });
      }
      return payload;
    }
  },
  response: {
    schema: {
      id: OrganizationIdSchema
    }
  },
  handler: async function (request, h) {
    const organization = await server.models.get('Organization').query().insertGraphAndFetch({
      ...request.payload,
      type: await server.models.get('OrganizationType').query().findOne({ key: request.payload.type }).throwIfNotFound(),
      createdBy: { id: request.auth.credentials.user.id }
    }, { relate: ['type', 'createdBy'] });

    server.events.emit({ name: 'organization', tags: 'new' }, { id: organization.$id() });

    return h
      .response(organization.$clone().$pick(['id']).toJSON())
      .created(`/api/organizations${organization.$id()}`);
  }
});
