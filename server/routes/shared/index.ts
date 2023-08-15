import exprs from 'express';
const { Router } = exprs;
import authenticateRoutes from './authenticate.js';
import boltzRoutes from './boltz.js';
import loopRoutes from './loop.js';
import RTLConfRoutes from './RTLConf.js';
import pageSettingsRoutes from './pageSettings.js';

const router = Router();

const sharedRoutes = [
  { path: '/authenticate', route: authenticateRoutes },
  { path: '/boltz', route: boltzRoutes },
  { path: '/loop', route: loopRoutes },
  { path: '/conf', route: RTLConfRoutes },
  { path: '/pagesettings', route: pageSettingsRoutes }
];

sharedRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
