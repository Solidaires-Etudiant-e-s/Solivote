import { Client } from 'ldapts';
import type { H3Event } from 'h3';
import { createError } from 'h3';

const USER_DN = 'ou=users,dc=yunohost,dc=org';
const GROUPS_DN = 'cn=syndicats,ou=groups,dc=yunohost,dc=org';
const LDAP_URL = process.env.LDAP_URL || 'ldap://127.0.0.1:10389';

export async function getSyndicats(event: H3Event): Promise<string[]> {
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

    try {
        await client.bind(`uid=${uid},${USER_DN}`, password);

        const res = await client.search(GROUPS_DN, {
            filter: '',
            scope: 'base',
            attributes: ['member'],
        });

        const entries = res.searchEntries ?? [];

        const syndicats = entries[0].member.map(dn => {
            const part = dn.split(',')[0];         // "uid=xxx"
            return part.replace(/^uid=/i, '');     // remove "uid="
        });

        return syndicats
    } finally {
        try { await client.unbind(); } catch (_) { /* ignore */ }
    }
}
