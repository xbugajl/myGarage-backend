const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
/**
 * @swagger
 * /api/chat/garage/{garageId}:
 *   get:
 *     summary: Get garage chat history
 *     description: Retrieve the last 50 chat messages for a specific garage
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: garageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the garage
 *     responses:
 *       200:
 *         description: List of chat messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ChatMessage'
 *                   - type: object
 *                     properties:
 *                       sender:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       400:
 *         description: Invalid garage ID
 *       500:
 *         description: Server error
 */
router.get('/garage/:garageId', auth, async (req, res) => {
  try {
    const garageId = req.params.garageId;

    if (!mongoose.Types.ObjectId.isValid(garageId)) {
      return res.status(400).json({ error: 'Invalid garage ID' });
    }

    const messages = await ChatMessage.find({ garage: garageId })
        .populate('sender', 'name email') // Načítanie mena a emailu odosielateľa
        .sort({ timestamp: 1 })
        .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Chyba pri načítavaní správ:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
