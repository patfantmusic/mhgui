import { writable, get } from 'svelte/store';
import { DbClient } from './client';

function createDbStore() {
    const { subscribe, set } = writable(null);

    return {
        subscribe,
        init: async () => {
            // Prevent re-initialization if store already has a client
            if (get({ subscribe })) return;

            const client = await DbClient.create();
            set(client);
        }
    };
}

export const db = createDbStore();