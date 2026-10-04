import mongoose from 'mongoose';
import dns from 'dns';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  // Some Windows environments block the system DNS resolver for SRV queries.
  // Force Node's dns module to use public DNS servers (can be overridden via env).
  const dnsServers = [
    process.env.DNS1 || '8.8.8.8',
    process.env.DNS2 || '1.1.1.1',
  ];
  dns.setServers(dnsServers);
  console.log('🔎 DNS servers set to', dns.getServers());

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
