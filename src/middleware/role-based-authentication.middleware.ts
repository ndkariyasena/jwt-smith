import { Response, NextFunction } from 'express';
import fs from 'node:fs/promises';
import Joi from 'joi';

import { AuthedRequest } from '../lib/custom';
import { log } from '../lib/logger';
import { RolePermissionConfigFilePath } from '../helper/constants';
import {
	EndPointConfig,
	EndPointsPermissionConfig,
	PermissionsConfiguration,
	PermissionsSet,
	RolesSet,
} from '../module/internal';
import { middlewareConfigs } from '../lib/core';

const permissionSchema = Joi.object({
	roles: Joi.array().items(Joi.string().required()).required(),
	actions: Joi.array().items(Joi.string().required()).required(),
});

const endpointSchema = Joi.object({
	path: Joi.string().required(),
	methods: Joi.array()
		.items(Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))
		.required(),
	permissions: Joi.array().items(permissionSchema).required(),
});

const groupSchema = Joi.object({
	basePath: Joi.string().required(),
	permissions: Joi.array().items(permissionSchema).required(),
	endpoints: Joi.array().items(endpointSchema).required(),
});

const commonRolesSchema = Joi.object({
	name: Joi.string().required(),
	permissions: Joi.array().items(Joi.string().required()).required(),
});

const permissionsConfigSchema = Joi.object({
	versioned: Joi.boolean().optional(),
	activeVersions: Joi.array().items(Joi.string().required()).optional(),
	common: Joi.object({
		roles: Joi.array().items(commonRolesSchema).required(),
	}).optional(),
	groups: Joi.object().pattern(Joi.string(), groupSchema).optional(),
	endpoints: Joi.array().items(endpointSchema).optional(),
});

const getPermissionConfigs = async () => {
	await fs.stat(RolePermissionConfigFilePath).catch((e) => {
		log('error', 'Auth permissions configuration file could not found');

		throw e;
	});

	return JSON.parse(await fs.readFile(RolePermissionConfigFilePath, 'utf-8'));
};

const roleBasedAuthenticationMiddleware = (requiredAction: string) => {
	return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
		const { extractApiVersion } = middlewareConfigs;

		const { user, role } = req;
		const userRole = user && Object.hasOwn(user, 'role') ? user.role : role;
		const endpointPath = req.baseUrl;
		const method = req.method;

		let requestVersion = undefined;
		let versionValidationError: string | undefined = undefined;

		if (extractApiVersion) {
			const version = await extractApiVersion(req);

			if (version) {
				requestVersion = version;
			}
		}

		log(
			'debug',
			`User role: ${userRole} | Required action: ${requiredAction} | Endpoint: ${endpointPath} | Method: ${method}`,
		);
		log('debug', `API version extracted from the request: ${requestVersion}`);

		if (!userRole) {
			res.status(403).json({ error: 'Access denied. Role not found.' });
		} else {
			const permissionsConfig: PermissionsConfiguration = await getPermissionConfigs();

			const { error } = permissionsConfigSchema.validate(permissionsConfig);

			if (error) {
				log('error', "Auth Permissions config file's validation failed.", error);

				throw error;
			}

			if (!permissionsConfig.common && !permissionsConfig.groups && !permissionsConfig.endpoints) {
				log('error', 'At least one permission set should be in the configs.');

				throw new Error('Permission configurations is empty.');
			}

			if (permissionsConfig.versioned) {
				if (!requestVersion) {
					versionValidationError = 'Access denied. Insufficient permissions.';
				}
				if (requestVersion && !permissionsConfig.activeVersions?.includes(requestVersion)) {
					versionValidationError = 'Unsupported API version.';
				}
			}

			if (versionValidationError) {
				log('error', versionValidationError);

				res.status(400).json({ error: versionValidationError });
			} else {
				/* Match standalone endpoints. */
				if (permissionsConfig.endpoints) {
					const standaloneEndpoint = permissionsConfig.endpoints.find(
						(ep: EndPointsPermissionConfig) => ep.path === endpointPath && ep.methods.includes(method),
					);

					if (standaloneEndpoint) {
						if (checkPermissions(userRole, requiredAction, [], standaloneEndpoint.permissions)) {
							return next();
						}
					}
				}

				/* Match group-based routes. */
				if (permissionsConfig.groups) {
					const groups: EndPointConfig[] = Object.values(permissionsConfig.groups);
					const matchedGroup = groups.find(
						(group: EndPointConfig) =>
							endpointPath.startsWith(group.basePath) &&
							group.endpoints.some((ep: EndPointsPermissionConfig) => ep.path === endpointPath),
					);

					if (matchedGroup) {
						const groupPermissions = matchedGroup.permissions || [];
						const endpointPermissions =
							matchedGroup.endpoints.find(
								(ep: EndPointsPermissionConfig) => ep.path === endpointPath && ep.methods.includes(method),
							)?.permissions || [];

						if (checkPermissions(userRole, requiredAction, groupPermissions, endpointPermissions)) {
							return next();
						}
					}
				}

				/* Check common permissions. */
				if (permissionsConfig.common) {
					const commonRoles = permissionsConfig.common.roles || [];
					const commonRole = commonRoles.find((role: RolesSet) => role.name === userRole);
					if (commonRole && commonRole.permissions.includes('*:*')) {
						/* Full access granted. */
						return next();
					}
				}

				res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
			}
		}
	};
};

function checkPermissions(
	userRole: string,
	requiredAction: string,
	groupPermissions: PermissionsSet[],
	endpointPermissions: PermissionsSet[],
): boolean {
	const combinedPermissions = [...groupPermissions, ...endpointPermissions];

	return combinedPermissions.some((permission: PermissionsSet) => {
		if (permission.roles.includes(userRole)) {
			return permission.actions.includes(requiredAction) || permission.actions.includes('*:*');
		}
		return false;
	});
}

export default roleBasedAuthenticationMiddleware;
