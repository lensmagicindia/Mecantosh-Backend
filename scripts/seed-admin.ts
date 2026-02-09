import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import AdminUser from '../src/models/AdminUser.model.js';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_SEED_EMAIL || 'admin@mecantosh.com';

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email:', email);
      process.exit(0);
    }

    // Use env var password or generate a secure random one
    let password = process.env.ADMIN_SEED_PASSWORD;
    let wasGenerated = false;

    if (!password) {
      password = crypto.randomBytes(16).toString('base64url');
      wasGenerated = true;
    }

    // Create admin user
    const admin = await AdminUser.create({
      email,
      password,
      name: 'Admin User',
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    if (wasGenerated) {
      console.log('Generated password:', password);
      console.log('\n⚠  SAVE THIS PASSWORD NOW — it will not be shown again.');
    } else {
      console.log('Password: (set via ADMIN_SEED_PASSWORD env var)');
    }
    console.log('Role:', admin.role);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
