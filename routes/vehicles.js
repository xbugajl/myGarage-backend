const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Garage = require('../models/Garage');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 }, // 8 MB guard
});
/**
 * @swagger
 * /api/vehicles/garage/{garageId}:
 *   get:
 *     summary: Get all vehicles in a garage
 *     description: Retrieve all vehicles belonging to a specific garage. Accessible by garage admin or members.
 *     tags:
 *       - Vehicles
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
 *         description: List of vehicles in the garage
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   brand:
 *                     type: string
 *                   model:
 *                     type: string
 *                   year:
 *                     type: number
 *                   identification:
 *                     type: string
 *                   garage:
 *                     type: string
 *                   hasPhoto:
 *                     type: boolean
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage not found
 *       500:
 *         description: Server error
 */
router.get('/garage/:garageId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // allow if they're the admin or if their user.garage matches
    const isAdmin  = garage.admin.toString() === req.user.id;
    const isMember = req.user.garage?.toString() === req.params.garageId;
    if (!isAdmin && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const vehicles = await Vehicle.find({ garage: req.params.garageId });
    
    // Transform and log each vehicle's photo status
    const transformedVehicles = vehicles.map(vehicle => {
      const hasPhoto = !!(vehicle.photos && vehicle.photos.data && vehicle.photos.data.length > 0);
      console.log(`Vehicle ${vehicle._id} (${vehicle.brand} ${vehicle.model}) has photo: ${hasPhoto}`);
      if (vehicle.photos) {
        console.log('Photo data:', {
          hasPhotos: !!vehicle.photos,
          hasData: !!vehicle.photos.data,
          dataLength: vehicle.photos.data ? vehicle.photos.data.length : 0,
          contentType: vehicle.photos.contentType
        });
      }

      return {
        _id: vehicle._id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        identification: vehicle.identification,
        garage: vehicle.garage,
        hasPhoto: hasPhoto
      };
    });
    
    res.json(transformedVehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// get na jedno vozidlo, vhodne pri zobrazovani informacii o vozidle 
/**
 * @swagger
 * /api/vehicles/garage/{garageId}/vehicle/{vehicleId}:
 *   get:
 *     summary: Get vehicle details
 *     description: Get detailed information about a specific vehicle in a garage
 *     tags:
 *       - Vehicles
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
 *     responses:
 *       200:
 *         description: Vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage or vehicle not found
 *       400:
 *         description: Vehicle does not belong to this garage
 *       500:
 *         description: Server error
 */
router.get('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (req.user.role !== 'admin' && garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });

    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.garage.toString() !== req.params.garageId) {
      return res.status(400).json({ message: 'Vehicle does not belong to this garage' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/vehicles/garage/{garageId}/vehicle/{vehicleId}/photo:
 *   get:
 *     summary: Get vehicle photo
 *     description: Get the photo of a specific vehicle
 *     tags:
 *       - Vehicles
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
 *     responses:
 *       200:
 *         description: Vehicle photo
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage, vehicle, or photo not found
 *       400:
 *         description: Vehicle does not belong to this garage
 *       500:
 *         description: Server error
 */
router.get('/garage/:garageId/vehicle/:vehicleId/photo', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (req.user.role !== 'admin' && garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });

    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.garage.toString() !== req.params.garageId) {
      return res.status(400).json({ message: 'Vehicle does not belong to this garage' });
    }

    if (!vehicle.photos?.data || !vehicle.photos.data.length) {
      console.log('Photo endpoint: No photo data found for vehicle', req.params.vehicleId);
      return res.status(404).json({ message: 'No photo found' });
    }

    console.log('Photo endpoint: Sending photo for vehicle', req.params.vehicleId, {
      contentType: vehicle.photos.contentType,
      dataLength: vehicle.photos.data.length
    });

    res.set('Content-Type', vehicle.photos.contentType);
    res.send(vehicle.photos.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/vehicles/garage/{garageId}:
 *   post:
 *     summary: Add new vehicle
 *     description: Add a new vehicle to a garage with photo
 *     tags:
 *       - Vehicles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: garageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the garage
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - model
 *               - year
 *               - identification
 *               - photos
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               identification:
 *                 type: string
 *               photos:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: No photo uploaded or invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage not found
 *       500:
 *         description: Server error
 */
router.post(
    '/garage/:garageId',
    auth,
    upload.single('photos'),
    async (req, res) => {
      const { brand, model, year, identification } = req.body;

      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No photo uploaded' });
        }

        // Validate garage
        const garage = await Garage.findById(req.params.garageId);
        if (!garage) {
          return res.status(404).json({ message: 'Garage not found' });
        }
        if (garage.admin.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Create the vehicle with the photo binary data
        const vehicle = new Vehicle({
          brand,
          model,
          year,
          identification,
          photos: {
            data: req.file.buffer,       // Binary data from multer
            contentType: req.file.mimetype, // MIME type (e.g., "image/png")
          },
          garage: req.params.garageId,
        });

        await vehicle.save();
        res.status(201).json({message: "Success"});
      } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
);


/**
 * @swagger
 * /api/vehicles/garage/{garageId}/vehicle/{vehicleId}:
 *   delete:
 *     summary: Delete vehicle
 *     description: Delete a vehicle from a garage
 *     tags:
 *       - Vehicles
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
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage or vehicle not found
 *       400:
 *         description: Vehicle does not belong to this garage
 *       500:
 *         description: Server error
 */
router.delete('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  try {
    // kontrola ci garaz existuje
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // verifikacia ci je pouzivatel admin
    if (garage.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // kontrola ci vozidlo pod id existuje
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // kontrola ci vozidlo patri do garaze
    if (vehicle.garage.toString() !== req.params.garageId) {
      return res.status(400).json({ message: 'Vehicle does not belong to this garage' });
    }

    // delete vozidla
    await vehicle.deleteOne();
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/vehicles/garage/{garageId}/vehicle/{vehicleId}:
 *   put:
 *     summary: Update vehicle
 *     description: Update vehicle details and optionally its photo
 *     tags:
 *       - Vehicles
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               identification:
 *                 type: string
 *               photos:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Garage or vehicle not found
 *       400:
 *         description: Vehicle does not belong to this garage
 *       500:
 *         description: Server error
 */
router.put('/garage/:garageId/vehicle/:vehicleId', auth, async (req, res) => {
  const { brand, model, year, identification , photos } = req.body;
  try {
    // kontrola ci garaz existuje
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // kontrola ci je user admin
    if (garage.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // kontrola ci ovzidlo je
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // kontrola ci vozidlo patri do garaze
    if (vehicle.garage.toString() !== req.params.garageId) {
      return res.status(400).json({ message: 'Vehicle does not belong to this garage' });
    }
    
    // update fieldov pokial su vyplnene
    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (identification) vehicle.identification = identification;
    if (req.file) {
      vehicle.photos = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;