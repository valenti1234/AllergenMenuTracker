#!/bin/bash

# Define server URL
SERVER="http://localhost:5050"

# Step 1: Login to get authentication cookie
echo "Logging in with provided credentials..."
curl -X POST $SERVER/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"valenti1234", "password":"Itnelav3465#"}' \
  -c cookies.txt \
  -v

echo -e "\n\nWaiting 2 seconds..."
sleep 2

# Step 2: Test session to verify we're authenticated
echo -e "\nVerifying authentication..."
curl -b cookies.txt $SERVER/api/admin/session \
  -H "Accept: application/json" \
  -v

echo -e "\n\nWaiting 2 seconds..."
sleep 2

# Step 3: Try to access recipe mappings
echo -e "\nAttempting to access recipe mappings..."
curl -b cookies.txt $SERVER/api/recipe-mappings \
  -H "Accept: application/json" \
  -v

echo -e "\n\nTest complete." 