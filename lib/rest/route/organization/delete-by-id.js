'use strict';

const Joi = require('joi');

const OrganizationIdSchema = require('../../schema/id/organization');

module.exports = (server) => ({
  id: 'organization:deleteById',
  description: 'Deletes the organization by ID',
  tags: ['api', 'organization'],
  auth: {
    access: [
      {
        scope: ['editor']
      },
      {
        scope: ['+user', '+organization[{params.organizationId}]:delete']
      }
    ]
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
    await server.models.get('Organization')
      .query()
      .deleteById(request.params.organizationId)
      .throwIfNotFound();

    server.events.emit({ name: 'organization', tags: 'delete' }, { id: request.params.organizationId });

    return h.response().code(202);
  }
});
