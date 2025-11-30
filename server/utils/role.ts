import { Client } from 'ldapts';
import type { H3Event } from 'h3';
import { createError } from 'h3';

const USER_DN = 'ou=users,dc=yunohost,dc=org';
const GROUPS_DN = 'ou=groups,dc=yunohost,dc=org';
const LDAP_URL = process.env.LDAP_URL || 'ldap://127.0.0.1:10389';

export class User {
    name: string
    role: string

    constructor(name: string, role: string) {
        self.name = name
        self.role = role
    }
}

export async function getUser(event: H3Event): Promise<User> {
    const authHeader = event.node.req.headers['authorization'];
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: 'missing authorization header' });
    }

    const [uid, password] = Buffer.from(String(authHeader).split(' ')[1], 'base64')
        .toString()
        .split(':');

    const client = new Client({
        url: LDAP_URL,
        timeout: 10000,
        connectTimeout: 10000,
    });

    const posixGroupFilter = `(&(objectClass=posixGroup)(memberUid=${uid}))`;

    try {
        await client.bind(`uid=${uid},${USER_DN}`, password);

        const res = await client.search(GROUPS_DN, {
            filter: posixGroupFilter,
            scope: 'sub',
            attributes: ['cn', 'n'],
        });

        const entries = res.searchEntries ?? [];

        const matches = (val: unknown, target: string) => {
            if (Array.isArray(val)) return val.includes(target);
            if (typeof val === 'string') return val === target;
            return false;
        };

        if (entries.some(e => matches((e as any).cn, 'admins'))) {
            return {name: uid, role: Groupe.ADMIN};
        }
        if (entries.some(e => matches((e as any).cn, 'syndicats'))) {
            return {name: uid, role: Groupe.SYNDICAT};
        }

        throw createError({ statusCode: 403, statusMessage: 'no matching group' });
    } finally {
        try { await client.unbind(); } catch (_) { /* ignore */ }
    }
}

export enum Groupe {
    ADMIN = "admin",
    SYNDICAT = "syndicat"
}
