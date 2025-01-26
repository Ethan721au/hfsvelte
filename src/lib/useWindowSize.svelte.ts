import { writable } from 'svelte/store';

export const isMobile = writable(false);

export const useWindowSize = () => {
	if (typeof window !== 'undefined') {
		window.addEventListener('resize', handleResize);

		return (): void => window.removeEventListener('resize', handleResize);
	}
};

const handleResize = (): void => {
	isMobile.set(window.innerWidth < 600);
};
