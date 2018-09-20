'use strict';

const Joi = require('joi');

const OrganizationIdSchema = require('../../schema/id/organization');

module.exports = (server) => ({
  id: 'organization:findById',
  description: 'Finds the organization by ID',
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
  handler: async function (request, h) {
    const organization = await server.models.get('Organization')
      .query()
      .eager('[type]')
      .findById(request.params.organizationId)
      .throwIfNotFound();

    return h
      .response({
        ...organization.$clone().$pick(['id', 'name', 'description', 'url']).toJSON(),
        type: organization.type.key
      })
      .header('last-modified', (organization.updatedAt ? organization.updatedAt : organization.createdAt).toUTCString());
  }
});
