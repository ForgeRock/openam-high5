#!/bin/bash -x

. ./ca.properties

if [ $# -ne 2 ]; then
  echo "Usage: $0 <fqdn> <pin>"
  echo "Example: $0 www.lesite.com 123456"
  exit 1
fi

HOSTNAME=$1
PIN=$2

DIR=certs
CERT_FILE=${DIR}/${HOSTNAME}-cert.pem
KEY_FILE=${DIR}/${HOSTNAME}-key.pem
CSR_FILE=${DIR}/${HOSTNAME}-csr.pem

if [ ! -d ${DIR} ]; then
  mkdir ${DIR}
fi

printf "INFO: Generating CSR for /CN=${HOSTNAME}\n"
openssl req -new -subj "/CN=${HOSTNAME}" -out ${CSR_FILE} -keyout ${KEY_FILE} -passout pass:${PIN}
if [ $? -ne 0 ]; then
  echo "ERROR: OpenSSL error $?."
  exit 1
fi

printf "INFO: Signing CSR for /CN=${HOSTNAME}\n"
openssl x509 -req -days 3650 -in ${CSR_FILE} -CA ${CA_CERT} -CAkey ${CA_KEY} -CAcreateserial -out ${CERT_FILE} -passin pass:${CA_KEY_PIN} -sha256
if [ $? -ne 0 ]; then
  echo "ERROR: OpenSSL error $?."
  exit 1
fi

printf "INFO: Key file is ${KEY_FILE}\n"
printf "INFO: Certificate file is ${CERT_FILE}\n"
printf "INFO: Certificate content:\n"
openssl x509 -in ${CERT_FILE} -noout -fingerprint -subject -dates -serial -issuer

