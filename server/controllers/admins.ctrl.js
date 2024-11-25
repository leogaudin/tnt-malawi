import express from 'express'
import Admin from '../models/admins.model.js'
import {
	createOne,
	createMany,
	deleteOne,
	getById,
	getAll,
	deleteMany,
} from '../service/crud.js';

const router = express.Router();

router.post('/admin', createOne(Admin));
// router.post('/admins', createMany(Admin));
// router.delete('/admin/:id', deleteOne(Admin));
// router.delete('/admins', deleteMany(Admin));
// router.get('/admin/:id', getById(Admin));
// router.get('/admins', getAll(Admin));

export default router;
