// /routes/tasks.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const Task    = require('../models/Task');
const Garage  = require('../models/Garage');

// GET tasks assigned to user
router.get('/user', auth, async (req, res) => {
  try {
    const tasks = await Task
      .find({ assignedTo: req.user.id })
      .populate('vehicle', 'brand model');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

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

// PATCH – mark as completed
router.patch('/tasks/:id/complete', auth, async (req, res) => {
  const { photos, latitude, longitude } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status      = 'completed';
    task.photos      = photos         || task.photos;
    task.completedAt = Date.now();
    if (latitude != null && longitude != null) {
      task.location = { latitude, longitude };
    }

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
