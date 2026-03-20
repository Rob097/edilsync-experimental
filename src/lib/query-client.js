import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			staleTime: 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: 1,
		},
	},
});

const hotDataDefaults = {
	staleTime: 15 * 1000,
	refetchInterval: 30 * 1000,
	refetchIntervalInBackground: false,
};

[
	['notifications'],
	['allNotifications'],
	['messages'],
	['recentMessages'],
].forEach((queryKey) => {
	queryClientInstance.setQueryDefaults(queryKey, hotDataDefaults);
});