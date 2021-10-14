import { Router } from 'express';
import authenticateRoutes from './authenticate.js';
import boltzRoutes from './boltz.js';
import loopRoutes from './loop.js';
import RTLConfRoutes from './RTLConf.js';
const router = Router();
const sharedRoutes = [
    { path: '/authenticate', route: authenticateRoutes },
    { path: '/boltz', route: boltzRoutes },
    { path: '/loop', route: loopRoutes },
    { path: '/conf', route: RTLConfRoutes }
];
sharedRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
export default router;
