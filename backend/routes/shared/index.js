const express = require('express');
const router = express.Router();
const authenticateRoutes = require('./authenticate');
const boltzRoutes = require('./boltz');
const loopRoutes = require('./loop');
const RTLConfRoutes = require('./RTLConf');

const sharedRoutes = [
  { path: '/authenticate', route: authenticateRoutes },
  { path: '/boltz', route: boltzRoutes },
  { path: '/loop', route: loopRoutes },
  { path: '/conf', route: RTLConfRoutes }
];

sharedRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
