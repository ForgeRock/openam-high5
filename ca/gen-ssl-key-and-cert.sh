#!/bin/bash

. ./ca.properties

KEYTOOL=/opt/java/jdk/bin/keytool

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
KEY_FILE_NO_PIN=${DIR}/${HOSTNAME}-key-no-pin.pem
P12_FILE=${DIR}/${HOSTNAME}-key.p12
JKS_FILE=${DIR}/${HOSTNAME}-key.jks
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

printf "INFO: Generating PEM with private key but without passphrase\n"
openssl rsa -in ${KEY_FILE} -passin pass:${PIN} -out ${KEY_FILE_NO_PIN}
if [ $? -ne 0 ]; then
  echo "ERROR: OpenSSL error $?."
  exit 1
fi

printf "INFO: Generating a .p12 for /CN=${HOSTNAME}\n"
openssl pkcs12 -export -out ${P12_FILE} -inkey ${KEY_FILE} -in ${CERT_FILE} -certfile ${CA_CERT} -passin pass:${PIN} -passout pass:${PIN}
if [ $? -ne 0 ]; then
  echo "ERROR: OpenSSL error $?."
  exirtFailure
fi

printf "INFO: Generating Java Keystore (.jks) for /CN=${HOSTNAME}\n"
${KEYTOOL} -genkey -alias foo -keystore ${JKS_FILE} -storepass ${PIN} -dname cn=foo -keypass bogusbogus
${KEYTOOL} -delete -alias foo -keystore ${JKS_FILE} -storepass ${PIN}

${KEYTOOL} -importkeystore -srckeystore ${P12_FILE} -srcstoretype pkcs12 -srcalias 1 -srcstorepass ${PIN} -destkeystore ${JKS_FILE} -deststoretype jks -deststorepass ${PIN} -destalias ${HOSTNAME} -noprompt
#${KEYTOOL} -importkeystore -srckeystore ${P12_FILE} -srcstoretype pkcs12 -srcstorepass ${PIN} -destkeystore ${JKS_FILE} -deststoretype jks -deststorepass ${PIN}  -noprompt
if [ $? != 0 ]; then
  printf "ERROR: Failed to import server key into keystore at ${JKS_FILE}.\n"
  exit 1
fi

printf "INFO: Key files are ${KEY_FILE}, ${P12_FILE} and ${JKS_FILE}\n"
printf "INFO: Certificate file is ${CERT_FILE}\n"
printf "INFO: Certificate content:\n"
openssl x509 -in ${CERT_FILE} -noout -fingerprint -subject -dates -serial -issuer
printf "INFO: Jave keystore content (${JKS_FILE}):\n"
${KEYTOOL} -list -keystore ${JKS_FILE} -storepass ${PIN}

