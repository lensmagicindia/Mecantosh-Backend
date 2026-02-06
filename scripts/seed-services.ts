import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define Service schema inline for the script
const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  price: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  category: { type: String, enum: ['basic', 'premium', 'detailing'], required: true },
  features: [{ type: String }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

const services = [
  {
    name: 'Express Wash',
    slug: 'express-wash',
    description: 'A quick but thorough exterior wash perfect for busy schedules. Our express wash removes dirt, grime, and road salt, leaving your car looking clean and refreshed in just 15 minutes.',
    shortDescription: 'Quick 15-minute exterior wash',
    price: 19,
    durationMinutes: 15,
    category: 'basic',
    features: [
      'Exterior rinse',
      'Soap wash',
      'Wheel cleaning',
      'Spot-free rinse',
      'Air dry',
    ],
    sortOrder: 1,
  },
  {
    name: 'Premium Exterior',
    slug: 'premium-exterior',
    description: 'Complete exterior wash with hand wax and tire shine. This package includes detailed attention to wheels, tires, and all exterior surfaces, finished with a protective wax coating.',
    shortDescription: 'Premium exterior with wax & shine',
    price: 45,
    durationMinutes: 45,
    category: 'premium',
    features: [
      'Hand wash exterior',
      'Clay bar treatment',
      'Wheel & rim cleaning',
      'Tire dressing',
      'Hand wax application',
      'Window cleaning',
      'Door jamb cleaning',
      'Chrome polishing',
    ],
    sortOrder: 2,
  },
  {
    name: 'Premium Exterior + Interior',
    slug: 'premium-exterior-interior',
    description: 'Full service package combining our premium exterior wash with complete interior detailing. The perfect choice for a thorough clean inside and out.',
    shortDescription: 'Complete exterior & interior service',
    price: 65,
    durationMinutes: 90,
    category: 'premium',
    features: [
      'Everything in Premium Exterior',
      'Interior vacuum',
      'Dashboard & console wipe',
      'Window cleaning (inside)',
      'Floor mat cleaning',
      'Seat cleaning',
      'Cup holder cleaning',
      'Air vent dusting',
      'Air freshener',
    ],
    sortOrder: 3,
  },
  {
    name: 'Full Detailing',
    slug: 'full-detailing',
    description: 'Comprehensive detailing service for the ultimate clean. This premium package includes deep cleaning, paint correction, leather conditioning, and restoration of all surfaces. Your car will look showroom-new.',
    shortDescription: 'Complete interior & exterior detailing',
    price: 120,
    durationMinutes: 180,
    category: 'detailing',
    features: [
      'Complete exterior detail',
      'Clay bar treatment',
      'Paint correction',
      'Ceramic coating',
      'Full interior shampoo',
      'Leather conditioning',
      'Fabric protection',
      'Engine bay cleaning',
      'Headlight restoration',
      'Scratch removal',
      'Odor elimination',
      'UV protectant application',
    ],
    sortOrder: 4,
  },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mecantosh';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Clearing existing services...');
    await Service.deleteMany({});
    console.log('Existing services cleared');

    console.log('Seeding services...');
    const insertedServices = await Service.insertMany(services);
    console.log(`${insertedServices.length} services seeded successfully!`);

    console.log('\nSeeded Services:');
    console.log('================');
    for (const service of insertedServices) {
      console.log(`- ${service.name}: $${service.price} (${service.durationMinutes} mins)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
