#!/bin/bash

# Setup script for Kitoko application

echo "Setting up Kitoko application..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Initialize database
echo "Initializing database..."
psql -U cse340 -d kitoko -f init-database.sql

# Create test accounts
echo "Creating test accounts..."
node setup-accounts.js

# Start the application
echo "Starting application..."
npm run dev