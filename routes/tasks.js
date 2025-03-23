const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Garage = require('../models/Garage');

router.get('/user', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).populate('vehicle', 'brand model');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  const { description, dueDate, assignedTo } = req.body;
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage || garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    const task = new Task({
      description,
      dueDate,
      assignedTo,
      vehicle: req.params.vehicleId,
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/complete/:id', auth, async (req, res) => {
  const { evidence, latitude, longitude } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    task.status = 'completed';
    task.evidence = evidence || task.evidence;
    task.completedAt = Date.now();
    task.location = { latitude, longitude };
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;