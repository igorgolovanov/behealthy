'use strict';

const Joi = require('joi');

const OrganizationIdSchema = require('../../schema/id/organization');

module.exports = (server) => ({
  id: 'organization:deleteById',
  description: 'Deletes the organization by ID',
  tags: ['api', 'organization'],
  auth: {
    access: {
      scope: ['editor', 'user']
    }
  },
  validate: {
    params: {
      organizationId: OrganizationIdSchema
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
    schema: false
  },
  handler: async function (request, h) {
    await server.models.get('Organization')
      .query()
      .deleteById(request.params.organizationId)
      .throwIfNotFound();

    server.events.emit({ name: 'organization', tags: 'delete' }, { id: request.params.organizationId });

    return h.response().code(202);
  }
});
