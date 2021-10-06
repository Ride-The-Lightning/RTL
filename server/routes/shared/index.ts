import { Router } from 'express';
import authenticateRoutes from './authenticate';
import boltzRoutes from './boltz';
import loopRoutes from './loop';
import RTLConfRoutes from './RTLConf';

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
