#!/bin/bash

. ./ca.properties

#
# First check if the CA files already exist
# Note that the CA cert must be distributed to browsers etc., that's why it should be regenerated only with reason
#
if [ -f ${CA_KEY} ]; then
  printf "ERROR: The CA key file ${CA_KEY} already exists. It must be removed manually to proceed.\n"
  exit 1
fi

if [ -f ${CA_CERT} ]; then
  printf "ERROR: The CA certificate file ${CA_CERT} already exists. It must be removed manually to proceed.\n"
  exit 1
fi

#
# Now generate key material for the CA and self sign it
#

printf "INFO: Generating CA's private key (${CA_KEY}).\n"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -des3 -outform pem -out ${CA_KEY} -pass pass:${CA_KEY_PIN}
RC=$?
if [ ${RC} != 0 ]; then
  printf "ERROR: openssl returned error ${RC}. Aborting.\n"
fi

printf "INFO: Self sign the CA's public key(${CA_CERT}).\n"
openssl req -x509 -new -nodes -key ${CA_KEY} -days 3650 -out ${CA_CERT} -passin pass:${CA_KEY_PIN} -subj "/CN=${CA_SUBJECT_CN}" -sha256
RC=$?
if [ ${RC} != 0 ]; then
  printf "ERROR: openssl returned error ${RC}. Aborting.\n"
fi

printf "INFO: Printing CA certificate:\n"
#openssl x509 -in ${CA_CERT} -noout -text
openssl x509 -in ${CA_CERT} -noout -subject -dates -fingerprint -serial -issuer
