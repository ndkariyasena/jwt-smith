export function utils(): string {
	return 'utils';
}

export const formatError = (error: Error) => {
	console.log(error);
};

export const extractAuthHeaderValue = (header: string): string => {
	let tokenValue;

	if (header && header.split(' ')[1]) {
		tokenValue = header.split(' ')[1] as string;
	} else {
		tokenValue = header;
	}

	return tokenValue;
};
