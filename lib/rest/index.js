'use strict';

const Pkg = require('../../package.json');

exports.plugin = {
  name: `${Pkg.name}/rest`,
  version: Pkg.version,
  register: async (server) => {
    const route = (path, method, options) => server.route({ method, path, options });

    route('/auth/login', 'POST', require('./route/auth/login/create'));

    route('/organizations', 'POST', require('./route/organization/create'));
    route('/organizations', 'GET', require('./route/organization/find-all'));
    route('/organizations/{organizationId}', 'GET', require('./route/organization/find-by-id'));
    route('/organizations/{organizationId}', 'PATCH', require('./route/organization/update-by-id'));
    route('/organizations/{organizationId}', 'DELETE', require('./route/organization/delete-by-id'));
  }
};
