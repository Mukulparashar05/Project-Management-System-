import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamsSchema } from '../validators/common.validators.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../validators/task.validators.js';

const router = Router();

router.get('/', validate({ query: listTasksQuerySchema }), taskController.listTasks);
router.post('/', validate({ body: createTaskSchema }), taskController.createTask);
router.get('/:id', validate({ params: idParamsSchema }), taskController.getTask);
router.put(
  '/:id',
  validate({ params: idParamsSchema, body: updateTaskSchema }),
  taskController.updateTask,
);
router.delete('/:id', validate({ params: idParamsSchema }), taskController.deleteTask);

export default router;
