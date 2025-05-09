// /routes/tasks.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Task    = require('../models/Task');
const Garage  = require('../models/Garage');

const upload = multer({ storage: multer.memoryStorage() }).array('evidence', 5);
// GET tasks for a specific vehicle
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

// POST – create a new task (admin only)
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
    res.status(201).json(task);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get a single task by ID
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

// Edit a task (restricted to admins)
router.put('/:id', auth, upload.single('evidence'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can edit tasks' });
    }

    // Check if the user has permission (e.g., vehicle belongs to user's garage)
    if (task.vehicle.toString() !== req.user.vehicle) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    task.name = req.body.name || task.name;
    task.description = req.body.description || task.description;
    task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : task.dueDate;

    if (req.file) {
      task.evidence = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    if (req.body.status === 'completed' && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
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



router.patch('/:id/complete', auth, upload, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const garage = await Garage.findById(task.garage);
    if (!garage) return res.status(400).json({ message: 'Parent garage not found' });

    // only admin or same-garage user may complete
    if (
      req.user.role !== 'admin' &&
      req.user.garage.toString() !== garage._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.status      = 'completed';
    task.completedAt = new Date();

    // if any files were uploaded, push them into the array
    if (req.files && req.files.length) {
      const images = req.files.map(f => ({
        data:        f.buffer,
        contentType: f.mimetype
      }));
      // either replace or append—here we append:
      task.evidence.push(...images);
    }

    if (req.body.latitude && req.body.longitude) {
      task.location = {
        latitude:  parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }

    await task.save();
    res.json({ message: 'Task completed', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete a task (restricted to admins)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    // Check permission
    if (task.vehicle.toString() !== req.user.vehicle) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await task.remove();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
