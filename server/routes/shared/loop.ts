import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { loopInTerms, loopInQuote, loopInTermsAndQuotes, loopIn, loopOutTerms, loopOutQuote, loopOutTermsAndQuotes, loopOut, swaps, swap } from '../../controllers/shared/loop.js';

const router = Router();

router.get('/in/terms', isAuthenticated, loopInTerms);
router.get('/in/quote/:amount', isAuthenticated, loopInQuote);
router.get('/in/termsAndQuotes', isAuthenticated, loopInTermsAndQuotes);
router.post('/in', isAuthenticated, loopIn);
router.get('/out/terms', isAuthenticated, loopOutTerms);
router.get('/out/quote/:amount', isAuthenticated, loopOutQuote);
router.get('/out/termsAndQuotes', isAuthenticated, loopOutTermsAndQuotes);
router.post('/out', isAuthenticated, loopOut);
router.get('/swaps', isAuthenticated, swaps);
router.get('/swap/:id', isAuthenticated, swap);

export default router;
