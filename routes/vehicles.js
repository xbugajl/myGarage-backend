const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Garage = require('../models/Garage');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
// get na vsetky vozidla v garazi
router.get('/garage/:garageId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    if (req.user.role !== 'admin' && garage.admin.toString() !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    const vehicles = await Vehicle.find({ garage: req.params.garageId });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// get na jedno vozidlo, vhodne pri zobrazovani informacii o vozidle 
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

    res.set('Content-Type', vehicle.photos.contentType); // Set MIME type (e.g., image/jpeg)
    res.send(vehicle.photos.data); // Send binary image data
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

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