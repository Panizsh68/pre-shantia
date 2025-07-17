#!/bin/bash
echo "🌱 Waiting for Mongo to be ready..."

until mongosh --host mongo --eval "print('Mongo is ready')" &>/dev/null; do
  echo "⏳ Still waiting for Mongo..."
  sleep 2
done

echo "✅ Mongo is ready. Setting up replica set..."

mongosh --host mongo <<EOF
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "mongo:27017" }]
})
EOF

echo "✅ Replica Set Initialized"
