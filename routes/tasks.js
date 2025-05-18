// /routes/tasks.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Task    = require('../models/Task');
const Garage  = require('../models/Garage');
const multer  = require('multer');
const { sendExpoPush } = require('../utils/expoPush');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() }).array('evidence', 5);
/**
 * @swagger
 * /api/tasks/vehicle/{vehicleId}:
 *   get:
 *     summary: Get vehicle tasks
 *     description: Get all tasks for a specific vehicle, sorted by due date
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       500:
 *         description: Server error
 */
router.get('/vehicle/:vehicleId', auth, async (req, res) => {
  try {
    const tasks = await Task
      .find({ vehicle: req.params.vehicleId })
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/tasks/garage/{garageId}/vehicle/{vehicleId}:
 *   post:
 *     summary: Create new task
 *     description: Create a new task for a vehicle. Only accessible by garage admin.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: garageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the garage
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - dueDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the task
 *               description:
 *                 type: string
 *                 description: Detailed description of the task
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the task is due
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Access denied - not an admin
 *       500:
 *         description: Server error
 */
router.post('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  const { name, description, dueDate } = req.body;
  if (!name || !description || !dueDate) {
    return res.status(400).json({ message: 'Name, description and dueDate are required' });
  }

  try {
    // verify garage + admin
    const garage = await Garage.findById(req.params.garageId);
    if (!garage || garage.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // create and save
    const task = new Task({
      name,
      description,
      dueDate: new Date(dueDate),
      vehicle: req.params.vehicleId,
      garage:  req.params.garageId,
      status:  'pending'
    });

    await task.save();
    const users = await User.find({
      role: 'user',
      garage: req.params.garageId,
      deviceToken: { $exists: true, $ne: '' },
    }, 'deviceToken');
   
    sendExpoPush(
      users.map((u) => u.deviceToken),
      'New task assigned',
      task.name,
      { taskId: task._id.toString() }
    );
    return res.status(201).json(task);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Get detailed information about a specific task
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Task'
 *                 - type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         brand:
 *                           type: string
 *                         model:
 *                           type: string
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('vehicle', 'brand model');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     description: Update a task's details. Only accessible by admin.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated task name
 *               description:
 *                 type: string
 *                 description: Updated task description
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated due date
 *               status:
 *                 type: string
 *                 enum: [pending, completed]
 *                 description: Updated task status
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Evidence images (up to 5)
 *               latitude:
 *                 type: number
 *                 description: Latitude where task was completed
 *               longitude:
 *                 type: number
 *                 description: Longitude where task was completed
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       403:
 *         description: Access denied - not an admin
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, upload, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can edit tasks' });
    }

    

    task.name = req.body.name || task.name;
    task.description = req.body.description || task.description;
    task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;

    if (req.files && req.files.length) {
      task.evidence = req.files.map(f => ({
        data: f.buffer,
        contentType: f.mimetype
      }));
    }

    if (req.body.status === 'completed' && task.status !== 'completed') {
      task.status      = 'completed';
      task.completedAt = new Date();
      task.completedBy = { _id: req.user.id, email: req.user.email };
      if (req.body.latitude && req.body.longitude) {
        task.location = {
          latitude: parseFloat(req.body.latitude),
          longitude: parseFloat(req.body.longitude),
        };
      }
    } else if (req.body.status === 'pending') {
      task.status = 'pending';
      task.completedAt = null;
      task.location = null;
    }

    await task.save();
    res.json({ message: 'Task updated', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Complete task
 *     description: Mark a task as completed with optional evidence, location, and comment
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Evidence images (up to 5)
 *               latitude:
 *                 type: number
 *                 description: Latitude where task was completed
 *               longitude:
 *                 type: number
 *                 description: Longitude where task was completed
 *               completionComment:
 *                 type: string
 *                 description: Comment about task completion
 *     responses:
 *       200:
 *         description: Task marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/complete', auth, upload, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate({
      path: 'vehicle',
      populate: {
        path: 'garage'
      }
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      (!task.vehicle || !task.vehicle.garage || req.user.garage.toString() !== task.vehicle.garage._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Set task as completed
    task.status = 'completed';
    task.completedAt = new Date();

    // Handle evidence images (if provided)
    if (req.files && req.files.length) {
      const newImages = req.files.map(f => ({
        data: f.buffer,
        contentType: f.mimetype
      }));
      // Initialize task.evidence if it doesn't exist
      if (!task.evidence) {
        task.evidence = { evidence: [] };
      } else if (!Array.isArray(task.evidence.evidence)) {
        task.evidence.evidence = [];
      }
      // Push new images into the nested evidence array
      task.evidence.evidence.push(...newImages);
    }

    // Handle location (if provided)
    if (req.body.latitude && req.body.longitude) {
      task.location = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }

    // Handle completion comment (if provided)
    if (req.body.completionComment) {
      task.completionComment = req.body.completionComment;
    }

    await task.save();
    res.json({ message: 'Task completed', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Delete a task. Only accessible by admin.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the task
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied - not an admin
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
