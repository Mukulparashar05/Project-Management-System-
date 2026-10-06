import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema } from '../validators/common.validators.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.validators.js';

const router = Router();

router.get('/', validate({ query: listProjectsQuerySchema }), projectController.listProjects);
router.post('/', validate({ body: createProjectSchema }), projectController.createProject);
router.get('/:id', validate({ params: idParamsSchema }), projectController.getProject);
router.put(
  '/:id',
  validate({ params: idParamsSchema, body: updateProjectSchema }),
  projectController.updateProject,
);
router.delete('/:id', validate({ params: idParamsSchema }), projectController.deleteProject);

export default router;
