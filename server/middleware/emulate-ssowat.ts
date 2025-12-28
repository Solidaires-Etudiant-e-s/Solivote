import { createMiddlewareHandler } from 'nitro-conditional-middleware'
import type { H3Event } from 'h3';

const isEmulating = (_event: H3Event) => process.env.EMULATE_SSOWAT === 'true';

const defineMiddlewareHandler = createMiddlewareHandler(isEmulating);

export default defineMiddlewareHandler((event) => {
    if (event.node.req.headers['debug'] && event.node.req.headers['debug'] === "1") {
        event.node.req.headers['authorization'] = 'Basic ' + Buffer.from(`${process.env.EMULATE_SSOWAT_UID1}:${process.env.EMULATE_SSOWAT_PWD1}`).toString('base64');
        // Also set YunoHost user header for app endpoints (injection-safe header provided by SSOwat in prod)
        if (!event.node.req.headers['ynh_user']) {
            event.node.req.headers['ynh_user'] = String(process.env.EMULATE_SSOWAT_UID1);
        }
    } else {
        event.node.req.headers['authorization'] = 'Basic ' + Buffer.from(`${process.env.EMULATE_SSOWAT_UID2}:${process.env.EMULATE_SSOWAT_PWD2}`).toString('base64');
        // Also set YunoHost user header for app endpoints (injection-safe header provided by SSOwat in prod)
        if (!event.node.req.headers['ynh_user']) {
            event.node.req.headers['ynh_user'] = String(process.env.EMULATE_SSOWAT_UID2);
        }
    }
})
