'use strict';

const Boom = require('boom');
const PayloadSchema = require('../../../schema/payload/credentials');

module.exports = (server) => ({
  id: 'auth:login',
  description: 'Log In',
  tags: ['api', 'auth'],
  auth: false,
  validate: {
    payload: PayloadSchema.options({ presence: 'required', stripUnknown: true })
  },
  handler: async function (request, h) {

    const user = await server.models.get('User').query()
      .findOne({ username: request.payload.username })
      .throwIfNotFound()
      .catch(async (e) => {
        if (Boom.isBoom(e)) { // not found
          throw Boom.unauthorized(`Invalid credentials`);
        }
        throw e;
      });

    if (!await user.verifyPassword(request.payload.password)) {
      throw Boom.unauthorized(`Invalid credentials`);
    }

    const token = await server.methods.jwtSign({ id: user.$id(), scope: [user.role] });

    return h.response({ token });
  }
});
