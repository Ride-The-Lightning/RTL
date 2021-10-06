import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
const FeesController = require('../../controllers/c-lightning/fees');

const router = Router();

router.get('/', isAuthenticated, FeesController.getFees);

export default router;
