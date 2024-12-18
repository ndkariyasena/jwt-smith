export interface PermissionsSet {
	roles: string[];
	actions: string[];
}

export interface RolesSet {
	name: string;
	permissions: string[];
}

export interface EndPointsPermissionConfig {
	path: string;
	methods: string[];
	permissions: PermissionsSet[];
}

export interface EndPointConfig {
	basePath: string;
	permissions: PermissionsSet[];
	endpoints: EndPointsPermissionConfig[];
}

export type GroupedRoutesPermissionConfig = Record<string, EndPointConfig>;

export interface CommonPermissionConfig {
	roles: RolesSet[];
}

export interface PermissionsConfiguration {
	common: CommonPermissionConfig;
	groups: GroupedRoutesPermissionConfig;
	endpoints: EndPointsPermissionConfig[];
}
