#! /bin/bash
# npm adduser --registry http://localhost:4873
curl -XPUT -H "Content-type: application/json" -d '{ "name": "ndk", "password": "letMeIn@34", "email": "ndk@jwtsmith.com" }' 'http://localhost:4873/-/user/org.couchdb.user:ndk'