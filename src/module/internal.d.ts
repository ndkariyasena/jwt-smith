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
	versioned?: boolean;
	activeVersions?: string[];
	common: CommonPermissionConfig;
	groups: GroupedRoutesPermissionConfig;
	endpoints: EndPointsPermissionConfig[];
}

export interface ValidateResponse {
	decodedToken: VerifyResponse;
	nextRefreshToken: string | undefined;
	token: string;
}

export interface RefreshTokenHandlerOptions {
	refreshTokenStorage?: TokenStorage;
	sessionStorage?: SessionStorage;
	tokenGenerationHandler: TokenGenerationHandler;
	authTokenPayloadVerifier?: AuthTokenPayloadVerifier;
	refreshTokenPayloadVerifier?: RefreshTokenPayloadVerifier;
	refreshTokenHolderVerifier?: RefreshTokenHolderVerifier;
}
