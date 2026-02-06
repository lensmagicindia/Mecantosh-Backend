import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import AdminUser from '../src/models/AdminUser.model.js';

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@mecantosh.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@mecantosh.com');
      process.exit(0);
    }

    // Create admin user
    const admin = await AdminUser.create({
      email: 'admin@mecantosh.com',
      password: 'Admin@123',
      name: 'Admin User',
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: Admin@123');
    console.log('Role:', admin.role);
    console.log('\nPlease change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
